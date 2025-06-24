import React, {useState, useEffect} from 'react';
import {DashboardChartGroup} from '../components/dashboard/DashboardChartGroup';
import {StudentsSummary} from '../components/dashboard/StudentsSummary';
import {DashboardInfoCard} from '../components/dashboard/DashboardInfoCard';
import {studentApi} from '../services/api';
import ConfirmModal from '../components/dashboard/ConfirmModal';
import AddChartModal from '../components/dashboard/AddChartModal';
import {translate} from "../utils/translations";

export const DashboardPage = () => {
    const [studentsData, setStudentsData] = useState([]);
    const [directions, setDirections] = useState([]);
    const [models, setModels] = useState([]);
    const [selectedDirection, setSelectedDirection] = useState('');
    const [pendingDirection, setPendingDirection] = useState('');
    const [selectedModel, setSelectedModel] = useState('');
    const [loading, setLoading] = useState({
        directions: true,
        models: false,
        students: false
    });
    const [error, setError] = useState(null);

    // Хранить графики по модели: { [modelId]: Chart[] }
    const [chartsByModel, setChartsByModel] = useState({});

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    const currentCharts = chartsByModel[selectedModel] || [];

    useEffect(() => {
        const fetchDirections = async () => {
            try {
                const response = await studentApi.getDirections();
                setDirections(response.data);
                setError(null);
            } catch (err) {
                setError('Ошибка загрузки направлений');
            } finally {
                setLoading(prev => ({...prev, directions: false}));
            }
        };
        fetchDirections();
    }, []);

    useEffect(() => {
        const fetchModels = async () => {
            if (!selectedDirection) {
                setModels([]);
                setSelectedModel('');
                return;
            }
            setLoading(prev => ({...prev, models: true}));
            try {
                const response = await studentApi.getModels();
                setModels(response.data);
                setSelectedModel('');
                setError(null);
            } catch (err) {
                setError('Ошибка загрузки моделей');
            } finally {
                setLoading(prev => ({...prev, models: false}));
            }
        };
        fetchModels();
    }, [selectedDirection]);

    useEffect(() => {
        const fetchStudents = async () => {
            if (!selectedDirection || !selectedModel) {
                setStudentsData([]);
                return;
            }

            setLoading(prev => ({...prev, students: true}));
            try {
                const response = await studentApi.getStudentsWithPredict({
                    direction_id: selectedDirection,
                    model_id: selectedModel
                });
                setStudentsData(response.data);
                setError(null);
            } catch (err) {
                setError('Ошибка загрузки студентов');
            } finally {
                setLoading(prev => ({...prev, students: false}));
            }
        };
        fetchStudents();
    }, [selectedDirection, selectedModel]);

    useEffect(() => {
        const updateChartsData = async () => {
            if (!selectedModel || currentCharts.length === 0) return;

            const updatedCharts = await Promise.all(
                currentCharts.map(async (chart) => {
                    try {
                        const response = await studentApi.getDashboardStats(selectedModel, chart.subject);
                        const updatedData = response?.data?.[chart.category] || [];
                        return {...chart, data: updatedData};
                    } catch (err) {
                        console.error(`Ошибка обновления графика ${chart.title}:`, err);
                        return chart;
                    }
                })
            );

            setChartsByModel(prev => ({
                ...prev,
                [selectedModel]: updatedCharts
            }));
        };

        updateChartsData();
    }, [selectedModel]);

    const onDirectionChange = (e) => {
        const newDirection = e.target.value;
        if (newDirection === selectedDirection) return;

        if (Object.keys(chartsByModel).some(key => (chartsByModel[key] && chartsByModel[key].length > 0))) {
            setPendingDirection(newDirection);
            setIsConfirmOpen(true);
        } else {
            setSelectedDirection(newDirection);
            setSelectedModel('');
            setChartsByModel({});
        }
    };

    const confirmDirectionChange = () => {
        setSelectedDirection(pendingDirection);
        setSelectedModel('');
        setChartsByModel({});
        setPendingDirection('');
        setIsConfirmOpen(false);
    };

    const cancelDirectionChange = () => {
        setPendingDirection('');
        setIsConfirmOpen(false);
    };

    const handleAddChart = (newChart) => {
        if (!selectedModel) return;
        if (currentCharts.some(chart => chart.id === newChart.id)) return;

        setChartsByModel(prev => ({
            ...prev,
            [selectedModel]: [...(prev[selectedModel] || []), newChart]
        }));
    };

    const handleRemoveChart = (chartId) => {
        if (!selectedModel) return;
        setChartsByModel(prev => ({
            ...prev,
            [selectedModel]: (prev[selectedModel] || []).filter(chart => chart.id !== chartId)
        }));
    };

    const createPrediction = async (studentId) => {
        if (!selectedModel) {
            alert('Выберите модель для прогноза');
            return;
        }
        try {
            await studentApi.predictByIds({ids: studentId, model_id: selectedModel});

            if (selectedDirection && selectedModel) {
                setLoading(prev => ({...prev, students: true}));
                const response = await studentApi.getStudentsWithPredict({
                    direction_id: selectedDirection,
                    model_id: selectedModel,
                });
                setStudentsData(response.data);
            }
        } catch (error) {
            alert('Ошибка при создании прогноза');
        } finally {
            if (currentCharts.length > 0) {
                const updatedCharts = await Promise.all(
                    currentCharts.map(async (chart) => {
                        try {
                            const response = await studentApi.getDashboardStats(selectedModel, chart.subject);
                            const updatedData = response?.data?.[chart.category] || [];
                            return {...chart, data: updatedData};
                        } catch (err) {
                            console.error(`Ошибка обновления графика ${chart.title}:`, err);
                            return chart;
                        }
                    })
                );
                setChartsByModel(prev => ({
                    ...prev,
                    [selectedModel]: updatedCharts
                }));
            }
            setLoading(prev => ({...prev, students: false}));
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Дашборд успеваемости</h1>

            <div className="mb-6 max-w-2xl flex gap-4">
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Набор данных
                        {loading.directions && <span className="ml-2 text-blue-500">загрузка...</span>}
                    </label>
                    <select
                        value={pendingDirection || selectedDirection}
                        onChange={onDirectionChange}
                        className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm"
                        disabled={loading.directions}
                    >
                        <option value="">Выберите набор данных</option>
                        {directions.map(dir => (
                            <option key={dir.id} value={dir.id}>
                                {translate(dir.name)}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Модель
                        {loading.models && <span className="ml-2 text-blue-500">загрузка...</span>}
                    </label>
                    <select
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm"
                        disabled={!selectedDirection || loading.models}
                    >
                        <option value="">Выберите модель</option>
                        {models.map(model => (
                            <option key={model.id} value={model.id}>
                                {model.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <AddChartModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onAddChart={handleAddChart}
                existingCharts={currentCharts}
                currentModel={selectedModel}
                selectedDirection={selectedDirection}
            />

            <DashboardChartGroup
                charts={currentCharts.map(chart => ({
                    title: chart.title,
                    data: chart.data,
                    category: chart.category,
                    yPercent: true,
                    onRemove: () => handleRemoveChart(chart.id),
                    xLabel: chart.xLabel,   // Пробрасываем xLabel
                    yLabel: chart.yLabel    // Пробрасываем yLabel
                }))}
                onAddChart={() => setIsModalOpen(true)} // <- сюда
            />

            {loading.students ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            ) : error ? (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
                    <p className="text-sm text-red-700">{error}</p>
                </div>
            ) : studentsData.length > 0 ? (
                <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <StudentsSummary
                            students={studentsData}
                            selectedModel={selectedModel}
                            onCreatePrediction={createPrediction}
                        />
                    </div>
                    <div className="lg:col-span-1">
                        <DashboardInfoCard students={studentsData}/>
                    </div>
                </div>
            ) : (
                <div className="text-gray-500 text-center py-8">
                    {selectedModel ? 'Нет данных для выбранных фильтров' : 'Выберите набор данных и модель'}
                </div>
            )}

            <ConfirmModal
                isOpen={isConfirmOpen}
                message="При смене направления текущие графики будут удалены. Продолжить?"
                onConfirm={confirmDirectionChange}
                onCancel={cancelDirectionChange}
            />
        </div>
    );
};
