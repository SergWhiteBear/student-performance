import React from 'react';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    LineChart,
    Line
} from 'recharts';

import {translate} from "../../utils/translations";

function SingleChart({
                         title,
                         data,
                         dataKey = 'value',
                         labelKey = 'label',
                         category,
                         yPercent = true,
                         onRemove,
                         xLabel,  // Новое
                         yLabel   // Новое
                     }) {
    // Для probability_intervals используем BarChart
    const barChartData = Object.entries(data)
        .map(([label, value]) => ({
            [labelKey]: translate(label),
            [dataKey]: value,
        }))
        .sort((a, b) => {
            const aStart = parseFloat(a[labelKey].split('-')[0]);
            const bStart = parseFloat(b[labelKey].split('-')[0]);
            return isNaN(aStart) || isNaN(bStart) ? 0 : aStart - bStart;
        });

    // Для margin_effect используем LineChart
    const lineChartData = data.map?.(point => ({
        x: point.x,
        y: point.y
    })) || [];

    return (
        <div className="flex-1 min-w-[300px] h-80 relative group">
            <div className="h-full flex flex-col bg-white rounded-lg shadow p-4">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-medium">{title}</h3>
                    {onRemove && (
                        <button
                            onClick={onRemove}
                            className="text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                            aria-label="Удалить график"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20"
                                 fill="currentColor">
                                <path fillRule="evenodd"
                                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                      clipRule="evenodd"/>
                            </svg>
                        </button>
                    )}
                </div>
                <div className="flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                        {category === 'margin_effect' ? (
                            <LineChart data={lineChartData} margin={{top: 30, right: 50, left: 0, bottom: 20}}>
                                <CartesianGrid strokeDasharray="3 3"/>
                                <XAxis dataKey="x" label={{
                                    value: xLabel,
                                    angle: 0,
                                    position: 'insideRight',
                                    dx: 45,
                                    dy: -15,
                                    style: {fontWeight: 'bold', fontSize: 16}
                                }}/>
                                <YAxis
                                    domain={[
                                        0,
                                        Math.max(
                                            ...data.map((d) => d[dataKey]),
                                            0.1
                                        ) * 1.1
                                    ]}
                                    tickFormatter={(v) =>
                                        yPercent ? `${(v * 100).toFixed(1)}%` : v.toFixed(1)
                                    }
                                    width={50}
                                    label={{
                                        value: yLabel,
                                        angle: 0,
                                        position: 'insideRight',
                                        dx: 30,
                                        dy: -105,
                                        style: {fontWeight: 'bold', fontSize: 16}
                                    }}
                                />
                                <Tooltip/>
                                <Line type="monotone" dataKey="y" stroke="#009218"/>
                            </LineChart>
                        ) : (
                            <BarChart
                                data={barChartData}
                                margin={{top: 30, right: 50, left: 0, bottom: 20}}
                            >
                                <CartesianGrid strokeDasharray="3 3"/>
                                <XAxis
                                    dataKey={labelKey}
                                    angle={-45}
                                    textAnchor="end"
                                    height={50}
                                    tick={{fontSize: 12}}
                                    label={{
                                        value: xLabel,
                                        angle: 0,
                                        position: 'insideRight',
                                        dx: 45,
                                        dy: -25,
                                        style: {fontWeight: 'bold', fontSize: 16}
                                    }}
                                    tickFormatter={(interval) => {
                                        const parts = interval.split('-').map(part => Math.round(parseFloat(part)));
                                        return `${parts[0]}-${parts[1]}`;
                                    }}
                                />
                                <YAxis
                                    domain={yPercent ? [0, 1] : ['auto', 'auto']}
                                    tickFormatter={(v) => {
                                        if (yPercent) {
                                            return `${Math.round(v * 100)}%`;
                                        }
                                        return v.toFixed(2);
                                    }}
                                    width={100}
                                    label={{
                                        value: yLabel,
                                        angle: 0,
                                        position: 'insideRight',
                                        dx: 30,
                                        dy: -100,
                                        style: {fontWeight: 'bold', fontSize: 16}
                                    }}
                                />
                                <Tooltip
                                    formatter={
                                        yPercent
                                            ? (v) => [`${(v * 100).toFixed(1)}%`, 'Значение']
                                            : (v) => [v, 'Значение']
                                    }
                                    labelFormatter={(l) => `Интервал: ${translate(l)}`}
                                />
                                <Bar
                                    dataKey={dataKey}
                                    fill="#009218"
                                    name="Значение"
                                    radius={[4, 4, 0, 0]}
                                    label={{
                                        position: 'top',
                                        valueAccessor: (entry) => entry.value,
                                        formatter: (value) => yPercent ? `${(value * 100).toFixed(0)}%` : value.toFixed(2),
                                        style: {textAnchor: 'middle', fontSize: 12}
                                    }}
                                />
                            </BarChart>
                        )}
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}

export const DashboardChartGroup = ({charts, onAddChart}) => {
    return (
        <div className="bg-white p-4 rounded-2xl shadow mb-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="p-2 text-xl font-semibold">Графики</h2>
                <button
                    onClick={onAddChart}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md shadow-md"
                >
                    Добавить график
                </button>
            </div>
            {charts.length === 0 && (
                <div className="text-gray-500 text-center pb-2">
                    {'Добавьте графики'}
                </div>
            )}
            <div className="flex flex-wrap gap-4">
                {charts.map((chart, index) => (
                    <SingleChart key={index} {...chart} />
                ))}
            </div>
        </div>
    );
};
