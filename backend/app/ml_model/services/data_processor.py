from sklearn.preprocessing import StandardScaler
import pandas as pd


class DataProcessor:
    def __init__(self, scaler=None):
        self.y = None
        self.fio = None
        self.scaler = scaler if scaler else StandardScaler()

    def fit_transform(self, df: pd.DataFrame, target_col: str, fio_col: str):
        """Обучает стандартизатор и подготавливает данные."""
        self.fio = df[fio_col]  # Сохраняем ФИО
        self.y = df[target_col]  # Целевая переменная
        X = df.drop(columns=[target_col, fio_col])
        # Обучаем scaler
        self.scaler.fit(X)
        X = X.applymap(lambda x: int(x) if isinstance(x, bool) else x)
        X_scaled = X

        return pd.DataFrame(X_scaled, columns=X.columns), self.y, self.fio

    def transform(self, df: pd.DataFrame):
        """Применяет уже обученный стандартизатор к новым данным."""
        X_scaled = self.scaler.transform(df)
        return pd.DataFrame(X_scaled, columns=df.columns)


    def inverse_transform(self, df_scaled: pd.DataFrame):
        """Обратная трансформация"""
        X_inverse = self.scaler.inverse_transform(df_scaled)
        return pd.DataFrame(X_inverse, columns=df_scaled.columns)