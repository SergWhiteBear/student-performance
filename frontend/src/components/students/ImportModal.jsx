export default function ImportModal({isOpen, onClose, onUpload}) {
    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        const fileInput = e.target.elements.file;
        const nameInput = e.target.elements.name;

        const file = fileInput.files[0];
        const name = nameInput.value.trim();

        if (!file) {
            alert('Пожалуйста, выберите файл для загрузки.');
            return;
        }

        if (!name) {
            alert('Пожалуйста, введите название загрузки (оно будет использовано как имя листа).');
            return;
        }

        onUpload(file, name);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
                <h2 className="text-xl font-bold mb-4">Импорт данных</h2>

                <form onSubmit={handleSubmit}>
                    {/* Название загрузки (используется как sheet_name) */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Название листа
                        </label>
                        <input
                            type="text"
                            name="name"
                            placeholder="Введите название"
                            className="w-full border border-gray-300 rounded px-3 py-2"
                        />
                    </div>

                    {/* Загрузка файла */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Загрузите файл (.xlsx)
                        </label>
                        <input
                            type="file"
                            name="file"
                            accept=".xlsx"
                            className="w-full border border-gray-300 rounded px-3 py-2"
                        />
                    </div>

                    {/* Кнопка для скачивания шаблона */}


                    <div className="flex justify-between items-center gap-3 mt-6">
                        {/* Кнопка для скачивания шаблона */}
                        <a
                            href="http://localhost:7000/students/template/"
                            download
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium transition cursor-pointer self-auto"
                        >
                            Скачать шаблон (.xlsx)
                        </a>

                        {/* Кнопки управления */}
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
                            >
                                Отмена
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                            >
                                Загрузить
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}