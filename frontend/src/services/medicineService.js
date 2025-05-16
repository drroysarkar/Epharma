import axios from 'axios';

// Get the base URL from the environment variable (Vite)
const API_URL = import.meta.env.VITE_API_URL;

// Create an axios instance with the base URL
const api = axios.create({
  baseURL: API_URL,
});

// Fetch medicines based on view mode ('my' or 'all')
export const fetchMedicines = async (viewMode) => {
  try {
    const endpoint = viewMode === 'My' ? '/api/medicines/my' : '/api/medicines/all';
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    throw new Error('Failed to fetch medicines');
  }
};

// Add a new medicine
export const addMedicine = async (medicineData) => {
  try {
    const response = await api.post('/api/medicines', medicineData);
    return response.data;
  } catch (error) {
    throw new Error('Failed to add medicine');
  }
};

// Update an existing medicine
export const updateMedicine = async (medicineId, medicineData) => {
  try {
    await api.put(`/api/medicines/${medicineId}`, medicineData);
    return medicineData; // Return the updated data for local state update
  } catch (error) {
    throw new Error('Failed to update medicine');
  }
};

// Delete a medicine
export const deleteMedicine = async (medicineId) => {
  try {
    await api.delete(`/api/medicines/${medicineId}`);
  } catch (error) {
    throw new Error('Failed to delete medicine');
  }
};