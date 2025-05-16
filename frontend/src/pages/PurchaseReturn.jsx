import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchPurchaseDetails, processPurchaseReturn } from '../services/purchaseService'; // Import API service functions

const PurchaseReturn = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [purchaseDetails, setPurchaseDetails] = useState(null);
  const [selectedItems, setSelectedItems] = useState({});
  const [returnQuantities, setReturnQuantities] = useState({});
  const [selectedMember, setSelectedMember] = useState('Owner');
  const navigate = useNavigate();

  const handleFetchPurchaseDetails = async () => {
    if (!searchTerm) {
      alert('Please enter a Purchase ID or Bill Number');
      return;
    }

    try {
      const data = await fetchPurchaseDetails(searchTerm);
      setPurchaseDetails(data);

      // Initialize selections and quantities
      const initialSelections = data.purchaseItems.reduce((acc, item) => ({
        ...acc,
        [item.ItemID]: false,
      }), {});
      const initialQuantities = data.purchaseItems.reduce((acc, item) => ({
        ...acc,
        [item.ItemID]: 0,
      }), {});
      setSelectedItems(initialSelections);
      setReturnQuantities(initialQuantities);
    } catch (error) {
      console.error('Error fetching purchase details:', error);
      alert('Purchase not found or an error occurred');
      setPurchaseDetails(null);
      setSelectedItems({});
      setReturnQuantities({});
    }
  };

  const handleItemSelect = (itemId) => {
    setSelectedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
    // Reset quantity to 0 if item is deselected
    if (selectedItems[itemId]) {
      setReturnQuantities((prev) => ({
        ...prev,
        [itemId]: 0,
      }));
    }
  };

  const handleQuantityChange = (itemId, value) => {
    const numValue = parseInt(value) || 0;
    const item = purchaseDetails.purchaseItems.find(item => item.ItemID === itemId);
    if (numValue > item.Quantity) {
      alert(`Return quantity cannot exceed available quantity (${item.Quantity}) for ${item.ItemName}`);
      return;
    }
    setReturnQuantities((prev) => ({
      ...prev,
      [itemId]: numValue,
    }));
  };

  const calculateTotalReturnAmount = () => {
    if (!purchaseDetails || !purchaseDetails.purchaseItems) return 0;
    return Object.entries(selectedItems)
      .filter(([_, isSelected]) => isSelected)
      .reduce((total, [itemId]) => {
        const item = purchaseDetails.purchaseItems.find(i => i.ItemID === parseInt(itemId));
        const returnQty = returnQuantities[itemId] || 0;
        const unitPrice = item.Quantity > 0 ? item.NetAmount / item.Quantity : 0;
        return total + (unitPrice * returnQty);
      }, 0);
  };

  const handleReturnSubmit = async () => {
    if (!purchaseDetails) {
      alert('No purchase details available');
      return;
    }

    const returnItems = Object.entries(selectedItems)
      .filter(([_, isSelected]) => isSelected)
      .map(([itemId]) => ({
        ItemID: parseInt(itemId),
        ReturnQuantity: returnQuantities[itemId] || 0,
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
      const itemInfo = purchaseDetails.purchaseItems.find(i => i.ItemID === item.ItemID);
      return item.ReturnQuantity > itemInfo.Quantity;
    })) {
      alert('One or more return quantities exceed available quantities');
      return;
    }

    const totalReturnAmount = calculateTotalReturnAmount();
    const returnData = {
      ReturnItems: returnItems,
      CreatedBy: selectedMember,
      TotalReturnAmount: totalReturnAmount,
    };

    try {
      await processPurchaseReturn(purchaseDetails.purchaseDetails.PurchaseID, returnData);
      alert('Return processed successfully');
      // Reset state
      setSearchTerm('');
      setPurchaseDetails(null);
      setSelectedItems({});
      setReturnQuantities({});
      setSelectedMember('Owner');
    } catch (error) {
      console.error('Error processing return:', error);
      alert('Failed to process return. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="border border-gray-300 rounded-lg p-4 bg-white shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Purchase Return</h1>
          <div className="flex items-center space-x-2">
            <select
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
              className="p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Owner">Owner</option>
              <option value="John">John</option>
              <option value="Jane">Jane</option>
            </select>
            <input
              type="text"
              placeholder="Enter Purchase ID or Bill Number"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-48 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleFetchPurchaseDetails}
              className="bg-blue-900 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200 shadow-md"
            >
              Search
            </button>
          </div>
        </div>

        {purchaseDetails && purchaseDetails.purchaseDetails && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Distributor', value: purchaseDetails.purchaseDetails.DistributorName },
                { label: 'Bill Number', value: purchaseDetails.purchaseDetails.BillNumber },
                { label: 'Bill Date', value: new Date(purchaseDetails.purchaseDetails.BillDate).toLocaleDateString() },
                { label: 'Pending Amount', value: `₹${purchaseDetails.purchaseDetails.PendingAmount.toFixed(2)}` }
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
                    <th className="px-4 py-2 text-left">HSN Code</th>
                    <th className="px-4 py-2 text-left">Quantity</th>
                    <th className="px-4 py-2 text-left">Expiry</th>
                    <th className="px-4 py-2 text-left">Net Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {purchaseDetails.purchaseItems.map((item) => (
                    <tr key={item.ItemID} className="hover:bg-blue-100 border-b">
                      <td className="px-4 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={selectedItems[item.ItemID] || false}
                          onChange={() => handleItemSelect(item.ItemID)}
                        />
                      </td>
                      <td className="px-4 py-2 text-center">
                        <input
                          type="number"
                          min="0"
                          max={item.Quantity}
                          disabled={!selectedItems[item.ItemID]}
                          value={returnQuantities[item.ItemID] || 0}
                          onChange={(e) => handleQuantityChange(item.ItemID, e.target.value)}
                          className="w-20 p-1 border border-gray-300 rounded focus:outline-none"
                        />
                      </td>
                      <td className="px-4 py-2 text-left">{item.ItemName}</td>
                      <td className="px-4 py-2 text-left">{item.HSNCode || 'N/A'}</td>
                      <td className="px-4 py-2 text-left">{item.Quantity}</td>
                      <td className="px-4 py-2 text-left">{item.Expiry || 'N/A'}</td>
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

export default PurchaseReturn;