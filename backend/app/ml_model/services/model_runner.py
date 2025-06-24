import pandas as pd
from sklearn.metrics import accuracy_score, roc_auc_score, log_loss, confusion_matrix, classification_report

from .data_processor import DataProcessor
from ..domain.interfaces.ml_model_repository import IMLModelRepository


class BinaryModelRunner:
    def __init__(self, model: IMLModelRepository, processor: DataProcessor, target_col: str, fio_col: str) -> None:
        self.model = model
        self.processor = processor
        self.target_col = target_col
        self.fio_col = fio_col
        self.metrics = {}

    def fit(self, X_train, y_train) -> None:
        self.model.fit(X_train, y_train)

    def evaluate(self, X_test, y_test):
        """
        Вычисляет метрики для тестового набора.
        """
        y_pred_prob, y_pred = self.model.predict(X_test)
        metrics = self.model.evaluate(X_test, y_test)
        # Считаем метрики
        self.metrics["accuracy"] = metrics
        self.metrics["log_likelihood_long"] = self.model.log_likelihood_long(X_test, y_test)
        self.metrics["log_likelihood_short"] = self.model.log_likelihood_short(y_test)
        self.metrics["LR_test"] = -2 * (self.metrics["log_likelihood_short"] - self.metrics["log_likelihood_long"])
        self.metrics["pseudo_r2"] = 1 - (self.metrics["log_likelihood_long"] / self.metrics["log_likelihood_short"])
        self.metrics["roc_auc"] = roc_auc_score(y_test, y_pred)
        self.metrics["log_loss"]= log_loss(y_test, y_pred_prob)
        self.metrics["confusion_matrix"] = str(confusion_matrix(y_test, y_pred))
        self.metrics["classification_report"] = f'\n{classification_report(y_test, y_pred)}'
        return

    def get_results(self, X_test, y_test, fio_test):
        """
        Формирует DataFrame с результатами предсказаний.
        """
        y_pred = self.model.predict(X_test)
        y_pred_prob = self.model.predict_proba(X_test)
        return pd.DataFrame({
            'Predict_Class': y_pred,
            'Pred_Prob': y_pred_prob,
            'True_Class': y_test,
            'ФИО': fio_test
        })

