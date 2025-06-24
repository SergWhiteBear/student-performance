import React, { useState } from "react";

export default function ModelMetrics({ modelId, modelName }) {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const classes = ["False", "True"];

  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);
    setMetrics(null);
    try {
      const res = await fetch(`/ml/${modelId}/metrics`);
      if (!res.ok) throw new Error(`Ошибка загрузки метрик: ${res.status}`);
      const data = await res.json();
      setMetrics(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Рендер матрицы ошибок, если она есть
  const renderConfusionMatrix = (matrix) => {
    if (!Array.isArray(matrix)) return null;
    return (
      <div className="mt-4">
        <h3 className="font-semibold mb-2">Матрица ошибок</h3>
        <div className="overflow-x-auto">
          <table
            className="text-sm border mb-4 max-w-full"
            style={{ width: "auto", tableLayout: "auto" }}
          >
            <thead>
              <tr>
                <th className="p-2 border bg-gray-100">Предсказано \ Реальность</th>
                {classes.map((cls) => (
                  <th key={cls} className="p-2 border bg-gray-100">
                    {cls}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.map((row, i) => (
                <tr key={i}>
                  <td className="p-2 border font-medium bg-gray-100">{classes[i]}</td>
                  {row.map((cell, j) => (
                    <td key={j} className="p-2 border text-center">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Рендер отчёта классификации, если это объект
  const renderClassificationReport = (reportObj) => {
    if (!reportObj || typeof reportObj !== "object") return null;

    // Исключаем accuracy, macro avg, weighted avg для таблицы классов
    const classKeys = Object.keys(reportObj).filter(
      (k) => !["accuracy", "macro avg", "weighted avg"].includes(k)
    );

    return (
      <div className="mb-4">
        <h3 className="font-semibold mb-2">Отчёт о классификации</h3>
        <div className="overflow-x-auto">
          <table
            className="text-sm border mb-4 max-w-full"
            style={{ width: "auto", tableLayout: "auto" }}
          >
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 border">Класс</th>
                <th className="p-2 border">Точность</th>
                <th className="p-2 border">Полнота</th>
                <th className="p-2 border">F1-мера</th>
                <th className="p-2 border">Студентов</th>
              </tr>
            </thead>
            <tbody>
              {classKeys.map((key) => {
                const value = reportObj[key];
                return (
                  <tr key={key}>
                    <td className="p-2 border font-medium">{key}</td>
                    <td className="p-2 border">{value.precision?.toFixed(2)}</td>
                    <td className="p-2 border">{value.recall?.toFixed(2)}</td>
                    <td className="p-2 border">{value["f1-score"]?.toFixed(2)}</td>
                    <td className="p-2 border">{value.support}</td>
                  </tr>
                );
              })}
              {reportObj.accuracy && (
                <tr>
                  <td className="p-2 border font-medium">Точность</td>
                  <td colSpan="3" className="p-2 border text-center">
                    {reportObj.accuracy.toFixed(2)}
                  </td>
                  <td className="p-2 border">
                    {classKeys.reduce(
                      (sum, key) => sum + (reportObj[key]?.support || 0),
                      0
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Рендер дополнительных метрик, например ROC AUC, accuracy и др.
  const renderAdditionalMetrics = (metricsObj) => {
    if (!metricsObj) return null;
    const keysToShow = ["roc_auc", "accuracy", "f1_score", "precision", "recall"];

    return (
      <div className="mt-2">
        <h3 className="font-semibold mb-2">Прочие метрики</h3>
        <ul className="list-disc list-inside space-y-1 text-sm">
          {keysToShow.map((key) => {
            const val = metricsObj[key] ?? metricsObj[key.replace(/_/g, " ")];
            if (val === undefined || val === null) return null;
            return (
              <li key={key}>
                <span className="font-medium">{key.replace(/_/g, " ")}:</span>{" "}
                {typeof val === "number" ? val.toFixed(3) : val.toString()}
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  // Главный рендер метрик
  const renderMetricsTable = (metricsObj) => {
    if (!metricsObj || typeof metricsObj !== "object") return null;

    return (
      <div className="mt-4 space-y-6 border rounded p-4 bg-white shadow">
        {renderConfusionMatrix(metricsObj.confusion_matrix)}
        {renderClassificationReport(metricsObj.classification_report)}
        {renderAdditionalMetrics(metricsObj)}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-4 bg-gray-50 rounded shadow">
      <h2 className="text-xl font-bold mb-4">
        Метрики модели: {modelName || modelId}
      </h2>
      <button
        onClick={fetchMetrics}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        disabled={loading}
      >
        {loading ? "Загрузка..." : "Показать метрики"}
      </button>

      {error && (
        <p className="mt-4 text-red-600 font-semibold">Ошибка: {error}</p>
      )}

      {metrics && renderMetricsTable(metrics)}
    </div>
  );
}
