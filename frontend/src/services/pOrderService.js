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
 * Get All Purchase Orders
 * @returns {Promise} - Purchase order data array
 */
export const fetchPurchaseOrders = async () => {
  try {
    const response = await api.get("/api/shortbook/purchase-orders");
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("Error fetching purchase orders:", error);
    throw error;
  }
};

/**
 * Update Purchase Order Item
 * @param {string|number} itemId - The ID of the purchase order item
 * @param {Object} itemData - The updated item data
 * @returns {Promise} - Response from the server
 */
export const updatePurchaseOrderItem = async (itemId, itemData) => {
  try {
    const response = await api.post(`/api/purchase-order-items/${itemId}`, itemData);
    return response.data;
  } catch (error) {
    console.error(`Error updating purchase order item with ID ${itemId}:`, error);
    throw error;
  }
};

export default api;