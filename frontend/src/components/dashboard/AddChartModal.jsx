import React, {useState, useEffect} from 'react';
import {studentApi} from '../../services/api';
import {translate} from "../../utils/translations";

const AddChartModal = ({isOpen, onClose, onAddChart, existingCharts = [], currentModel, selectedDirection}) => {
    const [selectedSubject, setSelectedSubject] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [xValuesInput, setXValuesInput] = useState('1, 10, 15'); // Значение по умолчанию
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [availableSubjects, setAvailableSubjects] = useState([]);
    const [modelLoading, setModelLoading] = useState(false);

    useEffect(() => {
        if (!isOpen || !currentModel) return;

        const loadModelSubjects = async () => {
            setModelLoading(true);
            try {
                const response = await studentApi.loadModel(currentModel);
                setAvailableSubjects(response.data.feature_columns || []);
                setError('');
            } catch (err) {
                console.error('Ошибка загрузки модели:', err);
                setError('Не удалось загрузить модель');
                setAvailableSubjects([]);
            } finally {
                setModelLoading(false);
            }
        };

        loadModelSubjects();
    }, [isOpen, currentModel]);

    const generateChartId = (model, subject, category) => {
        return `${model}_${subject}_${category}`.toLowerCase().replace(/\s+/g, '_');
    };

    const handleAddChart = async () => {
        if (!currentModel || !selectedSubject || !selectedCategory) {
            setError('Пожалуйста, заполните все поля');
            return;
        }

        let xValues = [];
        if (selectedCategory === 'margin_effect') {
            try {
                xValues = xValuesInput
                    .split(',')
                    .map(val => parseFloat(val.trim()))
                    .filter(val => !isNaN(val));

                if (xValues.length === 0) {
                    setError('Введите корректные значения X через запятую');
                    return;
                }
            } catch (e) {
                setError('Ошибка парсинга значений X');
                return;
            }
        }

        const newChartId = generateChartId(currentModel, selectedSubject, selectedCategory);
        const chartExists = existingCharts.some(chart => chart.id === newChartId);
        if (chartExists) {
            setError('Такой график уже добавлен!');
            return;
        }

        setLoading(true);
        setError('');

        try {
            let chartData = [];

            if (selectedCategory === 'margin_effect') {
                const response = await studentApi.getMarginEffect({
                    target_name: selectedSubject,
                    x_values: xValues,
                    model_id: Number(currentModel),
                });

                chartData = response.data.effects.map((effect, index) => ({
                    x: xValues[index],
                    y: effect,
                }));
            } else {
                const response = await studentApi.getDashboardStats(
                    currentModel,
                    selectedSubject,
                    selectedDirection
                );
                chartData = response?.data?.[selectedCategory] || [];
                if (!chartData) throw new Error('Данные не найдены');
            }

            let xLabel = '';
            let yLabel = '';

            if (selectedCategory === 'margin_effect') {
                xLabel = translate(selectedSubject);
                yLabel = 'Влияние';
            } else if (selectedCategory === 'probability_intervals') {
                xLabel = translate(selectedSubject);
                yLabel = 'Вероятность';
            }

            const newChart = {
                id: newChartId,
                title: '',
                data: chartData,
                model: currentModel,
                subject: selectedSubject,
                category: selectedCategory,
                xLabel: xLabel,
                yLabel: yLabel
            };

            onAddChart(newChart);
            onClose();

        } catch (error) {
            console.error("Error:", error);
            setError('Ошибка при создании графика');
        } finally {
            setLoading(false);
        }
    };

    return isOpen ? (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-96">
                <h2 className="text-xl font-semibold mb-4">Добавить график</h2>

                {error && <div className="bg-red-100 text-red-700 p-2 mb-4 rounded text-sm">{error}</div>}

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">Предмет</label>
                    <select
                        value={selectedSubject}
                        onChange={(e) => {
                            setSelectedSubject(e.target.value);
                            setError('');
                        }}
                        className="block w-full mt-1 p-2 border border-gray-300 rounded"
                        disabled={modelLoading}
                    >
                        <option value="">Выберите предмет</option>
                        {availableSubjects.map(subject => (
                            <option key={subject} value={subject}>
                                {translate(subject)}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">Категория</label>
                    <select
                        value={selectedCategory}
                        onChange={(e) => {
                            setSelectedCategory(e.target.value);
                            setError('');
                        }}
                        className="block w-full mt-1 p-2 border border-gray-300 rounded"
                    >
                        <option value="">Выберите категорию</option>
                        <option value="probability_intervals">Вероятности</option>
                        <option value="margin_effect">Влияние фактора</option>
                    </select>
                </div>

                {/* Поле для ввода x_values */}
                {selectedCategory === 'margin_effect' && (
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">
                            Значения X (через запятую)
                        </label>
                        <input
                            type="text"
                            value={xValuesInput}
                            onChange={(e) => setXValuesInput(e.target.value)}
                            placeholder="Например: 1, 10, 15, 20"
                            className="block w-full mt-1 p-2 border border-gray-300 rounded"
                        />
                    </div>
                )}

                <div className="flex justify-between">
                    <button
                        onClick={onClose}
                        className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded transition-colors"
                    >
                        Отмена
                    </button>
                    <button
                        onClick={handleAddChart}
                        className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors disabled:opacity-50"
                        disabled={loading || !selectedSubject || !selectedCategory}
                    >
                        {loading ? 'Создание...' : 'Добавить график'}
                    </button>
                </div>
            </div>
        </div>
    ) : null;
};

export default AddChartModal;