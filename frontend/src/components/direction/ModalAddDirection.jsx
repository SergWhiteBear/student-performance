import React, { useState } from 'react';
import { studentApi } from '../../services/api';

export const ModalAddDirection = ({ isOpen, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [id, setId] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    await studentApi.createDirection(Number(id), name);
    setName('');
    setId('');
    onSuccess();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-80">
        <h2 className="text-lg font-semibold mb-4">Добавить набор данных</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Введите название"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full border px-3 py-2 rounded"
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="text-gray-600 hover:underline">
              Отмена
            </button>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Добавить
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
