import React, {useState, useEffect} from 'react';

const ModalAdd = ({isOpen, onClose, onSave, directions = [], student = null, isEditMode = false}) => {
    const [formData, setFormData] = useState({
        full_name: '',
        math_score: '',
        russian_score: '',
        ege_score: '',
        session_1_passed: false,
        session_2_passed: false,
        session_3_passed: false,
        session_4_passed: false,
        direction_id: '',
    });

    useEffect(() => {
        if (isOpen) {
            if (isEditMode && student) {
                setFormData({
                    full_name: student.full_name || '',
                    math_score: student.math_score?.toString() || '',
                    russian_score: student.russian_score?.toString() || '',
                    ege_score: student.ege_score?.toString() || '',
                    session_1_passed: student.session_1_passed || false,
                    session_2_passed: student.session_2_passed || false,
                    session_3_passed: student.session_3_passed || false,
                    session_4_passed: student.session_4_passed || false,
                    direction_id: student.direction_id?.toString() || '',
                });
            } else {
                setFormData({
                    full_name: '',
                    math_score: '',
                    russian_score: '',
                    ege_score: '',
                    session_1_passed: false,
                    session_2_passed: false,
                    session_3_passed: false,
                    session_4_passed: false,
                    direction_id: '',
                });
            }
        }
    }, [isOpen, isEditMode, student]);

    const handleInputChange = (e) => {
        const {name, value, type, checked} = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Валидация (можешь расширить)
        if (!formData.full_name.trim()) {
            alert('Введите ФИО');
            return;
        }
        if (!formData.direction_id) {
            alert('Выберите набор данных');
            return;
        }

        // Преобразуем числовые поля
        const preparedData = {
            ...formData,
            math_score: Number(formData.math_score),
            russian_score: Number(formData.russian_score),
            ege_score: Number(formData.ege_score),
            direction_id: Number(formData.direction_id),
        };

        onSave(preparedData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 relative">
                <h2 className="text-xl font-semibold mb-4">{isEditMode ? 'Редактировать студента' : 'Добавить студента'}</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block font-medium mb-1">ФИО</label>
                        <input
                            type="text"
                            name="full_name"
                            value={formData.full_name}
                            onChange={handleInputChange}
                            className="w-full border rounded px-3 py-2"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block font-medium mb-1">Математика</label>
                            <input
                                type="number"
                                name="math_score"
                                value={formData.math_score}
                                onChange={handleInputChange}
                                className="w-full border rounded px-3 py-2"
                                min="0"
                                max="100"
                                required
                            />
                        </div>
                        <div>
                            <label className="block font-medium mb-1">Русский язык</label>
                            <input
                                type="number"
                                name="russian_score"
                                value={formData.russian_score}
                                onChange={handleInputChange}
                                className="w-full border rounded px-3 py-2"
                                min="0"
                                max="100"
                                required
                            />
                        </div>
                        <div>
                            <label className="block font-medium mb-1">Общий балл ЕГЭ</label>
                            <input
                                type="number"
                                name="ege_score"
                                value={formData.ege_score}
                                onChange={handleInputChange}
                                className="w-full border rounded px-3 py-2"
                                min="0"
                                max="300"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map(n => (
                                <label key={n} className="inline-flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        name={`session_${n}_passed`}
                                        checked={formData[`session_${n}_passed`]}
                                        onChange={handleInputChange}
                                    />
                                    <span>Сессия {n}</span>
                                </label>
                            )
                        )
                        }</div>
                    <div>
                        <label className="block font-medium mb-1">Набор данных</label>
                        <select
                            name="direction_id"
                            value={formData.direction_id}
                            onChange={handleInputChange}
                            className="w-full border rounded px-3 py-2"
                            required
                        >
                            <option value="">Выберите набор</option>
                            {directions.map(dir => (
                                <option key={dir.id} value={dir.id}>{dir.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
                        >
                            Отмена
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                        >
                            Сохранить
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
export default ModalAdd;
