import React, {useState, useEffect} from 'react';
import {studentApi, directionsApi} from '../services/api';
import StudentsTable from '../components/students/StudentsTable';
import ModalAdd from '../components/students/ModalAdd';
import ImportModal from '../components/students/ImportModal';

export const StudentsPage = () => {
    const [students, setStudents] = useState([]);
    const [directions, setDirections] = useState([]);
    const [selectedDirectionId, setSelectedDirectionId] = useState(null);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);

    useEffect(() => {
        loadDirections();
    }, []);

    useEffect(() => {
        loadStudents();
    }, [selectedDirectionId]);

    const loadStudents = async () => {
        try {
            // Новый эндпоинт для получения студентов с фильтрацией по направлению
            const params = selectedDirectionId ? {direction_id: selectedDirectionId} : {};
            const response = await studentApi.getStudentsByFilters(params);
            setStudents(response.data);
        } catch (error) {
            console.error('Error loading students:', error);
        }
    };

    const loadDirections = async () => {
        try {
            const response = await directionsApi.getAllDirections();
            setDirections(response.data);
        } catch (error) {
            console.error('Error loading directions:', error);
        }
    };

    const handleDirectionChange = (e) => {
        const id = e.target.value === '' ? null : Number(e.target.value);
        setSelectedDirectionId(id);
        setSelectedStudents([]);
    };

    const handleRowClick = (student) => {
        setSelectedStudents((prev) =>
            prev.includes(student.id) ? prev.filter((id) => id !== student.id) : [...prev, student.id]
        );
    };

    const handleAddStudentClick = () => {
        setSelectedStudent(null);
        setIsEditMode(false);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedStudent(null);
    };

    const handleSaveStudent = async (studentData) => {
        try {
            if (isEditMode && selectedStudent) {
                await studentApi.updateStudent(selectedStudent.id, studentData);
            } else {
                await studentApi.createStudent(studentData);
            }
            await loadStudents();
            handleCloseModal();
        } catch (error) {
            console.error('Error saving student:', error);
        }
    };

    const handleDeleteStudents = async () => {
        try {
            await Promise.all(selectedStudents.map((id) => studentApi.deleteStudent(id)));
            await loadStudents();
            setSelectedStudents([]);
        } catch (error) {
            console.error('Error deleting students:', error);
        }
    };

    const handleEditClick = () => {
        if (selectedStudents.length === 1) {
            const studentToEdit = students.find((s) => s.id === selectedStudents[0]);
            setSelectedStudent(studentToEdit);
            setIsEditMode(true);
            setIsModalOpen(true);
        }
    };

    const handleImportClick = () => {
        setIsImportModalOpen(true);
    };

    const handleImportClose = () => {
        setIsImportModalOpen(false);
    };

    const handleFileUpload = async (file, name) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('name', name);

        try {
            const url = new URL('http://localhost:7000/students/upload');
            url.searchParams.append('sheet_name', name);

            const response = await fetch(url.toString(), {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                alert('Файл успешно загружен!');
                await loadStudents(); // обновляем список студентов
            } else {
                const errorData = await response.json();
                alert(`Ошибка при загрузке файла: ${errorData.message || 'Неизвестная ошибка'}`);
            }
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Не удалось загрузить файл.');
        }

        setIsImportModalOpen(false);
    };

    return (
        <div className="bg-white rounded-lg shadow p-6 min-h-screen pb-24">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Управление студентами</h1>
                <div className="flex gap-4 items-center">
                    <select
                        value={selectedDirectionId || ''}
                        onChange={handleDirectionChange}
                        className="border border-gray-300 rounded px-3 py-1.5"
                    >
                        <option value="">Все направления</option>
                        {directions.map((direction) => (
                            <option key={direction.id} value={direction.id}>
                                {direction.name}
                            </option>
                        ))}
                    </select>
                    <button
                        onClick={handleImportClick}
                        className="relative overflow-hidden group bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                    >
                  <span
                      className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  ></span>
                        <span className="relative z-10 flex items-center gap-2">
                   📚 Импорт данных
                  </span>
                    </button>
                    <button
                        onClick={handleAddStudentClick}
                        className="relative overflow-hidden group bg-gradient-to-r from-blue-500 to-blue-600 text-white px-2 py-2 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-1.5"
                    >
            <span
                className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            ></span>
                        <span className="relative z-10 flex items-center gap-2">
              <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
              </svg>
              Добавить студента
            </span>
                    </button>

                </div>
            </div>

            <div className="overflow-x-auto mb-4">
                <StudentsTable
                    students={students}
                    selectedStudents={selectedStudents}
                    onRowClick={handleRowClick}
                />
            </div>

            <ImportModal
                isOpen={isImportModalOpen}
                onClose={handleImportClose}
                onUpload={handleFileUpload}
            />

            {isModalOpen && (
                <ModalAdd
                    student={selectedStudent}
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    onSave={handleSaveStudent}
                    isEditMode={isEditMode}
                    directions={directions}
                />
            )}

            {selectedStudents.length > 0 && (
                <div
                    className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-blue-500/90 to-blue-600/90 backdrop-blur-md"
                >
                    <div className="container mx-auto px-4 py-3">
                        <div className="flex items-center justify-end gap-4">
                            <div className="flex-1 flex items-center gap-4">
                                <span className="text-white/90 font-medium">Выбрано: {selectedStudents.length}</span>
                                <div className="h-6 w-px bg-white/30"></div>
                                <button
                                    onClick={() => setSelectedStudents([])}
                                    className="text-white/80 hover:text-white text-sm font-medium transition-colors"
                                >
                                    Сбросить
                                </button>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={handleEditClick}
                                    disabled={selectedStudents.length !== 1}
                                    className={`px-3 py-2 rounded-lg transition-all flex items-center gap-2 ${
                                        selectedStudents.length === 1
                                            ? 'bg-white text-blue-600 hover:bg-white/95'
                                            : 'bg-white/20 text-white/50 cursor-not-allowed'
                                    }`}
                                >
                                    ✏️ Редактировать
                                </button>

                                <button
                                    onClick={handleDeleteStudents}
                                    className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/30 transition-colors flex items-center gap-2"
                                >
                                    🗑️ Удалить
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
