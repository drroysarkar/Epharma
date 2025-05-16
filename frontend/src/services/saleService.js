import axios from 'axios';

// Get the base URL from the environment variable (Vite)
const API_URL = import.meta.env.VITE_API_URL;

// Create an axios instance with the base URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Fetch All Sales
 * @returns {Promise} - Array of sale data
 */
export const fetchAllSales = async () => {
  try {
    const response = await api.get('/api/sale/all');
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('Error fetching sales:', error);
    throw error;
  }
};

/**
 * Fetch Single Sale by ID
 * @param {string|number} saleId - The ID of the sale
 * @returns {Promise} - Sale details and items
 */
export const fetchSaleById = async (saleId) => {
  try {
    const response = await api.get(`/api/sale/${saleId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching sale with ID ${saleId}:`, error);
    throw error;
  }
};

/**
 * Delete Sale by ID
 * @param {string|number} saleId - The ID of the sale
 * @returns {Promise} - Response from the server
 */
export const deleteSale = async (saleId) => {
  try {
    const response = await api.post(`/api/sale/delete/${saleId}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting sale with ID ${saleId}:`, error);
    throw error;
  }
};

/**
 * Fetch Sale Details for Return
 * @param {string|number} saleId - The ID or Bill Number of the sale
 * @returns {Promise} - Sale details and items
 */
export const fetchSaleDetails = async (saleId) => {
  try {
    const response = await api.get(`/api/sale/${encodeURIComponent(saleId)}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching sale details for ID ${saleId}:`, error);
    throw error;
  }
};

/**
 * Process Sale Return
 * @param {string|number} saleId - The ID of the sale
 * @param {Object} returnData - The return data including items, created by, and total return amount
 * @returns {Promise} - Response from the server
 */
export const processSaleReturn = async (saleId, returnData) => {
  try {
    const response = await api.post(`/api/sale/${saleId}/return`, returnData);
    return response.data;
  } catch (error) {
    console.error(`Error processing sale return for ID ${saleId}:`, error);
    throw error;
  }
};

/**
 * Fetch Sale by ID for Invoice
 * @param {string|number} saleId - The ID of the sale
 * @returns {Promise} - Sale details and items
 */
export const fetchSaleByIdForInvoice = async (saleId) => {
  try {
    const response = await api.get(`/api/sale/${saleId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching sale for invoice with ID ${saleId}:`, error);
    throw error;
  }
};

/**
 * Fetch Pharmacy Profile
 * @param {string|number} userId - The ID of the user
 * @param {string} token - Authentication token
 * @returns {Promise} - Pharmacy profile data
 */
export const fetchPharmacyProfile = async (userId, token) => {
  try {
    const response = await api.get(`/api/pharmacy/profile/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data.profile;
  } catch (error) {
    console.error(`Error fetching pharmacy profile for user ID ${userId}:`, error);
    throw error;
  }
};

/**
 * Save Sale PDF
 * @param {string|number} saleId - The ID of the sale
 * @param {Object} data - Data including userId
 * @param {string} token - Authentication token
 * @returns {Promise} - Response from the server
 */
export const saveSalePDF = async (saleId, data, token) => {
  try {
    const response = await api.post(`/api/sale/${saleId}/save-pdf`, data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error(`Error saving sale PDF for ID ${saleId}:`, error);
    throw error;
  }
};

/**
 * Search Medicines
 * @param {string} query - The search query for medicines
 * @returns {Promise} - Array of medicine data
 */
export const searchMedicines = async (query) => {
  try {
    const response = await api.get(`/api/medicines/search?query=${encodeURIComponent(query)}`);
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('Error searching medicines:', error);
    throw error;
  }
};

/**
 * Search Customers
 * @param {string} query - The search query for customers
 * @returns {Promise} - Array of customer data
 */
export const searchCustomers = async (query) => {
  try {
    const response = await api.get(`/api/shortbook/customers?query=${encodeURIComponent(query)}`);
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('Error searching customers:', error);
    throw error;
  }
};

/**
 * Create a New Sale
 * @param {Object} saleData - The sale data including items
 * @returns {Promise} - Response from the server with saleID
 */
export const createSale = async (saleData) => {
  try {
    const response = await api.post('/api/sale', saleData);
    return response.data;
  } catch (error) {
    console.error('Error creating sale:', error);
    throw error;
  }
};

export default api;