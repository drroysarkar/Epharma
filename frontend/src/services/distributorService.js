import axios from 'axios';

// Get the base URL from the environment variable (Vite)
const API_URL = import.meta.env.VITE_API_URL;

// Create an axios instance with the base URL
const api = axios.create({
  baseURL: API_URL,
});

// Fetch all distributors
export const fetchDistributors = async () => {
  try {
    const response = await api.get('/api/distributors/all');
    return response.data;
  } catch (error) {
    throw new Error('Failed to fetch distributors');
  }
};

// Add a new distributor
export const addDistributor = async (distributorData) => {
  try {
    const response = await api.post('/api/distributors', distributorData);
    return response.data;
  } catch (error) {
    throw new Error('Failed to add distributor');
  }
};

// Update an existing distributor
export const updateDistributor = async (distributorId, distributorData) => {
  try {
    await api.put(`/api/distributors/${distributorId}`, distributorData);
    return distributorData; // Return the updated data for local state update
  } catch (error) {
    throw new Error('Failed to update distributor');
  }
};

// Delete a distributor
export const deleteDistributor = async (distributorId) => {
  try {
    await api.delete(`/api/distributors/${distributorId}`);
  } catch (error) {
    throw new Error('Failed to delete distributor');
  }
};