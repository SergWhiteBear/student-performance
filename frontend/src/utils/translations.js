export const translations = {
  // Модели
  math_model: "Математическая модель",
  russian_model: "Модель русского языка",
  physics_model: "Физическая модель",

  // Предметы
  math_score: "Математика",
  russian_score: "Русский язык",
  physics_score: "Физика",
  ege_score: "ЕГЭ",
  session_1_passed: "1 сессия",

  // Категории
  probability_intervals: "Вероятность (%)",
  margin_effect: "Предельный эффект",
  average_scores: "Средние баллы",
};

export const translate = (key) => translations[key] || key;