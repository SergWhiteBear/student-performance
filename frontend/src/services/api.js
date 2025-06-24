import axios from 'axios';

const api = axios.create({
    baseURL: '/'
});

export const studentApi = {
    getStudentsWithPredict: (params) => api.get('/students/with_relations', {params}),
    getDirections: () => api.get('directions/all/'),
    createDirection: (id, name) =>
        api.post(`/directions/`, null, {params: {direction_id: id, name}}),
    deleteDirection: (id) => api.delete(`/directions/${id}`),
    updateDirection: (id, data) => api.put(`/directions/${id}`, data),
    createStudent: (data) => api.post('/students/', data),
    updateStudent: (id, data) => api.put(`/students/${id}`, data),
    deleteStudent: (id) => api.delete(`/students/${id}`),
    getDashboardStats: (modelId, targetFeature, targetDirection) =>
        api.get('/analysis/probability-intervals', {
            params: {model_id: modelId, target_feature: targetFeature, direction_id: targetDirection}
        }),
    loadModel: (modelName) => api.get(`/ml/load?model_id=${modelName}`),
    listAllModels: () => axios.get('/ml/'),
    predictByIds: (payload) => axios.post('ml/predict/by_ids', payload),
    getStudentsByFilters: (params) => axios.get('students/by_filters', {params}),
    getModels: () =>
        axios.get(`/ml/`),
    getMarginEffect: async ({target_name, x_values, model_id}) => {
        const response = await axios.post('ml/margin_effect', {
            target_name,
            x_values,
            model_id
        });
        return response;
    }
};

const axiosInstance = axios.create({
    baseURL: '/',
    headers: {
        'Content-Type': 'application/json',
    },
});

export const directionsApi = {
    getAllDirections: () => axiosInstance.get('/directions/all/'),
};
