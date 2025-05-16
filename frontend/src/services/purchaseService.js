import axios from "axios";

// Base URL from .env
const BASE_URL = import.meta.env.VITE_API_URL;

// Axios instance
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});


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
    console.error("Error searching medicines:", error);
    throw error;
  }
};

/**
 * Create a New Purchase
 * @param {Object} purchaseData - The purchase data including items
 * @returns {Promise} - Response from the server with purchaseID and billNumber
 */
export const createPurchase = async (purchaseData) => {
  try {
    const response = await api.post("/api/purchases", purchaseData);
    return response.data;
  } catch (error) {
    console.error("Error creating purchase:", error);
    throw error;
  }
};


/**
 * Get All Purchases
 * @returns {Promise} - Purchase data array
 */
export const fetchPurchases = async () => {
  try {
    const response = await api.get("/api/purchases");
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("Error fetching purchases:", error);
    throw error;
  }
};

/**
 * Get Single Purchase by ID
 * @param {string|number} purchaseId - The ID of the purchase
 * @returns {Promise} - Purchase details and items
 */
export const fetchPurchaseById = async (purchaseId) => {
  try {
    const response = await api.get(`/api/purchases/${purchaseId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching purchase with ID ${purchaseId}:`, error);
    throw error;
  }
};

/**
 * Delete Purchase by ID
 * @param {string|number} purchaseId - The ID of the purchase
 * @returns {Promise} - Response from the server
 */
export const deletePurchase = async (purchaseId) => {
  try {
    const response = await api.post(`/api/purchases/delete/${purchaseId}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting purchase with ID ${purchaseId}:`, error);
    throw error;
  }
};

/**
 * Update Purchase Items
 * @param {string|number} purchaseId - The ID of the purchase
 * @param {Array} items - Array of purchase items to update
 * @returns {Promise} - Response from the server
 */
export const updatePurchaseItems = async (purchaseId, items) => {
  try {
    const response = await api.put(`/api/purchases/${purchaseId}/items`, {
      PurchaseItems: items,
    });
    return response.data;
  } catch (error) {
    console.error(`Error updating purchase items for ID ${purchaseId}:`, error);
    throw error;
  }
};

/**
 * Fetch Purchase Details for Return
 * @param {string|number} purchaseId - The ID or Bill Number of the purchase
 * @returns {Promise} - Purchase details and items
 */
export const fetchPurchaseDetails = async (purchaseId) => {
  try {
    const response = await api.get(`/api/purchases/${encodeURIComponent(purchaseId)}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching purchase details for ID ${purchaseId}:`, error);
    throw error;
  }
};

/**
 * Process Purchase Return
 * @param {string|number} purchaseId - The ID of the purchase
 * @param {Object} returnData - The return data including items, created by, and total return amount
 * @returns {Promise} - Response from the server
 */
export const processPurchaseReturn = async (purchaseId, returnData) => {
  try {
    const response = await api.post(`/api/purchases/${purchaseId}/return`, returnData);
    return response.data;
  } catch (error) {
    console.error(`Error processing purchase return for ID ${purchaseId}:`, error);
    throw error;
  }
};

export default api;

