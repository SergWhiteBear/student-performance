import React, { useState } from 'react';
import { studentApi } from '../../services/api';

export const DirectionCard = ({ direction, onUpdate }) => {
  const [isEditing, setEditing] = useState(false);
  const [name, setName] = useState(direction.name);

  const handleDelete = async () => {
    if (window.confirm(`Удалить "${direction.name}"?`)) {
      await studentApi.deleteDirection(direction.id);
      onUpdate();
    }
  };

  const handleSave = async () => {
    if (name.trim() === '') return;
    await studentApi.updateDirection(direction.id, { name });
    setEditing(false);
    onUpdate();
  };

  return (
    <div className="bg-white shadow rounded p-4 flex justify-between items-center">
      <div>
        {isEditing ? (
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-sm w-full mb-1"
          />
        ) : (
          <p className="text-lg font-medium text-gray-900">{direction.name}</p>
        )}
        <p className="text-sm text-gray-500">ID: {direction.id}</p>
        <p className="text-sm text-gray-500">Кол-во объектов: {direction.count_student}</p>
      </div>
      <div className="flex flex-col gap-1 text-sm items-end">
        {isEditing ? (
          <>
            <button onClick={handleSave} className="text-blue-600 hover:underline">
              Сохранить
            </button>
            <button onClick={() => {
              setEditing(false);
              setName(direction.name); // откат
            }} className="text-gray-500 hover:underline">
              Отмена
            </button>
          </>
        ) : (
          <>
            <button onClick={() => setEditing(true)} className="text-blue-600 hover:underline">
              Редактировать
            </button>
            <button onClick={handleDelete} className="text-red-600 hover:underline">
              Удалить
            </button>
          </>
        )}
      </div>
    </div>
  );
};
