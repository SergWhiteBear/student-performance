import React from 'react';

export const StudentsList = ({ data }) => {
  const getStatusColor = (prob) => prob > 0.5 ? 'bg-green-100' : 'bg-yellow-100';

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Список студентов</h2>
      <div className="space-y-2">
        {data.map((student) => (
          <div
            key={student.id}
            className={`p-3 rounded flex justify-between items-center ${getStatusColor(student.prob)}`}
          >
            <span className="font-medium">{student.name}</span>
            <span className="text-gray-700">
              Вероятность: <strong>{(student.prob * 100).toFixed(0)}%</strong>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudentsList;