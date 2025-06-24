import os
import json
from datetime import datetime
from typing import Any
import shutil
import joblib
import pandas as pd


class ModelStorageManager:
    def __init__(self, base_dir: str = "models"):
        self.base_dir = base_dir
        os.makedirs(self.base_dir, exist_ok=True)

    def _get_model_dir(self, model_name: str) -> str:
        return os.path.join(self.base_dir, model_name)

    def _get_path(self, model_name: str, filename: str) -> str:
        return os.path.join(self._get_model_dir(model_name), filename)

    def save(
        self,
        direction_id: int,
        model_name: str,
        model: Any,
        train_data,
        feature_columns: list[str],
        processor: Any  = None,
        metrics: dict | None = None
    ):
        model_dir = self._get_model_dir(model_name)
        os.makedirs(model_dir, exist_ok=True)

        # Сохраняем модель
        joblib.dump(model, self._get_path(model_name, "model.pkl"))

        # Сохраняем препроцессор (если есть)
        if processor:
            joblib.dump(processor, self._get_path(model_name, "processor.pkl"))

        if train_data is not None:
            joblib.dump(train_data, self._get_path(model_name, "train_data.pkl"))

        meta = {
            "feature_columns": feature_columns or [],
            "metrics": metrics or {},
            "saved_at": datetime.now().isoformat(),
            "direction_id": direction_id,
        }
        with open(self._get_path(model_name, "meta.json"), "w", encoding="utf-8") as f:
            json.dump(meta, f, ensure_ascii=False, indent=4)

    def load(self, model_name: str):
        """Загружает модель, препроцессор и метаинформацию"""
        model_dir = self._get_model_dir(model_name)
        if not os.path.exists(model_dir):
            raise FileNotFoundError(f"Модель '{model_name}' не найдена в {model_dir}")

        try:
            train_data = joblib.load(self._get_path(model_name, "train_data.pkl"))
        except FileNotFoundError:
            train_data = None

        # Загрузка модели и препроцессора
        model = joblib.load(self._get_path(model_name, "model.pkl"))
        processor_path = self._get_path(model_name, "processor.pkl")
        processor = joblib.load(processor_path) if os.path.exists(processor_path) else None

        # Загрузка и преобразование метаданных
        with open(self._get_path(model_name, "meta.json"), encoding="utf-8") as f:
            meta = json.load(f)

        # Восстановление DataFrame для метрик (при необходимости)
        metrics = meta.get("metrics", {})
        restored_metrics = {
            "performance_metrics": pd.DataFrame.from_dict(
                metrics.get("performance_metrics", {}),
                orient="index"
            ).reset_index().rename(columns={"index": "Metric", 0: "Value"}),

            "classification_report": pd.DataFrame(
                metrics.get("classification_report", {})
            ).T,

            "confusion_matrix": pd.DataFrame(
                metrics.get("confusion_matrix", {})
            ),

            "model_statistics": pd.DataFrame(
                metrics.get("model_statistics", [])
            )
        }

        return {
            "model": model,
            "processor": processor,
            "X_train": train_data,
            "feature_columns": meta.get("feature_columns", []),
            "metrics": {**metrics},
            "direction_id": meta.get("direction_id"),
        }

    def delete(self, model_name: str):
        """Удаляет директорию с моделью и всеми связанными файлами"""
        model_dir = self._get_model_dir(model_name)
        if not os.path.exists(model_dir):
            raise FileNotFoundError(f"Модель '{model_name}' не найдена для удаления.")
        shutil.rmtree(model_dir)
