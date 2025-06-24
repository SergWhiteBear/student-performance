import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export const BarChartCard = ({ title, data, dataKey = 'value', labelKey = 'label', yPercent = true }) => {
  const chartData = Object.entries(data)
    .map(([label, value]) => ({
      [labelKey]: label,
      [dataKey]: value,
    }))
    .sort((a, b) => {
      const aStart = parseFloat(a[labelKey].split('-')[0]);
      const bStart = parseFloat(b[labelKey].split('-')[0]);
      return isNaN(aStart) || isNaN(bStart) ? 0 : aStart - bStart;
    });

  return (
    <div className="bg-white rounded-lg shadow p-6 h-full flex flex-col">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey={labelKey}
              angle={-45}
              textAnchor="end"
              height={50}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              domain={yPercent ? [0, 1] : ['auto', 'auto']}
              tickFormatter={yPercent ? (value) => `${(value * 100).toFixed(0)}%` : undefined}
              width={50}
            />
            <Tooltip
              formatter={
                yPercent
                  ? (value) => [`${(value * 100).toFixed(1)}%`, 'Значение']
                  : (value) => [value, 'Значение']
              }
              labelFormatter={(label) => `Интервал: ${label}`}
            />
            <Bar
              dataKey={dataKey}
              fill="#367bf4"
              radius={[4, 4, 0, 0]}
              name="Значение"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
