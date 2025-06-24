import React from 'react';

export const Sidebar = ({ activeTab, setActiveTab }) => (
  <div className="w-64 bg-blue-600 text-white p-4 ">
    <h2 className="text-xl font-bold mb-6">Меню</h2>
    <ul className="space-y-2">
      {[
        { id: 'dashboard', label: '📊 Дашборд' },
        { id: 'directions', label: '🗃️ Наборы данных'},
        { id: 'students', label: '👨‍🎓 Студенты' },
        { id: 'analytics', label: '⚙️ Работа с моделями' },

      ].map((tab) => (
        <li key={tab.id}>
          <button
            onClick={() => setActiveTab(tab.id)}
            className={`w-full text-left p-2 rounded ${activeTab === tab.id ? 'bg-blue-700' : 'hover:bg-blue-400'}`}
          >
            {tab.label}
          </button>
        </li>
      ))}
    </ul>
  </div>
);