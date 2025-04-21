import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const PurchaseReturn = () => {
  const [purchaseID, setPurchaseID] = useState('');
  const [purchaseDetails, setPurchaseDetails] = useState(null);
  const [selectedItems, setSelectedItems] = useState({});
  const [returnQuantities, setReturnQuantities] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    if (purchaseID) {
      fetchPurchaseDetails();
    }
  }, [purchaseID]);

  const fetchPurchaseDetails = async () => {
    try {
      const response = await fetch(`http://localhost:5010/api/purchases/${purchaseID}`);
      if (response.ok) {
        const data = await response.json();
        setPurchaseDetails(data);
        // Reset selected items and quantities when new data is fetched
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
      } else {
        alert('Purchase not found');
        setPurchaseDetails(null);
        setSelectedItems({});
        setReturnQuantities({});
      }
    } catch (error) {
      console.error('Error fetching purchase details:', error);
      alert('Something went wrong while fetching purchase details');
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

  const handleReturnSubmit = async () => {
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

    // Check for zero return quantities
    const zeroQuantityItems = returnItems.filter(item => item.ReturnQuantity === 0);
    if (zeroQuantityItems.length > 0) {
      alert('Return quantity cannot be 0 for selected items. Please enter a valid quantity.');
      return;
    }

    // Validate that return quantities do not exceed available quantities
    const invalidItems = returnItems.filter(item => {
      const availableQty = purchaseDetails.purchaseItems.find(i => i.ItemID === item.ItemID).Quantity;
      return item.ReturnQuantity > availableQty;
    });
    if (invalidItems.length > 0) {
      alert('One or more return quantities exceed available quantities');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5010/api/purchases/${purchaseID}/return`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ReturnItems: returnItems }),
      });

      if (response.ok) {
        alert('Return processed successfully');
        setPurchaseID('');
        setPurchaseDetails(null);
        setSelectedItems({});
        setReturnQuantities({});
      } else {
        const errorData = await response.json();
        alert('Failed to process return: ' + errorData.message);
      }
    } catch (error) {
      console.error('Error processing return:', error);
      alert('Something went wrong while processing the return');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="border border-gray-300 rounded-lg p-4 bg-white shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Purchase Return</h1>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="Enter Purchase ID"
              value={purchaseID}
              onChange={(e) => setPurchaseID(e.target.value)}
              className="w-48 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            
          </div>
        </div>
        {purchaseDetails && purchaseDetails.purchaseDetails && (
          <div>
            <div className="mb-6 p-6 bg-white border rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Purchase Details</h3>
              <div className="flex flex-wrap gap-4">
                <div className="bg-yellow-100 p-3 rounded-lg flex-1 min-w-[200px]">
                  <p className="text-sm text-gray-600">Distributor</p>
                  <p className="font-medium text-gray-900">{purchaseDetails.purchaseDetails.DistributorName}</p>
                </div>
                <div className="bg-yellow-100 p-3 rounded-lg flex-1 min-w-[200px]">
                  <p className="text-sm text-gray-600">Bill Number</p>
                  <p className="font-medium text-gray-900">{purchaseDetails.purchaseDetails.BillNumber}</p>
                </div>
                <div className="bg-yellow-100 p-3 rounded-lg flex-1 min-w-[200px]">
                  <p className="text-sm text-gray-600">Bill Date</p>
                  <p className="font-medium text-gray-900">{new Date(purchaseDetails.purchaseDetails.BillDate).toLocaleDateString()}</p>
                </div>
                <div className="bg-yellow-100 p-3 rounded-lg flex-1 min-w-[200px]">
                  <p className="text-sm text-gray-600">Pending Amount</p>
                  <p className="font-medium text-gray-900">₹{purchaseDetails.purchaseDetails.PendingAmount.toFixed(2)}</p>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-300 bg-white text-left text-gray-800">
                <thead className="bg-blue-600 text-xs uppercase font-semibold text-white">
                  <tr>
                    <th className="px-3 py-2 border">Select</th>
                    <th className="px-3 py-2 border">Return Qty</th>
                    <th className="px-3 py-2 border">Item Name</th>
                    <th className="px-3 py-2 border">HSN Code</th>
                    <th className="px-3 py-2 border">Quantity</th>
                    <th className="px-3 py-2 border">Expiry</th>
                    <th className="px-3 py-2 border">Net Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {purchaseDetails.purchaseItems.map((item) => (
                    <tr key={item.ItemID} className="hover:bg-blue-100">
                      <td className="px-3 py-2 border">
                        <input
                          type="checkbox"
                          checked={selectedItems[item.ItemID] || false}
                          onChange={() => handleItemSelect(item.ItemID)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-3 py-2 border">
                        <input
                          type="number"
                          min="0"
                          max={item.Quantity}
                          value={returnQuantities[item.ItemID] || 0}
                          onChange={(e) => handleQuantityChange(item.ItemID, e.target.value)}
                          className="w-20 p-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          disabled={!selectedItems[item.ItemID]}
                        />
                      </td>
                      <td className="px-3 py-2 border">{item.ItemName}</td>
                      <td className="px-3 py-2 border">{item.HSNCode}</td>
                      <td className="px-3 py-2 border">{item.Quantity}</td>
                      <td className="px-3 py-2 border">{item.Expiry || 'N/A'}</td>
                      <td className="px-3 py-2 border">₹{item.NetAmount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-6">
              <button
                onClick={handleReturnSubmit}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200 shadow-md"
              >
                Submit Return
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PurchaseReturn;