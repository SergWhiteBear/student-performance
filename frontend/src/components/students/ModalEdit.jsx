import React, { useState, useEffect } from 'react';

const ModalEdit = ({ student, onClose, onSave }) => {
  const [editableStudent, setEditableStudent] = useState(student);

  useEffect(() => {
    setEditableStudent(student);
  }, [student]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditableStudent((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = () => {
    onSave(editableStudent);
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-1/3">
        <h2 className="text-xl font-bold mb-4">Редактирование студента</h2>

        <div className="mb-2">
          <label className="block font-semibold">ФИО</label>
          <input
            type="text"
            name="full_name"
            value={editableStudent.full_name}
            onChange={handleChange}
            className="w-full border rounded p-2"
          />
        </div>

        <div className="mb-2">
          <label className="block font-semibold">Математика</label>
          <input
            type="number"
            name="math_score"
            value={editableStudent.math_score}
            onChange={handleChange}
            className="w-full border rounded p-2"
          />
        </div>

        <div className="mb-2">
          <label className="block font-semibold">Русский язык</label>
          <input
            type="number"
            name="russian_score"
            value={editableStudent.russian_score}
            onChange={handleChange}
            className="w-full border rounded p-2"
          />
        </div>

        <div className="mb-2">
          <label className="block font-semibold">ЕГЭ</label>
          <input
            type="number"
            name="ege_score"
            value={editableStudent.ege_score}
            onChange={handleChange}
            className="w-full border rounded p-2"
          />
        </div>

        <div className="flex justify-between mt-6">
          <button
            onClick={onClose}
            className="bg-gray-300 hover:bg-gray-400 text-black px-4 py-2 rounded mr-2"
          >
            Отмена
          </button>
          <button
            onClick={handleSubmit}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalEdit;
