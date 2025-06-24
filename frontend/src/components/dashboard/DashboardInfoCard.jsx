import React from 'react';

export const DashboardInfoCard = ({students}) => {
    const total = students.length;

    const getFirstPrediction = (student) => student.prediction?.[0] ?? null;

    if (total === 0) {
        return (
            <div className="bg-white rounded-lg shadow p-6 space-y-4 h-full">
                <h2 className="text-lg font-semibold mb-2">Общая статистика</h2>
                <p>Данные отсутствуют</p>
            </div>
        );
    }

    const averageMath = (students.reduce((sum, s) => sum + (s.math_score ?? 0), 0) / total).toFixed(1);
    const averageRussian = (students.reduce((sum, s) => sum + (s.russian_score ?? 0), 0) / total).toFixed(1);

// Фильтруем студентов с прогнозом
    const studentsWithPrediction = students.filter(s => getFirstPrediction(s) !== null);

    const averageProb = studentsWithPrediction.length > 0
        ? (
            studentsWithPrediction.reduce(
                (sum, s) => sum + (getFirstPrediction(s)?.predicted_prob ?? 0),
                0
            ) / studentsWithPrediction.length * 100
        ).toFixed(1)
        : '0';

// Фильтруем только студентов с валидным predicted_class (0 или 1)
    const validPredictions = students.filter(s => {
        const pred = getFirstPrediction(s);
        return pred && (pred.predicted_class === 0 || pred.predicted_class === 1);
    });

    const highRiskCount = validPredictions.filter(s => getFirstPrediction(s).predicted_class === 0).length;
    const lowRiskCount = validPredictions.filter(s => getFirstPrediction(s).predicted_class === 1).length;

    return (
        <div className="bg-white rounded-lg shadow p-6 space-y-4 h-full">
            <h2 className="text-lg font-semibold mb-2">Общая статистика</h2>

            <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                    <p className="text-gray-500">Всего студентов</p>
                    <p className="text-gray-900 font-medium">{total}</p>
                </div>
                <div>
                    <p className="text-gray-500">Средняя вероятность успеха</p>
                    <p className="text-gray-900 font-medium">{averageProb}%</p>
                </div>

                <div>
                    <p className="text-gray-500">Средний балл по математике</p>
                    <p className="text-gray-900 font-medium">{averageMath}</p>
                </div>
                <div>
                    <p className="text-gray-500">Средний балл по русскому</p>
                    <p className="text-gray-900 font-medium">{averageRussian}</p>
                </div>

                <div>
                    <p className="text-gray-500">Высокий риск</p>
                    <p className="text-red-600 font-medium">{highRiskCount} студ.</p>
                </div>
                <div>
                    <p className="text-gray-500">Низкий риск</p>
                    <p className="text-green-600 font-medium">{lowRiskCount} студ.</p>
                </div>
            </div>
        </div>
    );
};

