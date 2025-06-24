import React, { useEffect, useState } from 'react';
import { studentApi } from '../services/api';
import { DirectionCard } from '../components/direction/DirectionCard';
import { ModalAddDirection } from '../components/direction/ModalAddDirection';

export const DirectionsPage = () => {
  const [directions, setDirections] = useState([]);
  const [isModalOpen, setModalOpen] = useState(false);

  const fetchDirections = async () => {
    const { data } = await studentApi.getDirections();
    setDirections(data);
  };

  useEffect(() => {
    fetchDirections();
  }, []);

  return (
    <div className="bg-gray-50 min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-white shadow rounded-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-xl font-bold">Наборы данных</h1>
            <button
              onClick={() => setModalOpen(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Добавить
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {directions.map((direction) => (
              <DirectionCard
                key={direction.id}
                direction={direction}
                onUpdate={fetchDirections}
              />
            ))}
          </div>
        </div>
      </div>

      <ModalAddDirection
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchDirections}
      />
    </div>
  );
};
