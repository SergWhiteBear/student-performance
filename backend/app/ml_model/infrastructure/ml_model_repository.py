import numpy as np
import pandas as pd
from scipy.stats import norm, chi2
from sklearn.metrics import accuracy_score, classification_report, roc_auc_score, log_loss
import statsmodels.api as sm

from app.ml_model.domain.interfaces.ml_model_repository import IMLModelRepository
from app.ml_model.services.storage_manager import ModelStorageManager


class MLModelRepository(IMLModelRepository):
    def __init__(self, storage_manager: ModelStorageManager = ModelStorageManager(), model_type='logit',
                 add_constant=True):
        self.model = None
        self.result = None
        self.add_constant = add_constant
        self.model_type = model_type.lower()
        self.storage_manager = storage_manager
        self.X_train = None
        self.metrics = None
        self.feature_columns = None

        if self.model_type not in ['logit', 'probit']:
            raise ValueError("Недопустимый тип модели. Используйте 'logit' или 'probit'")

    def fit(self, X_train, y_train):
        self.X_train = X_train
        if self.add_constant:
            self.X_train = sm.add_constant(self.X_train, has_constant="add")
        if self.model_type == 'logit':
            self.model = sm.Logit(y_train, self.X_train)
        elif self.model_type == 'probit':
            self.model = sm.Probit(y_train, self.X_train)

        self.result = self.model.fit(method="bfgs", disp=False)
        return self.result

    def predict(self, X_test):
        if self.add_constant:
            X_test = sm.add_constant(X_test, has_constant="add")

        y_prob = self.result.predict(X_test)
        y_class = (y_prob >= 0.5).astype(int)
        return y_prob, y_class

    def evaluate(self, X_test, y_test):
        if not self.result:
            raise ValueError("Модель не обучена. Сначала вызовите метод fit()")

        y_prob, y_class = self.predict(X_test)

        # Базовые метрики
        accuracy = accuracy_score(y_test, y_class)
        roc_auc = roc_auc_score(y_test, y_prob)
        log_loss_val = log_loss(y_test, y_prob)
        pseudo_r2_mcfadden = self.result.prsquared

        # Расширенные метрики
        n = len(y_test)
        n1 = y_test.sum()
        p0 = n1 / n  # Доля успехов

        # 1. Критерий отношения правдоподобия (LR)
        lnL = self.result.llf  # Логарифм правдоподобия текущей модели
        lnL0 = self.result.llnull
        LR = 2 * (lnL - lnL0)

        # 2. Расчет хи-квадрат статистики и p-значения
        k = len(self.result.params) - 1  # Число предикторов (исключая константу)
        p_value = chi2.ppf(0.95, k)

        # 3. Псевдо-R²
        pseudo_r2 = 1 - 1 / (1 + 2 * (lnL - lnL0) / n)

        # 4. R² прогноза (Rp²)
        wr1 = 1 - accuracy  # Доля ошибок текущей модели
        wr0 = min(p0, 1 - p0)  # Доля ошибок тривиальной модели
        rp2 = 1 - (wr1 / wr0) if wr0 != 0 else np.nan

        # 5. Таблица попаданий и промахов
        conf_matrix = pd.crosstab(y_test, y_class, rownames=["Факт"], colnames=["Прогноз"])
        n00 = conf_matrix[0][0] if 0 in conf_matrix.columns else 0
        n11 = conf_matrix[1][1] if 1 in conf_matrix.columns else 0
        w = (n00 + n11) / n * 100  # Процент правильных прогнозов

        metrics = {
            "Model Type": self.model_type.upper(),
            "Accuracy": float(accuracy),
            "ROC AUC": float(roc_auc),
            "Log Loss": float(log_loss_val),
            "Pseudo R² (McFadden)": float(pseudo_r2_mcfadden),
            "LR0": float(lnL0),
            "LRF": float(lnL),
            "Likelihood Ratio (LR)": float(LR),
            "Pseudo R²": float(pseudo_r2),
            "Rp² (Prediction Quality)": float(rp2),
            "Correct Predictions (%)": float(w),
            "chi2": p_value,
        }

        # Дополнительные отчеты
        clf_report = classification_report(y_test, y_class, output_dict=True)
        model_stats = pd.DataFrame({
            "Feature": self.result.params.index,
            "Coefficient": self.result.params.values.astype(float),
            "P-value": self.result.pvalues.values.astype(float),
            "Std Error": self.result.bse.values.astype(float)
        }).to_dict(orient="records")

        self.metrics = {
            "performance_metrics": metrics,
            "classification_report": clf_report,
            "confusion_matrix": conf_matrix.to_dict(),
            "model_statistics": model_stats
        }
        return self.metrics

    def calculate_marginal_effects(self, X: pd.DataFrame) -> pd.DataFrame:
        X_proc = X.copy()
        if self.add_constant and 'const' not in X_proc.columns:
            X_proc = sm.add_constant(X_proc, has_constant='add')

        lin_pred = np.dot(X_proc, self.result.params)

        if self.model_type == "logit":
            probs = 1 / (1 + np.exp(-lin_pred))
            grad = probs * (1 - probs)
        elif self.model_type == "probit":
            probs = norm.cdf(lin_pred)
            grad = norm.pdf(lin_pred)
        else:
            raise ValueError("Неподдерживаемый тип модели")

        effects = {}
        for col in X_proc.columns:
            if col in self.result.params:
                effects[col] = grad * self.result.params[col]
                print(f"Debug: col: {col}, effects: {effects}, result: {self.result.params[col]}")
            else:
                effects[col] = np.zeros(len(X_proc))

        return pd.DataFrame(effects)

    def get_margin_effect(
            self,
            target_name: str,
            x_values: list[float],
            fix_method: str = "median"
    ) -> dict[str, list[float]]:
        """
        Рассчитывает предельный эффект ∂P/∂X_target при прочих равных.
        Возвращает список эффектов для каждого x в x_values.
        """
        if not self.result:
            raise ValueError("Модель не обучена. Сначала вызовите fit()")

        params = self.result.params
        if target_name not in params.index:
            raise ValueError(f"Признак {target_name} отсутствует в модели")

        # 1) Средние (или медианные) значения всех признаков, кроме целевого
        feats = [f for f in params.index if f not in ("const", target_name)]
        df = self.X_train.copy()
        if fix_method == "mean":
            fixed = df[feats].mean().to_dict()
        else:
            fixed = df[feats].median().to_dict()

        # 2) Собираем X_custom по одной колонке
        rows = []
        for x in x_values:
            row = {**fixed, target_name: x}
            rows.append(row)
        X_custom = pd.DataFrame(rows)

        # 3) Добавляем константу, если нужно
        if self.add_constant:
            X_custom = sm.add_constant(X_custom, has_constant="add")

        # 4) Вычисляем линейный предикт и градиент
        lin = np.dot(X_custom, params)
        if self.model_type == "logit":
            p = 1 / (1 + np.exp(-lin))
            grad = p * (1 - p)
        else:  # probit
            p = norm.cdf(lin)
            grad = norm.pdf(lin)

        # 5) Маржинальный эффект только для target_name
        beta_k = params[target_name]
        me = (grad * beta_k).tolist()

        return {"effects": me}

    def save_model(self, model_name: str, direction_id: int):
        """Сохраняет модель, метрики и препроцессор через ModelStorageManager"""
        if not self.result:
            raise ValueError("Модель не обучена. Сначала вызовите метод fit()")

        feature_columns = [
            col for col in self.X_train.columns.tolist()
            if col != "const"
        ] if self.X_train is not None else []

        self.storage_manager.save(
            direction_id=direction_id,
            model_name=model_name,
            model=self.result,
            train_data=self.X_train,
            feature_columns=feature_columns,
            metrics=self.metrics,
        )

    @classmethod
    def load_model(
            cls,
            model_name: str,
            storage_manager: ModelStorageManager = None,
            model_type="logit",
            add_constant=True,
    ) -> "MLModelRepository":
        """Загружает модель и восстанавливает состояние репозитория"""
        storage_manager = storage_manager or ModelStorageManager()
        loaded_data = storage_manager.load(model_name)

        # Создаем экземпляр репозитория
        repo = cls(
            model_type=model_type,
            add_constant=add_constant,
            storage_manager=storage_manager,
        )

        # Восстанавливаем состояние
        repo.result = loaded_data["model"]
        repo.X_train = pd.DataFrame(columns=loaded_data["feature_columns"])
        repo.metrics = loaded_data["metrics"]
        repo.processor = loaded_data["processor"]
        repo.X_train = loaded_data["X_train"]

        return repo


# Проверка
if __name__ == "__main__":
    data = pd.DataFrame({
        'my_X': [7, 15, 16, 15, 8, 4, 18, 2, 22, 6, 30, 1, 30, 5, 20, 13, 9, 32, 4, 13, 9, 4, 28, 22, 18],
        'y': [0, 0, 0, 1, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 1, 1]
    })

    repo = MLModelRepository(add_constant=True, )
    result = repo.fit(data[['my_X']], data['y'])

    y_prob, y_class = repo.predict(data[['my_X']])
    # print("Probabilities:\n", y_prob)
    # print("Classes:\n", y_class)

    X_custom = pd.DataFrame({
        'my_X': [1, 5, 10, 15, 20, 25, 30]
    })

    marginal_eff = repo.get_margin_effect(target_name='my_X', x_values=[1, 5, 10, 15, 20, 25, 30])
    print(marginal_eff)

    # print()
