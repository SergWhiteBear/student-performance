import numpy as np
import pandas as pd
from scipy.optimize import minimize
from scipy.stats import norm

class BinaryModel:
    def __init__(self):
        self._named_weights = None
        self._weights = None  # Переменная для хранениня весов (бета)
        self.log_likelihood = None
        self.params = None

    @staticmethod
    def _model_fun(x) -> float:
        """
        Функция распределения (переопределяется для каждой модели своя).
        Например, для логит-модели это будет сигмоида, а для пробит - кумулятивная функция нормального распределения.
        """
        pass

    def _log_loss(self, weights, x, y, epsilon=1e-12):
        """
        Логистическая потеря (лог-лосс) для оптимизации.
        :param weights: веса модели (бета)
        :param x: входные данные (факторы)
        :param y: истинные значения целевой переменной
        :return: Значение лог-лосса (для минимизации)
        """
        z = np.dot(x, weights)
        y_pred = self._model_fun(z)
        y_pred = np.clip(y_pred, epsilon, 1 - epsilon)  # Защита от log(0)
        log_loss = -np.mean(y * np.log(y_pred) + (1 - y) * np.log(1 - y_pred))
        return log_loss

    def get_log_loss(self, x, y, epsilon=1e-12):
        """Вычисление лог-лосса для текущих весов."""
        x = np.concatenate([x, np.ones((x.shape[0], 1))], axis=1)
        z = np.dot(x, self._weights)
        y_pred = self._model_fun(z)
        y_pred = np.clip(y_pred, epsilon, 1 - epsilon)
        return -np.mean(y * np.log(y_pred) + (1 - y) * np.log(1 - y_pred))

    def _log_likelihood(self, weights, x, y, epsilon=1e-12):
        """
        Логарифм правдоподобия для оптимизации.
        :param weights: веса модели (бета)
        :param x: входные данные (факторы)
        :param y: истинные значения целевой переменной
        :return: Значение логарифма правдоподобия (для максимизации)
        """
        z = np.dot(x, weights)
        y_pred = self._model_fun(z)
        ll = np.sum(y * np.log(y_pred) + (1 - y) * np.log(1 - y_pred))
        return -ll  # Минус для минимизации

    def get_log_likelihood(self, x, y, epsilon=1e-12):
        """Вычисление логарифма правдоподобия для текущих весов."""
        x = np.concatenate([x, np.ones((x.shape[0], 1))], axis=1)
        z = np.dot(x, self._weights)
        y_pred = self._model_fun(z)
        y_pred = np.clip(y_pred, epsilon, 1 - epsilon)
        log_likelihood = np.sum(y * np.log(y_pred) + (1 - y) * np.log(1 - y_pred))
        return log_likelihood

    def fit(self, x, y):
        """
        Метод для обучения модели. Вычисляет веса (бета) с использованием минимизации логарифма правдоподобия.
        :param x: Входные данные (факторы)
        :param y: Истинные значения целевой переменной
        :return: обученная модель
        """
        if isinstance(x, pd.DataFrame):
            feature_names = x.columns.tolist()
            x_values = x.values  # Преобразуем в numpy-массив
        else:
            feature_names = [f"feature_{i}" for i in range(x.shape[1])]
            x_values = x
        x_values = np.concatenate([x_values, np.ones((x_values.shape[0], 1))], axis=1)
        feature_names.append("intercept")

        # Оптимизация весов
        initial_weights = np.zeros(x_values.shape[1])
        result = minimize(self._log_likelihood, initial_weights, args=(x_values, y), method='BFGS')
        self._weights = result.x
        # Сохраняем веса с именами
        self.params = pd.DataFrame(zip(feature_names, self._weights))

        return self

    def predict_proba(self, x) -> np.array:
        """
        Метод для получения предсказанных вероятностей (оценки P(y=1|x)).
        :return: Вероятности принадлежности к классу 1
        """
        x = np.concatenate([x, np.ones((x.shape[0], 1))], axis=1)  # Добавление столбца единиц для смещения
        z = np.dot(x, self._weights)  # Линейная комбинация факторов и весов
        return self._model_fun(z)

    def predict(self, x) -> np.array:
        """
        Метод для получения предсказаний (0 или 1).
        :return: Классы, предсказанные моделью (0 или 1)
        """
        proba = self.predict_proba(x)
        return np.where(proba >= 0.5, 1, 0)  # Если вероятность >= 0.5, то предсказываем 1, иначе 0

    def log_likelihood_long(self, x, y) -> float:
        """
        Рассчитывает логарифм правдоподобия для модели с текущими весами.
        :return: Логарифм правдоподобия для текущих предсказаний
        """
        x = np.concatenate([x, np.ones((x.shape[0], 1))], axis=1)
        z = np.dot(x, self._weights)
        y_pred = self._model_fun(z)
        epsilon = 1e-10  # Добавляем малое значение для стабилизации
        y_pred = np.clip(y_pred, epsilon, 1 - epsilon)
        log_likelihood = np.sum(y * np.log(y_pred) + (1 - y) * np.log(1 - y_pred))
        return log_likelihood

    def log_likelihood_short(self, y) -> float:
        """
        Рассчитывает логарифм правдоподобия для короткой модели, где все коэффициенты равны нулю,
        кроме константы, равной логит-преобразованию среднего значения целевой переменной.
        :param y: Истинные значения целевой переменной
        :return: Логарифм правдоподобия для короткой модели
        """
        mean_y = np.mean(y)
        # Для пробит-модели используем квантиль нормального распределения
        if isinstance(self, ProbitModel):
            b_0 = norm.ppf(mean_y)
        else:
            b_0 = np.log(mean_y / (1 - mean_y))
        y_pred = self._model_fun(b_0)
        epsilon = 1e-10
        y_pred = np.clip(y_pred, epsilon, 1 - epsilon)
        log_likelihood_short = np.sum(y * np.log(y_pred) + (1 - y) * np.log(1 - y_pred))
        return log_likelihood_short

    def get_margin_effect(self, x):
        """
        Метод для вычисления маржинального эффекта (среднего изменения вероятности при изменении признаков).
        :param x: Входные данные
        :return: Маржинальный эффект (в данном случае не реализован)
        """
        return None

    def get_mean_margin_effect(self, x):
        """
        Метод для вычисления среднего маржинального эффекта.
        :param x: Входные данные
        :return: Средний маржинальный эффект (в данном случае не реализован)
        """
        return None


class LogitModel(BinaryModel):
    """
    Класс для логит-модели (модели логистической регрессии).
    """

    @staticmethod
    def _model_fun(x):
        """
        Логистическая функция (сигмоида) для логит-модели.
        """
        x = np.array(x, dtype=float)
        return 1 / (1 + np.exp(-x))  # Сигмоида

    def get_margin_effect(self, x):
        """
        Метод для вычисления маржинального эффекта для логит-модели.
        :param x: Входные данные
        :return: Маржинальный эффект
        """
        x = np.concatenate([x, np.ones((x.shape[0], 1))], axis=1)
        z = np.dot(x, self._weights)
        proba = self._model_fun(z)
        margin_effect = (proba * (1 - proba))[:, np.newaxis] * self._weights
        return margin_effect

    def get_mean_margin_effect(self, x):
        """
        Метод для вычисления среднего маржинального эффекта.
        :param x: Входные данные
        :return: Средний маржинальный эффект
        """
        mean_x = np.mean(x)
        mean_x = np.append(mean_x, 1)  # Добавление единицы для смещения
        z = np.dot(mean_x, self._weights)
        proba = self._model_fun(z)
        mean_margin_effect = proba * (1 - proba) * self._weights
        return mean_margin_effect


class ProbitModel(BinaryModel):
    """
    Класс для пробит-модели, где используется кумулятивная функция нормального распределения.
    """

    @staticmethod
    def _model_fun(z):
        """
        Кумулятивная функция нормального распределения для пробит-модели.
        """
        return norm.cdf(z)

    @staticmethod
    def _density_function(x):
        """
        Плотность нормального распределения для пробит-модели.
        :param x: Значение
        :return: Плотность распределения в точке x
        """
        return 1 / np.sqrt(2 * np.pi) * np.exp(-x ** 2 / 2)

    def get_margin_effect(self, x):
        """
        Метод для вычисления маржинального эффекта для пробит-модели.
        :param x: Входные данные
        :return: Маржинальный эффект
        """
        x = np.concatenate([x, np.ones((x.shape[0], 1))], axis=1)
        z = np.dot(x, self._weights)
        density = self._density_function(z)
        margin_effect = self._density_function(z)[:, np.newaxis] * self._weights
        return margin_effect

    def get_mean_margin_effect(self, x):
        """
        Метод для вычисления среднего маржинального эффекта для пробит-модели.
        :param x: Входные данные
        :return: Средний маржинальный эффект
        """
        mean_x = np.array([np.mean(x)])
        mean_x = np.append(mean_x, 1)  # Добавление единицы для смещения
        z = np.dot(mean_x, self._weights)
        density = self._density_function(z)
        mean_margin_effect = self._density_function(z) * self._weights
        return mean_margin_effect


def get_lr(model, x, y):
    """
    Вычисляет статистику LR (Likelihood Ratio Test) для модели.
    :param model: Модель (логит или пробит)
    :return: Значение статистики LR, а также значения логарифмов правдоподобия для короткой и полной модели
    """
    l_s = model.log_likelihood_short(y)  # Логарифм правдоподобия для короткой модели
    l_l = model.log_likelihood_long(x, y)  # Логарифм правдоподобия для полной модели

    return -2 * (l_s - l_l), l_s, l_l


def get_r2(model, x, y):
    """
    Вычисляет псевдо R² для модели.
    :param model: Модель (логит или пробит)
    :return: Псевдонастоящее R²
    """
    return 1 - (model.log_likelihood_long(x, y) / model.log_likelihood_short(y))


def get_McFadden_r2(model, x, y):
    """
    Вычисляет R² по методу МакФаддена.
    :param model: Модель (логит или пробит)
    :return: R² МакФаддена
    """
    return 1 - (model.log_likelihood_long(x, y) / model.log_likelihood_short(y))


def get_tp_tn_fp_fn(y_true, y_pred):
    """
    Вычисляет количество истинно положительных (TP), истинно отрицательных (TN),
    ложноположительных (FP) и ложноотрицательных (FN) предсказаний.
    :param y_true: Истинные значения целевой переменной
    :param y_pred: Предсказания модели
    :return: tp, tn, fp, fn
    """
    tp = tn = fp = fn = 0
    for true, pred in zip(y_true, y_pred):
        if true == 1 and pred == 1:
            tp += 1
        elif true == 0 and pred == 0:
            tn += 1
        elif true == 0 and pred == 1:
            fp += 1
        elif true == 1 and pred == 0:
            fn += 1
    return tp, tn, fp, fn


def get_confusion_matrix(y_true, y_pred):
    """
    Создает матрицу путаницы из предсказаний модели.
    :param y_true: Истинные значения целевой переменной
    :param y_pred: Предсказания модели
    :return: Матрица ошибок
    """
    tp, tn, fp, fn = get_tp_tn_fp_fn(y_true, y_pred)
    confusion_matrix = np.array([[tn, fp],
                                 [fn, tp]])
    return confusion_matrix


def get_other_metrics(y_true, y_pred):
    """
    Вычисляет точность (accuracy), точность предсказания (precision) и полноту (recall).
    :param y_true: Истинные значения целевой переменной
    :param y_pred: Предсказания модели
    :return: accuracy, precision, recall
    """
    tp, tn, fp, fn = get_tp_tn_fp_fn(y_true, y_pred)

    accuracy = (tp + tn) / (tp + tn + fp + fn)
    precision = tp / (tp + fp)
    recall = tp / (tp + fn)

    return accuracy, precision, recall


def get_r2_predict(model, x, y):
    """
    Вычисляет R² на основе предсказаний модели.
    :param model: Модель (логит или пробит)
    :param x: Входные данные
    :param y: Истинные значения целевой переменной
    :return: R², основанный на предсказаниях модели
    """
    y_pred = model.predict_proba(x)
    ss_residual = np.sum((y - y_pred) ** 2)
    ss_total = np.sum((y - np.mean(y)) ** 2)
    return 1 - (ss_residual / ss_total)


def get_rp_metric(y, w):
    """
    Рассчитывает метрику качества прогноза R_p.
    :param y: Истинные значения целевой переменной
    :param w: w (доля правильных предсказаний модели)
    :return: R_p
    """
    mean_y = np.mean(y)
    v_wrong_0 = min(mean_y, 1 - mean_y)
    w_0 = v_wrong_0
    if w_0 == 0:
        return np.nan
    rp = 1 - (1 - w) / w_0
    return rp