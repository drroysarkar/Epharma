import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchSaleDetails, processSaleReturn } from '../services/saleService'; // Import API service functions

const SaleReturn = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [saleDetails, setSaleDetails] = useState(null);
  const [selectedItems, setSelectedItems] = useState({});
  const [returnQuantities, setReturnQuantities] = useState({});
  const [selectedMember, setSelectedMember] = useState('Owner');
  const navigate = useNavigate();

  const handleFetchSaleDetails = async () => {
    if (!searchTerm) {
      alert('Please enter a Sale ID or Bill Number');
      return;
    }

    try {
      const data = await fetchSaleDetails(searchTerm);
      setSaleDetails(data);

      // Initialize selections and quantities
      const initialSelections = data.saleItems.reduce((acc, item) => ({
        ...acc,
        [item.SaleItemID]: false,
      }), {});
      const initialQuantities = data.saleItems.reduce((acc, item) => ({
        ...acc,
        [item.SaleItemID]: item.Is_Loose ? item.Quantity : 0,
      }), {});
      setSelectedItems(initialSelections);
      setReturnQuantities(initialQuantities);
    } catch (error) {
      console.error('Error fetching sale details:', error);
      alert('Sale not found or an error occurred');
      setSaleDetails(null);
      setSelectedItems({});
      setReturnQuantities({});
    }
  };

  const handleItemSelect = (saleItemId) => {
    setSelectedItems((prev) => ({
      ...prev,
      [saleItemId]: !prev[saleItemId],
    }));

    const item = saleDetails.saleItems.find(item => item.SaleItemID === saleItemId);
    if (!item.Is_Loose && selectedItems[saleItemId]) {
      setReturnQuantities((prev) => ({
        ...prev,
        [saleItemId]: 0,
      }));
    }
  };

  const handleQuantityChange = (saleItemId, value) => {
    const numValue = parseInt(value) || 0;
    const item = saleDetails.saleItems.find(item => item.SaleItemID === saleItemId);
    if (numValue > item.Quantity) {
      alert(`Return quantity cannot exceed available quantity (${item.Quantity}) for ${item.ItemName}`);
      return;
    }
    setReturnQuantities((prev) => ({
      ...prev,
      [saleItemId]: numValue,
    }));
  };

  const calculateTotalReturnAmount = () => {
    if (!saleDetails || !saleDetails.saleItems) return 0;
    return Object.entries(selectedItems)
      .filter(([_, isSelected]) => isSelected)
      .reduce((total, [saleItemId]) => {
        const item = saleDetails.saleItems.find(i => i.SaleItemID === parseInt(saleItemId));
        const returnQty = returnQuantities[saleItemId] || 0;
        const unitNetAmount = item.NetAmount / item.Quantity;
        return total + unitNetAmount * returnQty;
      }, 0);
  };

  const handleReturnSubmit = async () => {
    if (!saleDetails) {
      alert('No sale details available');
      return;
    }

    const returnItems = Object.entries(selectedItems)
      .filter(([_, isSelected]) => isSelected)
      .map(([saleItemId]) => ({
        SaleItemID: parseInt(saleItemId),
        ReturnQuantity: returnQuantities[saleItemId] || 0,
      }));

    if (returnItems.length === 0) {
      alert('Please select at least one item to return');
      return;
    }

    if (returnItems.some(item => item.ReturnQuantity === 0)) {
      alert('Return quantity cannot be 0 for selected items');
      return;
    }

    if (returnItems.some(item => {
      const itemInfo = saleDetails.saleItems.find(i => i.SaleItemID === item.SaleItemID);
      return item.ReturnQuantity > itemInfo.Quantity;
    })) {
      alert('One or more return quantities exceed available quantities');
      return;
    }

    const returnData = {
      ReturnItems: returnItems,
      CreatedBy: selectedMember,
      TotalReturnAmount: calculateTotalReturnAmount(),
    };

    try {
      await processSaleReturn(saleDetails.saleDetails.SaleID, returnData);
      alert('Return processed successfully');
      // Reset state
      setSearchTerm('');
      setSaleDetails(null);
      setSelectedItems({});
      setReturnQuantities({});
      setSelectedMember('Owner');
    } catch (error) {
      console.error('Error processing return:', error);
      alert('Failed to process return. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-blue-100 p-6">
      <div className="mx-auto bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
          <h1 className="text-3xl font-bold text-blue-900">Sale Return</h1>
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
              className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-400"
            >
              <option value="Owner">Owner</option>
              <option value="John">John</option>
              <option value="Jane">Jane</option>
            </select>
            <input
              type="text"
              placeholder="Enter Sale ID or Bill Number"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="p-2 border border-gray-300 rounded-md w-60 focus:outline-none focus:ring focus:ring-blue-400"
            />
            <button
              onClick={handleFetchSaleDetails}
              className="bg-blue-900 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition"
            >
              Search
            </button>
          </div>
        </div>

        {saleDetails && saleDetails.saleDetails && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Customer', value: saleDetails.saleDetails.CustomerName },
                { label: 'Bill Number', value: saleDetails.saleDetails.BillNumber },
                { label: 'Bill Date', value: new Date(saleDetails.saleDetails.BillDate).toLocaleDateString() },
                { label: 'Total Amount', value: `₹${saleDetails.saleDetails.TotalAmount.toFixed(2)}` }
              ].map((info, idx) => (
                <div key={idx} className="bg-blue-100 p-4 rounded-lg shadow">
                  <p className="text-sm text-blue-700">{info.label}</p>
                  <p className="font-semibold text-blue-900">{info.value}</p>
                </div>
              ))}
            </div>

            <div className="overflow-x-auto mb-6">
              <table className="min-w-full table-auto bg-white shadow rounded-lg overflow-hidden">
                <thead className="bg-blue-900 text-white">
                  <tr>
                    <th className="px-4 py-2 text-center">Select</th>
                    <th className="px-4 py-2 text-center">Return Qty</th>
                    <th className="px-4 py-2 text-left">Item Name</th>
                    <th className="px-4 py-2 text-left">MRP</th>
                    <th className="px-4 py-2 text-left">Quantity</th>
                    <th className="px-4 py-2 text-left">Discount</th>
                    <th className="px-4 py-2 text-left">Net Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {saleDetails.saleItems.map((item) => (
                    <tr key={item.SaleItemID} className="hover:bg-blue-100 border-b">
                      <td className="px-4 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={selectedItems[item.SaleItemID] || false}
                          onChange={() => handleItemSelect(item.SaleItemID)}
                        />
                      </td>
                      <td className="px-4 py-2 text-center">
                        <input
                          type="number"
                          min="0"
                          max={item.Quantity}
                          disabled={!selectedItems[item.SaleItemID] || item.Is_Loose}
                          value={returnQuantities[item.SaleItemID] || 0}
                          onChange={(e) => handleQuantityChange(item.SaleItemID, e.target.value)}
                          className="w-20 p-1 border border-gray-300 rounded focus:outline-none"
                        />
                      </td>
                      <td className="px-4 py-2 text-left">{item.ItemName}</td>
                      <td className="px-4 py-2 text-left">₹{item.MRP.toFixed(2)}</td>
                      <td className="px-4 py-2 text-left">{item.Quantity}</td>
                      <td className="px-4 py-2 text-left">{item.Discount.toFixed(2)}%</td>
                      <td className="px-4 py-2 text-left">₹{item.NetAmount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-lg font-semibold text-blue-900">
                Total Return Amount: ₹{calculateTotalReturnAmount().toFixed(2)}
              </p>
              <button
                onClick={handleReturnSubmit}
                className="bg-blue-900 text-white px-6 py-2 rounded-md hover:bg-green-700 transition"
              >
                Submit Return
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SaleReturn;