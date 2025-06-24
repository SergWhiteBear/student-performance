from abc import ABC, abstractmethod

from app.ml_model.services.storage_manager import ModelStorageManager


class IMLModelRepository(ABC):

    @abstractmethod
    def fit(self, X_train, y_train):
        raise NotImplementedError

    @abstractmethod
    def predict(self, X_test):
        raise NotImplementedError

    @abstractmethod
    def evaluate(self, X_test, y_test):
        raise NotImplementedError

    @abstractmethod
    def calculate_marginal_effects(self, X_values):
        raise NotImplementedError

    @abstractmethod
    def get_margin_effect(
            self,
            target_name: str,
            x_values: list,
            fix_method: str
    ):
        raise NotImplementedError

    @abstractmethod
    def save_model(self, model_name: str, direction_id: int):
        raise NotImplementedError

    @abstractmethod
    def load_model(
            cls,
            model_name: str,
            storage_manager: ModelStorageManager = None,
            model_type="logit",
            add_constant=True,
    ):
        raise NotImplementedError
