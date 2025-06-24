import React, {useEffect, useState} from 'react';
import axios from 'axios';


const FIELD_TRANSLATIONS = {
    math_score: 'Балл по математике',
    russian_score: 'Балл по русскому',
    ege_score: 'Общий балл ЕГЭ',
    session_1_passed: 'Сдана сессия 1',
    session_2_passed: 'Сдана сессия 2',
    session_3_passed: 'Сдана сессия 3',
    session_4_passed: 'Сдана сессия 4',
};

const metricDescriptions = {
    "Pseudo R² (McFadden)": "Показывает, насколько модель лучше нулевой (без признаков). Чем выше — тем лучше.",
    "Likelihood Ratio (LR)": "Статистика отношения правдоподобия. Используется для проверки значимости модели.",
    "Pseudo R²": "Другой вариант псевдо-R², аналогично характеризует качество модели.",
    "Rp² (Prediction Quality)": "Качество прогноза на основе реальных и предсказанных значений.",
    "Correct Predictions (%)": "Процент правильно предсказанных случаев (точность). Значения больше 70% говорят о хорошей модели.",
    "chi2": "Значение статистики хи-квадрат для модели."
};

// Список всех доступных признаков
const availableFields = Object.keys(FIELD_TRANSLATIONS);

// Признаки, которые нельзя выбрать как целевые
const EXCLUDED_TARGET_FIELDS = ['math_score', 'russian_score', 'ege_score'];

// Отфильтрованный список для целевой переменной
const targetFields = availableFields.filter(
    field => !EXCLUDED_TARGET_FIELDS.includes(field)
);

const CardButton = ({children, selected, disabled, ...props}) => (
    <div
        {...props}
        className={`cursor-pointer p-3 rounded-lg border text-center transition-all
      ${disabled
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
            : selected
                ? 'border-blue-500 bg-white text-gray-900'
                : 'bg-white hover:bg-blue-50 border-gray-200'}
    `}
    >
        {children}
    </div>
);

export const ModelTrainingPage = () => {
    const [models, setModels] = useState([]);
    const [directions, setDirections] = useState([]);
    const [selectedModelId, setSelectedModelId] = useState(null);
    const [expandedModelId, setExpandedModelId] = useState(null);
    const [selectedFields, setSelectedFields] = useState([]);
    const [targetField, setTargetField] = useState('');
    const [directionId, setDirectionId] = useState(null);
    const [modelName, setModelName] = useState('');
    const [trainingStatus, setTrainingStatus] = useState(null);
    const [metrics, setMetrics] = useState({});
    const [loading, setLoading] = useState(false);
    const [loadingMetricsId, setLoadingMetricsId] = useState(null);
    const [modelType, setModelType] = useState('logit'); // по умолчанию логит
    const [error, setError] = useState(null);


    useEffect(() => {
        loadModels();
        axios.get('/directions/all/')
            .then(res => setDirections(res.data))
            .catch(() => setError('Ошибка загрузки направлений'));
    }, []);

    const loadModels = () => {
        axios.get('/ml/')
            .then(res => setModels(res.data))
            .catch(() => setError('Ошибка загрузки моделей'));
    };

    const toggleField = (field) => {
        setSelectedFields(prev =>
            prev.includes(field)
                ? prev.filter(f => f !== field)
                : [...prev, field]
        );
    };

    const trainModel = async () => {
        setLoading(true);
        setError(null);
        setTrainingStatus(null);
        setMetrics({});

        if (!selectedFields.length || !targetField || !directionId || (!selectedModelId && !modelName.trim())) {
            setError('Заполните все поля: признаки, целевая переменная, направление, название модели');
            setLoading(false);
            return;
        }

        try {
            const response = await axios.post('/ml/train/', {
                fields: selectedFields,
                target: targetField,
                model_name: modelName,
                direction_id: directionId,
                model_type: modelType
            });

            setTrainingStatus('Обучение завершено');
            setMetrics(prev => ({...prev, result: response.data.result}));
            loadModels();
        } catch {
            setError('Ошибка при обучении модели');
        } finally {
            setLoading(false);
        }
    };

    const handleModelClick = async (modelId) => {
        if (expandedModelId === modelId) {
            setExpandedModelId(null);
            return;
        }

        setLoadingMetricsId(modelId);
        setError(null);

        try {
            const res = await axios.get(`/ml/${modelId}/metrics`);
            setMetrics(prev => ({...prev, [modelId]: res.data}));
            setExpandedModelId(modelId);
            setSelectedModelId(modelId);
        } catch {
            setError('Ошибка при получении метрик модели');
        } finally {
            setLoadingMetricsId(null);
        }
    };

    const handleDeleteModel = async (modelId, e) => {
        e.stopPropagation();
        if (!window.confirm('Удалить модель?')) return;

        try {
            await axios.delete(`/ml/${modelId}`);
            setModels(prev => prev.filter(m => m.id !== modelId));
            if (selectedModelId === modelId) {
                setSelectedModelId(null);
                setModelName('');
            }
        } catch {
            setError('Ошибка удаления модели');
        }
    };

    const renderMetricsTable = (metricsObj) => {
        if (!metricsObj) return null;

        const {performance_metrics, classification_report, confusion_matrix, model_statistics} = metricsObj;

        // Рендер ключевых метрик
        const renderPerformanceMetrics = (perf) => {
            if (!perf) return null;

            const keysOrder = [
                "Model Type",
                "Pseudo R² (McFadden)",
                "Likelihood Ratio (LR)",
                "Pseudo R²",
                "Rp² (Prediction Quality)",
                "Correct Predictions (%)",
                "chi2",
            ];

            const keyTranslations = {
                "Model Type": "Тип модели",
                "Pseudo R² (McFadden)": "Псевдо R² (Макфаддена)",
                "Likelihood Ratio (LR)": "Отношение правдоподобия (LR)",
                "Pseudo R²": "Псевдо-R²",
                "Rp² (Prediction Quality)": "Rp² (качество прогноза)",
                "Correct Predictions (%)": "Доля правильных предсказаний (%)",
                "chi2": "Хи-квадрат (χ²)",
            };

            return (
                <div className="mb-4">
                    <h3 className="font-semibold mb-2">Основные показатели</h3>
                    <table className="text-sm border w-full max-w-screen-md" style={{tableLayout: "auto"}}>
                        <thead>
                        <tr className="bg-gray-100">
                            <th className="p-2 border w-1/3">Метрика</th>
                            <th className="p-2 border w-0.5/3">Значение</th>
                            <th className="p-2 border w-2/3">Описание</th>
                        </tr>
                        </thead>
                        <tbody>
                        {keysOrder.map((key) => {
                            if (!(key in perf)) return null;
                            const value = perf[key];
                            const label = keyTranslations[key] || key;
                            const description = metricDescriptions[key] || "Нет описания";

                            return (
                                <tr key={key} className="border-b">
                                    <td className="p-2 border font-medium bg-gray-100 ">{label}</td>
                                    <td className="p-2 border text-center">{typeof value === "number" ? value.toFixed(4) : value}</td>
                                    <td className="p-2 border text-sm text-gray-600 w-56">{description}</td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                </div>
            );
        };

        // Рендер отчёта классификации
        const renderClassificationReport = (report) => {
            const classes = Object.keys(report).filter(k => !['accuracy', 'macro avg', 'weighted avg'].includes(k));
            return (
                <div className="mb-4">
                    <h3 className="font-semibold mb-2">Отчёт о классификации</h3>
                    <div className="overflow-x-auto">
                        <table className="text-sm border w-full max-w-full" style={{tableLayout: 'auto'}}>
                            <thead>
                            <tr className="bg-gray-100">
                                <th className="p-2 border">Класс</th>
                                <th className="p-2 border">Precision</th>
                                <th className="p-2 border">Recall</th>
                                <th className="p-2 border">F1-score</th>
                                <th className="p-2 border">Support</th>
                            </tr>
                            </thead>
                            <tbody>
                            {classes.map(cls => (
                                <tr key={cls}>
                                    <td className="p-2 border font-medium">{cls}</td>
                                    <td className="p-2 border">{report[cls].precision.toFixed(3)}</td>
                                    <td className="p-2 border">{report[cls].recall.toFixed(3)}</td>
                                    <td className="p-2 border">{report[cls]['f1-score'].toFixed(3)}</td>
                                    <td className="p-2 border">{report[cls].support}</td>
                                </tr>
                            ))}
                            {/* Accuracy строка */}
                            {report.accuracy && (
                                <tr>
                                    <td className="p-2 border font-medium">Accuracy</td>
                                    <td className="p-2 border text-center" colSpan={3}>{report.accuracy.toFixed(4)}</td>
                                    <td className="p-2 border">{classes.reduce((acc, cls) => acc + report[cls].support, 0)}</td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>
            );
        };

        // Рендер матрицы ошибок — из объекта надо построить 2x2 таблицу
        const renderConfusionMatrix = (matrixObj) => {
            // Сопоставим индексы с классами
            // Предполагается, что ключи "0" и "1" — предсказания, в них — реальные: false и true
            const classes = ['False', 'True'];
            const predClasses = ['0', '1'];

            return (
                <div className="mb-4">
                    <h3 className="font-semibold mb-2">Таблица попаданий и промахов</h3>
                    <table className="text-sm border max-w-md" style={{tableLayout: 'auto'}}>
                        <thead>
                        <tr>
                            <th className="p-2 border bg-gray-100">Предсказано \ Реальность</th>
                            {classes.map((cls) => (
                                <th key={cls} className="p-2 border bg-gray-100">{cls}</th>
                            ))}
                        </tr>
                        </thead>
                        <tbody>
                        {predClasses.map((pred, i) => (
                            <tr key={pred}>
                                <td className="p-2 border font-medium bg-gray-100">{classes[i]}</td>
                                <td className="p-2 border text-center">{matrixObj[pred].false}</td>
                                <td className="p-2 border text-center">{matrixObj[pred].true}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            );
        };

        // Рендер статистики модели (коэффициенты и пр)
        const renderModelStatistics = (stats) => {
            if (!stats || stats.length === 0) return null;

            return (
                <div className="mb-4">
                    <h3 className="font-semibold mb-2">Статистика модели</h3>
                    <table className="text-sm border w-full max-w-lg" style={{tableLayout: 'auto'}}>
                        <thead>
                        <tr className="bg-gray-100">
                            <th className="p-2 border">Признак</th>
                            <th className="p-2 border">Коэффициент</th>
                            <th className="p-2 border">P-value</th>
                            <th className="p-2 border">Std Error</th>
                        </tr>
                        </thead>
                        <tbody>
                        {stats.map(({Feature, Coefficient, 'P-value': pval, 'Std Error': stderr}) => (
                            <tr key={Feature}>
                                <td className="p-2 border font-medium">{Feature}</td>
                                <td className="p-2 border">{Coefficient.toFixed(4)}</td>
                                <td className="p-2 border">{pval.toFixed(4)}</td>
                                <td className="p-2 border">{stderr.toFixed(4)}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            );
        };

        return (
            <div className="space-y-6 mt-4">
                {performance_metrics && renderPerformanceMetrics(performance_metrics)}
                {confusion_matrix && renderConfusionMatrix(confusion_matrix)}
                {model_statistics && renderModelStatistics(model_statistics)}
            </div>
        );
    };


    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">Построение и мониторинг моделей</h1>

            {error && <div className="p-3 bg-red-100 text-red-700 rounded-lg">{error}</div>}

            {/* Блок выбора модели */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h2 className="text-lg font-semibold mb-4 text-gray-800">Настройки модели</h2>

                <div className="space-y-4">
                    <div>
                        <label className="block mb-2 font-medium text-gray-700">Модель</label>
                        <select
                            className="w-full p-2 border rounded-lg focus:ring-1 focus:ring-blue-500"
                            value={selectedModelId || ''}
                            onChange={e => setSelectedModelId(e.target.value || null)}
                        >
                            <option value="">-- Новая модель --</option>
                            {models.map(m => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block mb-2 font-medium text-gray-700">Название модели</label>
                        <input
                            type="text"
                            className={`w-full p-2 border rounded-lg transition ${
                                selectedModelId ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
                            }`}
                            value={modelName}
                            onChange={e => setModelName(e.target.value)}
                            placeholder="Введите название модели"
                            disabled={!!selectedModelId}
                        />
                    </div>

                    <h2 className="block mb-2 font-medium text-gray-700">Тип модели</h2>

                    <select
                        className="w-full p-2 border rounded-lg focus:ring-1 focus:ring-blue-500"
                        value={modelType}
                        onChange={e => setModelType(e.target.value)}
                        disabled={!!selectedModelId} // блокируем выбор при редактировании существующей модели
                    >
                        <option value="logit">Логит</option>
                        <option value="probit">Пробит</option>
                    </select>
                </div>
            </div>

            {/* Блок выбора направления */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h2 className="text-lg font-semibold mb-4 text-gray-800">Набор данных</h2>

                <div className="space-y-1">
                    <select
                        value={directionId || ''}
                        onChange={e => setDirectionId(Number(e.target.value))}
                        className="p-2 border rounded-lg w-full focus:ring-1 focus:ring-blue-500"
                    >
                        <option value="" disabled>Выберите набор</option>
                        {directions.map(dir => (
                            <option key={dir.id} value={dir.id}>
                                {dir.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Блок выбора признаков */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h2 className="text-lg font-semibold mb-4 text-gray-800">Выбор факторов и целевой переменной</h2>

                <div className="space-y-4">
                    <h2 className="font-medium text-gray-700">Факторы для обучения</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {availableFields.map(field => (
                            <CardButton
                                key={field}
                                selected={selectedFields.includes(field)}
                                color="green"
                                onClick={() => toggleField(field)}
                                disabled={field === targetField}
                            >
                                {FIELD_TRANSLATIONS[field]}
                            </CardButton>
                        ))}
                    </div>
                </div>

                <div className="space-y-4 mt-6">
                    <h2 className="font-medium text-gray-700">Целевая переменная</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {targetFields.map(field => (
                            <CardButton
                                key={field}
                                selected={targetField === field}
                                color="purple"
                                onClick={() => {
                                    setTargetField(field);
                                    setSelectedFields(prev => prev.filter(f => f !== field));
                                }}
                            >
                                {FIELD_TRANSLATIONS[field]}
                            </CardButton>
                        ))}
                    </div>
                </div>
            </div>

            {/* Блок обучения */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <button
                    className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg
           hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    onClick={trainModel}
                    disabled={loading}
                >
                    {loading ? 'Построение...' : 'Построить модель'}
                </button>
            </div>

            {/* Блок результатов обучения */}
            {trainingStatus === 'Построение завершено' && metrics.result && (
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h2 className="text-lg font-semibold mb-4 text-gray-800">Результаты построения</h2>
                    <div className="mt-6 bg-gray-50 p-4 rounded-lg border">
                        <h3 className="text-lg font-semibold mb-2">Результаты построения:</h3>
                        {renderMetricsTable(metrics.result)}
                    </div>
                </div>
            )}

            {/* Блок списка моделей */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800">Список моделей</h2>
                <div className="space-y-3 mt-4">
                    {models.length === 0 ? (
                        <div className="p-4 text-gray-500 text-center border rounded-lg">
                            Моделей нет
                        </div>
                    ) : models.map(m => (
                        <div key={m.id} className="group relative">
                            <div
                                onClick={() => handleModelClick(m.id)}
                                className={`p-4 border rounded-lg cursor-pointer transition-all
                ${expandedModelId === m.id
                                    ? 'bg-blue-50 border-blue-300'
                                    : 'hover:border-blue-200 bg-white'}`}
                            >
                                <button
                                    onClick={(e) => handleDeleteModel(m.id, e)}
                                    className="absolute top-2 right-2 p-1 opacity-0 group-hover:opacity-100
                      text-gray-400 hover:text-red-600 transition-opacity"
                                >
                                    ×
                                </button>
                                <div className="font-medium">{m.name}</div>
                                <div className="text-sm text-gray-500">
                                </div>
                            </div>

                            {expandedModelId === m.id && (
                                <div className="mt-2 p-4 bg-white border rounded-lg shadow-sm">
                                    {loadingMetricsId === m.id ? (
                                        <p className="text-gray-500">Загрузка метрик...</p>
                                    ) : (
                                        <>
                                            {renderMetricsTable(metrics[m.id]?.metrics)}
                                                <h3 className="mt-4 font-semibold">Использованные признаки:</h3>
                                                <ul className="list-disc list-inside text-sm text-gray-700">
                                                    {(metrics[m.id]?.feature_columns || []).map(f => (
                                                        <li key={f}>{FIELD_TRANSLATIONS[f] || f}</li>
                                                    ))}
                                                </ul>
                                                <h3 className="mt-4 font-semibold">Набор данных (используемый для
                                                    построения):</h3>
                                                {directions.find(d => d.id === metrics[m.id]?.direction_id)?.name}
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
