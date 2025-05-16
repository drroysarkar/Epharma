import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaEdit, FaDownload } from 'react-icons/fa';
import { fetchPurchaseOrders, updatePurchaseOrderItem } from '../services/pOrderService'; // Import API service functions

export default function PurchaseOrder() {
    const [purchaseOrders, setPurchaseOrders] = useState([]);
    const [selectedPO, setSelectedPO] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDistributorPromptOpen, setIsDistributorPromptOpen] = useState(false);
    const [isDistributorModalOpen, setIsDistributorModalOpen] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [formData, setFormData] = useState({ requestedQuantity: '', manufacturer: '' });
    const [distributorData, setDistributorData] = useState({ distributorName: '', distributorLocation: '' });
    const { poId } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchPOs = async () => {
            try {
                const data = await fetchPurchaseOrders();
                setPurchaseOrders(data);
                if (poId) {
                    const po = data.find((po) => po.PurchaseOrderID === parseInt(poId));
                    setSelectedPO(po);
                }
            } catch (error) {
                console.error('Error fetching purchase orders:', error);
                alert('Something went wrong while fetching purchase orders');
            }
        };
        fetchPOs();
    }, [poId]);

    const handleSelectPO = (po) => {
        setSelectedPO(po);
        navigate(`/purchase-orders/${po.PurchaseOrderID}`);
    };

    const handleBack = () => {
        setSelectedPO(null);
        navigate('/purchase/order');
    };

    const openEditModal = (item) => {
        console.log('Opening edit modal for item:', item); // Debug log
        setEditItem(item);
        setFormData({
            requestedQuantity: item.RequestedQuantity.toString(),
            manufacturer: item.Manufacturer || '',
        });
        setIsEditModalOpen(true);
    };

    const handleUpdateItem = async () => {
        if (!editItem) {
            alert('Error: No item selected. Please try again.');
            return;
        }

        try {
            await updatePurchaseOrderItem(editItem.PurchaseOrderItemID, {
                requestedQuantity: parseInt(formData.requestedQuantity),
                manufacturer: formData.manufacturer,
            });

            const updatedPOs = purchaseOrders.map((po) => {
                if (po.PurchaseOrderID === selectedPO.PurchaseOrderID) {
                    return {
                        ...po,
                        Items: po.Items.map((item) =>
                            item.PurchaseOrderItemID === editItem.PurchaseOrderItemID
                                ? { ...item, RequestedQuantity: parseInt(formData.requestedQuantity), Manufacturer: formData.manufacturer }
                                : item
                        ),
                    };
                }
                return po;
            });
            setPurchaseOrders(updatedPOs);
            setSelectedPO(updatedPOs.find((po) => po.PurchaseOrderID === selectedPO.PurchaseOrderID));
            setIsEditModalOpen(false);
            setEditItem(null);
            alert('Item updated successfully!');
        } catch (error) {
            console.error('Error updating item:', error);
            alert('Error updating item. Please try again.');
        }
    };

    const downloadCSV = (items, includeDistributor, distributorName, distributorLocation) => {
        const headers = [
            'Item Name',
            'Item Description',
            ...(includeDistributor ? ['Distributor Name', 'Distributor Location'] : []),
            'Manufacturer',
            'Requested Quantity',
        ];

        const rows = items.map((item) => [
            `"${item.ItemName}"`,
            `"${item.ItemDescription}"`,
            ...(includeDistributor ? [`"${distributorName}"`, `"${distributorLocation}"`] : []),
            `"${item.Manufacturer || ''}"`,
            item.RequestedQuantity,
        ]);

        const csvContent = [
            `"PURCHASE ORDER: PO #${selectedPO.PurchaseOrderID}"`,
            `"Created on: ${new Date(selectedPO.CreatedAt).toLocaleDateString()}"`,
            '', // Blank line for separation
            headers.join(','),
            ...rows.map((row) => row.join(',')),
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `PO_${selectedPO.PurchaseOrderID}_items.csv`;
        link.click();
    };

    const handleDownloadCSV = () => {
        setIsDistributorPromptOpen(true);
    };

    const handleDistributorPrompt = (setDistributor) => {
        setIsDistributorPromptOpen(false);
        if (setDistributor) {
            setIsDistributorModalOpen(true);
        } else {
            downloadCSV(selectedPO.Items, false);
        }
    };

    const handleDistributorSubmit = () => {
        if (!distributorData.distributorName || !distributorData.distributorLocation) {
            alert('Please provide both distributor name and location');
            return;
        }
        downloadCSV(selectedPO.Items, true, distributorData.distributorName, distributorData.distributorLocation);
        setIsDistributorModalOpen(false);
        setDistributorData({ distributorName: '', distributorLocation: '' });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 p-6 md:p-10 font-sans">
            <h1 className="text-3xl font-bold text-gray-800 mb-8 tracking-tight">
                Purchase Orders <span className="text-indigo-600">({purchaseOrders.length})</span>
            </h1>

            {selectedPO ? (
                <div className="space-y-6 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
                        <div className="bg-blue-900 p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={handleBack}
                                        className="group text-white hover:text-indigo-200 transition-all duration-300 ease-in-out"
                                    >
                                        <FaArrowLeft className="text-lg group-hover:-translate-x-1 transition-transform duration-300" />
                                    </button>
                                    <h2 className="text-xl font-semibold tracking-wide">
                                        PO #{selectedPO.PurchaseOrderID}
                                    </h2>
                                    <button
                                        onClick={handleDownloadCSV}
                                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors duration-300"
                                    >
                                        <FaDownload />
                                        Download CSV
                                    </button>
                                </div>
                                <span className="text-sm bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full font-medium">
                                    Created on {new Date(selectedPO.CreatedAt).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-blue-900">
                                <thead className="bg-gray-100 text-gray-800 sticky top-0 z-10">
                                    <tr className="border-b border-gray-200">
                                        <th className="px-6 py-4 font-semibold">Item Name</th>
                                        <th className="px-6 py-4 font-semibold">Description</th>
                                        <th className="px-6 py-4 font-semibold">Distributor</th>
                                        <th className="px-6 py-4 font-semibold">Manufacturer</th>
                                        <th className="px-6 py-4 font-semibold text-center">Requested Qty</th>
                                        <th className="px-6 py-4 font-semibold text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedPO.Items.map((item, index) => (
                                        <tr
                                            key={item.PurchaseOrderItemID || item.ShortBookID} // Fallback to ShortBookID if PurchaseOrderItemID is missing
                                            className={`border-b border-gray-200 transition-colors duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-indigo-50 hover:shadow-sm`}
                                        >
                                            <td className="px-6 py-4 font-medium text-gray-800">{item.ItemName}</td>
                                            <td className="px-6 py-4 text-gray-600">{item.ItemDescription}</td>
                                            <td className="px-6 py-4">
                                                <span className="font-medium text-gray-800">{item.DistributorName}</span>
                                                <span className="text-gray-500"> ({item.DistributorLocation})</span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">{item.Manufacturer}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-block bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium">
                                                    {item.RequestedQuantity}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => open/SimplePurchaseOrderModal(item)}
                                                    className="text-indigo-600 hover:text-indigo-800 transition-colors duration-200"
                                                >
                                                    <FaEdit className="text-lg" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200 animate-fade-in">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-white sticky top-0 z-10 bg-blue-900">
                                <tr className="border-b border-gray-200">
                                    <th className="px-6 py-4 font-semibold">Purchase Order ID</th>
                                    <th className="px-6 py-4 font-semibold">Created At</th>
                                    <th className="px-6 py-4 font-semibold text-center">Items Count</th>
                                </tr>
                            </thead>
                            <tbody>
                                {purchaseOrders.map((po, index) => (
                                    <tr
                                        key={po.PurchaseOrderID}
                                        className={`border-b border-gray-200 transition-colors duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-indigo-50 hover:shadow-sm cursor-pointer`}
                                        onClick={() => handleSelectPO(po)}
                                    >
                                        <td className="px-6 py-4 font-medium text-indigo-600 hover:text-indigo-800 transition-colors">
                                            PO #{po.PurchaseOrderID}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {new Date(po.CreatedAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-block bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium">
                                                {po.Items.length}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-xl font-semibold mb-4">Edit Item: {editItem?.ItemName}</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Requested Quantity</label>
                                <input
                                    type="number"
                                    value={formData.requestedQuantity}
                                    onChange={(e) => setFormData({ ...formData, requestedQuantity: e.target.value })}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                    min="1"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Manufacturer</label>
                                <input
                                    type="text"
                                    value={formData.manufacturer}
                                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                               ennio
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdateItem}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                            >
                                Update
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Distributor Prompt Modal */}
            {isDistributorPromptOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-xl font-semibold mb-4">Set Distributor</h2>
                        <p className="text-gray-600 mb-4">Do you want to set the same distributor for all items in the CSV?</p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => handleDistributorPrompt(false)}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                            >
                                No
                            </button>
                            <button
                                onClick={() => handleDistributorPrompt(true)}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                            >
                                Yes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Distributor Input Modal */}
            {isDistributorModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-xl font-semibold mb-4">Enter Distributor Details</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Distributor Name</label>
                                <input
                                    type="text"
                                    value={distributorData.distributorName}
                                    onChange={(e) => setDistributorData({ ...distributorData, distributorName: e.target.value })}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Distributor Location</label>
                                <input
                                    type="text"
                                    value={distributorData.distributorLocation}
                                    onChange={(e) => setDistributorData({ ...distributorData, distributorLocation: e.target.value })}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={() => setIsDistributorModalOpen(false)}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDistributorSubmit}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                            >
                                Submit
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-fade-in {
                    animation: fadeIn 0.5s ease-out forwards;
                }
            `}</style>
        </div>
    );
}