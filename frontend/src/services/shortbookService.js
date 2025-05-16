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
 * Fetch All ShortBook Items
 * @returns {Promise} - Array of shortbook items
 */
export const fetchShortBook = async () => {
  try {
    const response = await api.get('/api/shortbook');
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('Error fetching ShortBook:', error);
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
 * Add or Update Customer for ShortBook Item
 * @param {string|number} shortBookId - The ID of the shortbook item
 * @param {Object} customerData - Customer data including name, mobile, and isNewCustomer flag
 * @returns {Promise} - Response from the server
 */
export const addCustomer = async (shortBookId, customerData) => {
  try {
    const response = await api.put(`/api/shortbook/${shortBookId}/requested-by`, customerData);
    return response.data;
  } catch (error) {
    console.error(`Error updating RequestedByUser for ShortBook ID ${shortBookId}:`, error);
    throw error;
  }
};

/**
 * Fetch Item Details for Adding to ShortBook
 * @param {string|number} itemId - The ID of the item
 * @returns {Promise} - Item details including MinQty
 */
export const fetchItemDetails = async (itemId) => {
  try {
    const response = await api.get(`/api/purchases/item?itemId=${itemId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching item details for ID ${itemId}:`, error);
    throw error;
  }
};

/**
 * Add Item to ShortBook
 * @param {Object} itemData - The item data to add
 * @returns {Promise} - Added item data including shortBookId
 */
export const addShortBookItem = async (itemData) => {
  try {
    const response = await api.post('/api/shortbook', itemData);
    return response.data;
  } catch (error) {
    console.error('Error adding item to ShortBook:', error);
    throw error;
  }
};

/**
 * Delete ShortBook Item
 * @param {string|number} shortBookId - The ID of the shortbook item
 * @returns {Promise} - Response from the server
 */
export const deleteShortBookItem = async (shortBookId) => {
  try {
    const response = await api.delete(`/api/shortbook/${shortBookId}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting ShortBook item with ID ${shortBookId}:`, error);
    throw error;
  }
};

/**
 * Update Status of ShortBook Items
 * @param {string|number} shortBookId - The ID of the shortbook item
 * @param {string} status - The new status
 * @returns {Promise} - Response from the server
 */
export const updateShortBookStatus = async (shortBookId, status) => {
  try {
    const response = await api.put(`/api/shortbook/${shortBookId}/status`, { status });
    return response.data;
  } catch (error) {
    console.error(`Error updating status for ShortBook ID ${shortBookId}:`, error);
    throw error;
  }
};

/**
 * Generate Purchase Order from ShortBook Items
 * @param {Object[]} items - Array of selected shortbook items
 * @returns {Promise} - Response from the server including poId
 */
export const generatePurchaseOrder = async (items) => {
  try {
    const response = await api.post('/api/shortbook/createpo', { items });
    return response.data;
  } catch (error) {
    console.error('Error generating PO:', error);
    throw error;
  }
};

/**
 * Edit ShortBook Item
 * @param {string|number} shortBookId - The ID of the shortbook item
 * @param {Object} itemData - Updated item data
 * @returns {Promise} - Response from the server
 */
export const editShortBookItem = async (shortBookId, itemData) => {
  try {
    const response = await api.put(`/api/shortbook/${shortBookId}`, itemData);
    return response.data;
  } catch (error) {
    console.error(`Error updating ShortBook item with ID ${shortBookId}:`, error);
    throw error;
  }
};

export default api;