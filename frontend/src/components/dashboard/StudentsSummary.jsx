import React, { useState } from 'react';

export const StudentsSummary = ({ students, selectedModel, onCreatePrediction }) => {
  const [showAll, setShowAll] = useState(false);
  const [loadingIds, setLoadingIds] = useState(new Set());
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState(null); // Сохраняем индекс последнего выбранного студента

  const getFirstPrediction = (student) => student.prediction?.[0] ?? null;

  const sortedStudents = [...students].sort((a, b) => {
    const aProb = getFirstPrediction(a)?.predicted_prob ?? -1;
    const bProb = getFirstPrediction(b)?.predicted_prob ?? -1;
    return bProb - aProb;
  });

  const visibleStudents = showAll ? sortedStudents : sortedStudents.slice(0, 5);

  const toggleSelect = (id, index, shiftKey) => {
    if (shiftKey && lastSelectedIndex !== null && selectedIds.has(id)) {
      // Если зажат Shift — выбираем все между lastSelectedIndex и текущим
      const start = Math.min(index, lastSelectedIndex);
      const end = Math.max(index, lastSelectedIndex);

      const newSet = new Set(selectedIds);

      for (let i = start; i <= end; i++) {
        const studentId = visibleStudents[i]?.id;
        if (studentId) newSet.add(studentId);
      }

      setSelectedIds(newSet);
    } else if (shiftKey && lastSelectedIndex !== null && !selectedIds.has(id)) {
      const start = Math.min(index, lastSelectedIndex);
      const end = Math.max(index, lastSelectedIndex);

      const newSet = new Set(selectedIds);

      for (let i = start; i <= end; i++) {
        const studentId = visibleStudents[i]?.id;
        if (studentId) newSet.add(studentId);
      }

      setSelectedIds(newSet);
    } else {
      // Обычный выбор
      setSelectedIds(prev => {
        const newSet = new Set(prev);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        return newSet;
      });
    }

    // Обновляем индекс последнего выбранного студента
    setLastSelectedIndex(index);
  };

  const handleCreatePredictionForSelected = async () => {
    if (!selectedModel) {
      alert('Пожалуйста, выберите модель для прогноза');
      return;
    }
    if (selectedIds.size === 0) {
      alert('Пожалуйста, выберите хотя бы одного студента');
      return;
    }
    try {
      setLoadingIds(new Set(selectedIds));
      await onCreatePrediction(Array.from(selectedIds), selectedModel);
      setSelectedIds(new Set()); // Очистить выбор после выполнения
    } finally {
      setLoadingIds(new Set());
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow overflow-hidden h-full flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Сводка по студентам</h2>
        </div>

        <div className="divide-y divide-gray-200 flex-1 overflow-y-auto">
          {visibleStudents.map((student, index) => {
            const prediction = getFirstPrediction(student);
            const prob = prediction?.predicted_prob;
            const cls = prediction?.predicted_class;
            const isLoading = loadingIds.has(student.id);
            const isSelected = selectedIds.has(student.id);

            return (
              <div
                key={student.id}
                onClick={(e) => !isLoading && toggleSelect(student.id, index, e.shiftKey)}
                className={`p-4 cursor-pointer flex justify-between items-center transition-colors
                  ${isSelected ? 'bg-blue-100' : 'hover:bg-gray-50'}
                  ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                <div className="min-w-0">
                  <p className="text-s font-medium text-gray-900 truncate">{student.full_name}</p>
                  <p className="text-l text-gray-500">
                    Математика: {student.math_score} | Русский: {student.russian_score} | ЕГЭ: {student.ege_score}
                  </p>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <p className="text-l text-gray-500">Вероятность</p>
                    <div className={`text-s font-medium ${
                      typeof prob === 'number'
                        ? prob > 0.5
                          ? 'text-green-600'
                          : 'text-red-600'
                        : 'text-gray-500'
                    }`}>
                      {typeof prob === 'number' ? `${(prob * 100).toFixed(1)}%` : 'Нет данных'}
                    </div>
                  </div>

                  <div className="text-center">
                    <p className="text-l text-gray-500">Риск</p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-s font-medium ${
                      cls === 1
                        ? 'bg-green-100 text-green-800'
                        : cls === 0
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-500'
                    }`}>
                      {cls === 1 ? 'Низкий' : cls === 0 ? 'Высокий' : 'Нет данных'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {students.length > 5 && (
          <div className="p-4 border-t text-center">
            <button
              className="text-sm text-blue-600 hover:text-blue-800"
              onClick={() => setShowAll(prev => !prev)}
            >
              {showAll ? 'Скрыть' : `Показать всех (${students.length - 5})`}
            </button>
          </div>
        )}
      </div>

      {/* Фиксированная панель внизу экрана */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-blue-500/90 to-blue-600/90 backdrop-blur-md z-50">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <span className="text-white/90 font-medium">
                  Выбрано студентов: {selectedIds.size}
                </span>
                <div className="h-6 w-px bg-white/30" />
                <button
                  onClick={() => setSelectedIds(new Set())}
                  className="text-white/80 hover:text-white text-sm font-medium transition-colors"
                >
                  Сбросить
                </button>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCreatePredictionForSelected}
                  disabled={!selectedModel || loadingIds.size > 0}
                  className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 text-sm font-medium ${
                    !selectedModel || loadingIds.size > 0
                      ? 'bg-white/20 text-white/50 cursor-not-allowed'
                      : 'bg-white text-blue-600 hover:bg-white/95'
                  }`}
                >
                  📊 {loadingIds.size > 0 ? 'Прогнозируем...' : 'Сделать прогноз'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};