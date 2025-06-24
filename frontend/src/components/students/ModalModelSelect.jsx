import React, { useEffect, useState } from 'react';
import { studentApi } from '../../services/api';

const ModalModelSelect = ({ isOpen, onClose, onSelectModel }) => {
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadModels();
    }
  }, [isOpen]);

  const loadModels = async () => {
    try {
      const response = await studentApi.listAllModels();
      setModels(response.data);
    } catch (error) {
      console.error('Error loading models:', error);
    }
  };

  const handleSubmit = () => {
    if (selectedModel) {
      onSelectModel(selectedModel);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-lg">
        <h2 className="text-xl font-semibold mb-4">Выберите модель для предсказания</h2>
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          className="w-full mb-4 p-2 border rounded"
        >
          <option value="">-- Выберите модель --</option>
          {models.map((model) => (
            <option key={model.name} value={model.name}>
              {model.name}
            </option>
          ))}
        </select>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded"
          >
            Отмена
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedModel}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
          >
            Предсказать
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalModelSelect;
