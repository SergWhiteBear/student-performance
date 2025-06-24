import React, {useState, useMemo} from 'react';

const sortCycle = {
    null: 'asc',
    asc: 'desc',
    desc: null,
};

const StudentsTable = ({students, onRowClick, selectedStudents}) => {
    const [sortConfig, setSortConfig] = useState([]);

    const handleSort = (key) => {
        setSortConfig((prev) => {
            const existingIndex = prev.findIndex((item) => item.key === key);
            if (existingIndex === -1) {
                return [...prev, {key, direction: 'asc'}];
            }

            const existing = prev[existingIndex];
            const nextDirection = sortCycle[existing.direction];

            if (nextDirection === null) {
                const newConfig = [...prev];
                newConfig.splice(existingIndex, 1);
                return newConfig;
            }

            const newConfig = [...prev];
            newConfig[existingIndex] = {key, direction: nextDirection};
            return newConfig;
        });
    };

    const sortedStudents = useMemo(() => {
        const sorted = [...students];
        if (!sortConfig.length) return sorted;

        return sorted.sort((a, b) => {
            for (let i = sortConfig.length - 1; i >= 0; i--) {
                const {key, direction} = sortConfig[i];
                const aVal = a[key];
                const bVal = b[key];

                // Если значения равны — смотрим следующий критерий
                if (aVal === bVal) continue;

                // Числа — сортируем по числовому значению
                if (typeof aVal === 'number' && typeof bVal === 'number') {
                    return direction === 'asc' ? aVal - bVal : bVal - aVal;
                }

                // Булевые — преобразуем в числа 1 и 0, сортируем числово
                if (typeof aVal === 'boolean' && typeof bVal === 'boolean') {
                    const aNum = aVal ? 1 : 0;
                    const bNum = bVal ? 1 : 0;
                    return direction === 'asc' ? aNum - bNum : bNum - aNum;
                }

                // На всякий случай — если одно из значений null/undefined — ставим их в конец
                if (aVal == null) return 1;
                if (bVal == null) return -1;

                // Иначе сравниваем как строки в нижнем регистре
                const aStr = String(aVal).toLowerCase();
                const bStr = String(bVal).toLowerCase();
                if (aStr < bStr) return direction === 'asc' ? -1 : 1;
                if (aStr > bStr) return direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
    }, [students, sortConfig]);

    const headers = [
        {key: 'full_name', label: 'ФИО'},
        {key: 'math_score', label: 'Математика'},
        {key: 'russian_score', label: 'Русский язык'},
        {key: 'ege_score', label: 'ЕГЭ'},
        {key: 'session_1_passed', label: 'Сессия 1'},
        {key: 'session_2_passed', label: 'Сессия 2'},
        {key: 'session_3_passed', label: 'Сессия 3'},
        {key: 'session_4_passed', label: 'Сессия 4'},
    ];

    const getSortIndicator = (key) => {
        const index = sortConfig.findIndex((item) => item.key === key);
        if (index === -1) return '⇅';
        const dir = sortConfig[index].direction;
        const arrow = dir === 'asc' ? '↑' : '↓';
        return `${arrow}${sortConfig.length > 1 ? ` ${index + 1}` : ''}`;
    };

    return (
        <div className="overflow-x-auto rounded-lg border border-blue-100 shadow-sm">
            <table className="min-w-full bg-white divide-y divide-blue-50">
                <thead className="bg-gradient-to-r from-blue-500 to-blue-600">
                <tr>
                    {headers.map((header, idx) => (
                        <th
                            key={header.key}
                            onClick={() => handleSort(header.key)}
                            className={`px-6 py-3 text-center text-xs font-medium text-white uppercase tracking-wider cursor-pointer ${
                                idx === 0 ? 'border-l' : ''
                            } ${idx === headers.length - 1 ? 'border-r' : ''} border-blue-400`}
                        >
                            {header.label} {getSortIndicator(header.key)}
                        </th>
                    ))}
                </tr>
                </thead>
                <tbody>
                {sortedStudents.map((student) => (
                    <tr
                        key={student.id}
                        onClick={() => onRowClick(student)}
                        className={`cursor-pointer ${
                            selectedStudents.includes(student.id)
                                ? 'bg-blue-200'
                                : 'hover:bg-blue-500/20'
                        }`}
                    >
                        <td className="px-6 py-4 text-center whitespace-nowrap text-sm font-medium text-gray-900 border-l border-r border-blue-400">
                            {student.full_name}
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap text-sm text-gray-700 border-r border-blue-400">
                            {student.math_score}
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap text-sm text-gray-700 border-r border-blue-400">
                            {student.russian_score}
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap text-sm text-gray-700 border-r border-blue-400">
                            {student.ege_score}
                        </td>
                        <td className="px-6 py-4 text-center text-sm border-r border-blue-400">
                            {student.session_1_passed ? '✔️' : '❌'}
                        </td>
                        <td className="px-6 py-4 text-center text-sm border-r border-blue-400">
                            {student.session_2_passed ? '✔️' : '❌'}
                        </td>
                        <td className="px-6 py-4 text-center text-sm border-r border-blue-400">
                            {student.session_3_passed ? '✔️' : '❌'}
                        </td>
                        <td className="px-6 py-4 text-center text-sm border-r border-blue-400">
                            {student.session_4_passed ? '✔️' : '❌'}
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
};

export default StudentsTable;
