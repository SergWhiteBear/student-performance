import numpy as np
import pandas as pd

from app.ml_model.domain.interfaces.db_repository import IDBRepository
from app.predict.domain.interfaces.repository import IPredictionRepository
from app.student.domain.interfaces.repository import IStudentRepository


class ProbabilityAnalysisService:
    def __init__(
            self,
            db_repo: IDBRepository,
            student_repo: IStudentRepository,
            prediction_repo: IPredictionRepository,
    ):
        self.db_repo = db_repo
        self.student_repo = student_repo
        self.prediction_repo = prediction_repo

    @staticmethod
    def get_intervals(df: pd.DataFrame, target_feature: str) -> pd.DataFrame:
        df[target_feature] = df[target_feature].apply(lambda x: int(x) if isinstance(x, bool) else x)

        max_target_feature = df[target_feature].max()
        min_target_feature = df[target_feature].min()
        count_rows = len(df)

        if max_target_feature == min_target_feature:
            # Защита от одинаковых значений — создаём один фиктивный интервал
            df['interval'] = f"{min_target_feature:.1f}-{min_target_feature + 1:.1f}"
            return df

        R = max_target_feature - min_target_feature
        r = int(1 + 3.322 * np.log10(count_rows))
        h = R / r
        intervals = [0, min_target_feature + h / 2]
        for i in range(2, r + 2):
            intervals.append(intervals[i - 1] + h)

        labels = [f"{intervals[i]:.1f}-{intervals[i + 1]:.1f}" for i in range(len(intervals) - 1)]

        df['interval'] = pd.cut(
            df[target_feature],
            bins=intervals,
            labels=labels,
            include_lowest=True,
            right=True
        )

        return df

    def compute_mean_probabilities(self, df: pd.DataFrame, target_feature: str) -> dict:
        df_with_intervals = self.get_intervals(df, target_feature)
        mean_prob = df_with_intervals.groupby('interval', observed=True)['predicted_prob'].mean().fillna(0)
        return mean_prob.to_dict()

    async def get_probability_intervals(self, model_id: int, target_feature: str, direction_id: int):
        model = await self.db_repo.get_by_id(model_id)
        if not model:
            raise ValueError(f"Model with id='{model_id}' not found")

        feature_columns = model.features
        if target_feature not in feature_columns:
            raise ValueError(f"Feature '{target_feature}' not in model features")

        students = await self.student_repo.list_by_direction(direction_id=direction_id)
        predictions = await self.prediction_repo.get_prediction_data_by_model_id(model.id)

        students_df = pd.DataFrame([s.__dict__ for s in students])
        predictions_df = pd.DataFrame(predictions, columns=["student_id", "predicted_class", "predicted_prob"])
        merged_df = pd.merge(students_df, predictions_df, left_on="id", right_on="student_id", how="left")

        return self.compute_mean_probabilities(merged_df, target_feature)
