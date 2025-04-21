import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const PurchaseNextStep = () => {
  const { purchaseID } = useParams();
  const [purchaseDetails, setPurchaseDetails] = useState(null);
  const [products, setProducts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPurchaseDetails = async () => {
      try {
        const response = await fetch(`http://localhost:5010/api/purchases/${purchaseID}`);
        if (response.ok) {
          const data = await response.json();
          console.log("Fetched purchase data:", data);

          if (data.purchaseDetails) {
            setPurchaseDetails(data.purchaseDetails);
            setProducts(data.purchaseItems.map(item => ({
              ...item,
              ItemID: item.ItemID
            })) || []);
          } else {
            alert("Invalid data format received from API");
          }
        } else {
          alert("Failed to load purchase details");
        }
      } catch (error) {
        console.error("Error fetching purchase details:", error);
        alert("Something went wrong while fetching purchase details");
      }
    };

    fetchPurchaseDetails();
  }, [purchaseID]);

  const handleInputChange = (index, field, value) => {
    const updatedProducts = [...products];
    updatedProducts[index][field] = field === 'Is_DiscLocked' ? value.target.checked : value;
    setProducts(updatedProducts);
  };

  const handleSavePurchase = async () => {
    try {
      const response = await fetch(`http://localhost:5010/api/purchases/${purchaseID}/items`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          PurchaseItems: products.map((item) => ({
            ItemID: item.ItemID,
            ItemLocation: item.ItemLocation,
            HSNCode: item.HSNCode,
            MRP: parseFloat(item.MRP),
            PTR: parseFloat(item.PTR),
            Quantity: parseInt(item.Quantity),
            Discount: parseFloat(item.Discount) || 0,
            Is_DiscLocked: item.Is_DiscLocked,
            NetAmount: parseFloat(item.NetAmount),
            Margin: parseFloat(item.Margin) || 0,
            MinQty: parseInt(item.MinQty) || 0,
            MaxQty: parseInt(item.MaxQty) || 0,
          })),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert("Purchase items updated successfully!");
        navigate('/purchase/bills'); // Redirect to PurchaseList after save
      } else {
        const errorData = await response.json();
        alert("Failed to update purchase items");
        console.error(errorData);
      }
    } catch (error) {
      console.error("Error updating purchase items:", error);
      alert("Something went wrong while updating purchase items");
    }
  };

  const handleSkip = () => {
    navigate('/purchase/bills'); // Navigate to PurchaseList page (adjust route as needed)
  };

  if (!purchaseDetails || Object.keys(purchaseDetails).length === 0) {
    return <div className="p-6 text-center text-gray-600">Loading purchase details...</div>;
  }

  return (
    <div className="text-sm bg-gray-100 min-h-screen">
      <div className="bg-white px-6 py-4 border-b flex items-center justify-between">
        <h2 className="text-lg font-semibold">Edit Purchase Details</h2>
        <div className="flex gap-3">
          <button onClick={handleSkip}className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1 rounded">Skip</button>
          <button onClick={handleSavePurchase} className="bg-green-500 hover:bg-green-600 text-white px-4 py-1 rounded">Save</button>
        </div>
      </div>

      <div className="p-6 pt-4 rounded-md shadow-sm bg-white">
        <div className="flex flex-wrap gap-4">
          {[
            ['Distributor Name', purchaseDetails.DistributorName, 'text', true],
            ['Bill Number', purchaseDetails.BillNumber, 'text', false],
            ['Bill Date', new Date(purchaseDetails.BillDate).toISOString().split('T')[0], 'date', true],
            ['Due Date', new Date(purchaseDetails.DueDate).toISOString().split('T')[0], 'date', false],
            ['Pending Amount', purchaseDetails.PendingAmount, 'text', true],
          ].map(([label, value, type, isReadOnly], i) => (
            <div key={i} className="flex flex-col" style={{ minWidth: '180px' }}>
              <label className="block mb-1 font-medium">{label}</label>
              <input
                type={type}
                className={`border p-2 rounded w-full transition-all duration-150 focus:p-3 focus:text-base focus:scale-105 focus:border-blue-500 focus:shadow-lg focus:bg-white ${isReadOnly ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : 'bg-yellow-100'}`}
                value={value}
                readOnly={isReadOnly}
                onChange={(e) => {
                  if (label === 'Bill Number') {
                    setPurchaseDetails({ ...purchaseDetails, BillNumber: e.target.value });
                  } else if (label === 'Due Date') {
                    setPurchaseDetails({ ...purchaseDetails, DueDate: e.target.value });
                  }
                }}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto mt-2">
        <table className="min-w-full border border-gray-300 bg-white text-left text-gray-800">
          <thead className="bg-blue-600 text-xs uppercase font-semibold text-white">
            <tr>
              {['Item Name', 'HSN Code', 'Location', 'Stock', 'MRP', 'PTR', 'Lock Disc.%', 'Discount', 'Sale Rate', 'Margin', 'Min. Qty', 'Max. Qty'].map((heading, i) => (
                <th key={i} className="px-3 py-2 border">{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.map((prod, idx) => (
              <tr key={idx} className="hover:bg-blue-100">
                <td className="px-3 py-2 border">{prod.ItemName}</td>
                <td className="px-3 py-2 border">
                  <input
                    className="w-full p-1 border rounded transform transition-all duration-150 focus:p-2 focus:text-base focus:scale-105 focus:border-blue-500 focus:shadow-lg focus:bg-white"
                    type="text"
                    value={prod.HSNCode}
                    onChange={(e) => handleInputChange(idx, 'HSNCode', e.target.value)}
                  />
                </td>
                <td className="px-3 py-2 border">
                  <input
                    className="w-full p-1 border rounded transform transition-all duration-150 focus:p-2 focus:text-base focus:scale-105 focus:border-blue-500 focus:shadow-lg focus:bg-white"
                    type="text"
                    value={prod.ItemLocation}
                    onChange={(e) => handleInputChange(idx, 'ItemLocation', e.target.value)}
                  />
                </td>
                <td className="px-3 py-2 border">
                  <input
                    className="w-full p-1 border rounded transform transition-all duration-150 focus:p-2 focus:text-base focus:scale-105 focus:border-blue-500 focus:shadow-lg focus:bg-white"
                    type="number"
                    value={prod.Quantity}
                    onChange={(e) => handleInputChange(idx, 'Quantity', e.target.value)}
                  />
                </td>
                <td className="px-3 py-2 border">
                  <div className="flex items-center border rounded overflow-hidden">
                    <span className="px-2 bg-gray-100 text-gray-600">₹</span>
                    <input
                      className="w-full p-1 outline-none transform transition-all duration-150 focus:p-2 focus:text-base focus:scale-105 focus:border-blue-500 focus:shadow-lg focus:bg-white"
                      type="number"
                      value={prod.MRP}
                      onChange={(e) => handleInputChange(idx, 'MRP', e.target.value)}
                    />
                  </div>
                </td>
                <td className="px-3 py-2 border">
                  <div className="flex items-center border rounded overflow-hidden">
                    <span className="px-2 bg-gray-100 text-gray-600">₹</span>
                    <input
                      className="w-full p-1 outline-none transform transition-all duration-150 focus:p-2 focus:text-base focus:scale-105 focus:border-blue-500 focus:shadow-lg focus:bg-white"
                      type="number"
                      value={prod.PTR}
                      onChange={(e) => handleInputChange(idx, 'PTR', e.target.value)}
                    />
                  </div>
                </td>
                <td className="px-3 py-2 border">
                  <label className="inline-flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={prod.Is_DiscLocked}
                      onChange={(e) => handleInputChange(idx, 'Is_DiscLocked', e)}
                    />
                    <span>{prod.Is_DiscLocked ? 'Yes' : 'No'}</span>
                  </label>
                </td>
                <td className="px-3 py-2 border">
                  <div className="flex items-center border rounded overflow-hidden">
                    <input
                      className="w-full p-1 outline-none transform transition-all duration-150 focus:p-2 focus:text-base focus:scale-105 focus:border-blue-500 focus:shadow-lg focus:bg-white"
                      type="number"
                      value={prod.Discount}
                      onChange={(e) => handleInputChange(idx, 'Discount', e.target.value)}
                    />
                    <span className="px-2 bg-gray-100 text-gray-600">%</span>
                  </div>
                </td>
                <td className="px-3 py-2 border">
                  <input
                    className="w-full p-1 border rounded transform transition-all duration-150 focus:p-2 focus:text-base focus:scale-105 focus:border-blue-500 focus:shadow-lg focus:bg-white"
                    type="number"
                    value={prod.NetAmount}
                    onChange={(e) => handleInputChange(idx, 'NetAmount', e.target.value)}
                  />
                </td>
                <td className="px-3 py-2 border">
                  <div className="flex items-center border rounded overflow-hidden">
                    <input
                      className="w-full p-1 outline-none transform transition-all duration-150 focus:p-2 focus:text-base focus:scale-105 focus:border-blue-500 focus:shadow-lg focus:bg-white"
                      type="number"
                      value={prod.Margin}
                      onChange={(e) => handleInputChange(idx, 'Margin', e.target.value)}
                    />
                    <span className="px-2 bg-gray-100 text-gray-600">%</span>
                  </div>
                </td>
                <td className="px-3 py-2 border">
                  <input
                    className="w-full p-1 border rounded transform transition-all duration-150 focus:p-2 focus:text-base focus:scale-105 focus:border-blue-500 focus:shadow-lg focus:bg-white"
                    type="number"
                    value={prod.MinQty}
                    onChange={(e) => handleInputChange(idx, 'MinQty', e.target.value)}
                  />
                </td>
                <td className="px-3 py-2 border">
                  <input
                    className="w-full p-1 border rounded transform transition-all duration-150 focus:p-2 focus:text-base focus:scale-105 focus:border-blue-500 focus:shadow-lg focus:bg-white"
                    type="number"
                    value={prod.MaxQty}
                    onChange={(e) => handleInputChange(idx, 'MaxQty', e.target.value)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PurchaseNextStep;