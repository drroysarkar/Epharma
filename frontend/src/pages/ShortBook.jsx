import { useState, useEffect, useMemo } from 'react';
import {
  FaArrowDown,
  FaSearch,
  FaUser,
  FaTrash,
  FaCheck,
  FaPlus,
  FaEdit,
  FaSort,
  FaSortUp,
  FaSortDown,
} from 'react-icons/fa';
import { FiDownload, FiClipboard } from 'react-icons/fi';
import { useNavigate, Link } from 'react-router-dom';
import { debounce } from 'lodash';
import {
  fetchShortBook,
  searchMedicines,
  searchCustomers,
  addCustomer,
  fetchItemDetails,
  addShortBookItem,
  deleteShortBookItem,
  updateShortBookStatus,
  generatePurchaseOrder,
  editShortBookItem,
} from '../services/shortbookService'; // Import API service functions

function DataTable({
  items,
  selectedItems,
  selectAll,
  handleSelectAll,
  handleSelectItem,
  handleEditItem,
  handleDeleteItem,
  openModal,
  sortConfig,
  setSortConfig,
}) {
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedItems = useMemo(() => {
    if (!sortConfig.key) return items;

    return [...items].sort((a, b) => {
      // Numeric columns
      const numericColumns = ['MinStock', 'CurrentStock', 'RequestedQuantity'];
      if (numericColumns.includes(sortConfig.key)) {
        const numA = Number(a[sortConfig.key]);
        const numB = Number(b[sortConfig.key]);
        return sortConfig.direction === 'asc' ? numA - numB : numB - numA;
      }

      // Default string comparison
      const valA = a[sortConfig.key]?.toString().toLowerCase() || '';
      const valB = b[sortConfig.key]?.toString().toLowerCase() || '';

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [items, sortConfig]);

  const getSortIcon = (key) => {
    if (sortConfig.key !== key)
      return <FaSort className="inline ml-1 text-gray-400 text-xs" />;
    return sortConfig.direction === 'asc' ? (
      <FaSortUp className="inline ml-1 text-blue-600 text-xs" />
    ) : (
      <FaSortDown className="inline ml-1 text-blue-600 text-xs" />
    );
  };

  return (
    <div className="bg-white rounded-xl overflow-x-auto shadow-lg">
      <table className="min-w-full text-xs">
        <thead className="bg-blue-900 text-white border-b border-gray-200">
          <tr>
            <th className="px-4 py-3 text-left">
              <input
                type="checkbox"
                checked={selectAll}
                onChange={handleSelectAll}
                className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </th>
            <th className="px-4 py-2 text-left font-bold text-white">Date</th>
            <th
              className="px-4 py-2 text-left font-bold text-white cursor-pointer"
              onClick={() => handleSort('ItemName')}
            >
              Items {getSortIcon('ItemName')}
            </th>
            <th
              className="px-4 py-2 text-left font-bold text-white cursor-pointer"
              onClick={() => handleSort('DistributorName')}
            >
              Distributor {getSortIcon('DistributorName')}
            </th>
            <th
              className="px-4 py-2 text-left font-bold text-white cursor-pointer"
              onClick={() => handleSort('Manufacturer')}
            >
              Manuf./Loc. {getSortIcon('Manufacturer')}
            </th>
            <th
              className="px-4 py-2 text-left font-bold text-white cursor-pointer flex items-center gap-1"
              onClick={() => handleSort('Priority')}
            >
              Priority {getSortIcon('Priority')}
            </th>
            <th
              className="px-4 py-2 text-center font-bold text-white cursor-pointer"
              onClick={() => handleSort('MinStock')}
            >
              Min. {getSortIcon('MinStock')}
            </th>
            <th
              className="px-4 py-2 text-center font-bold text-white cursor-pointer"
              onClick={() => handleSort('CurrentStock')}
            >
              Stock {getSortIcon('CurrentStock')}
            </th>
            <th
              className="px-4 py-2 text-center font-bold text-white cursor-pointer"
              onClick={() => handleSort('RequestedQuantity')}
            >
              Qty. {getSortIcon('RequestedQuantity')}
            </th>
            <th
              className="px-4 py-2 text-left font-bold text-white cursor-pointer"
              onClick={() => handleSort('Status')}
            >
              Status {getSortIcon('Status')}
            </th>
            <th className="px-4 py-2 text-center font-bold text-white">Req. By</th>
            <th className="px-4 py-2 text-center font-bold text-white">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedItems.map((item) => (
            <tr
              key={item.ShortBookID}
              className="border-b border-gray-100 hover:bg-blue-50 transition-all"
            >
              <td className="px-4 py-2">
                <input
                  type="checkbox"
                  checked={selectedItems.has(item.ShortBookID)}
                  onChange={() => handleSelectItem(item.ShortBookID)}
                  className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </td>
              <td className="px-4 py-2 whitespace-nowrap text-gray-600">{item.Date}</td>
              <td className="px-4 py-2 flex items-center gap-2">
                <div>
                  <div className="font-semibold text-gray-800 leading-tight">{item.ItemName}</div>
                  <div className="text-gray-500 text-[10px] leading-tight">{item.ItemDescription}</div>
                </div>
              </td>
              <td className="px-4 py-2">
                <div className="font-medium text-gray-800 leading-tight">{item.DistributorName}</div>
                <div className="text-gray-500 text-[10px] leading-tight">{item.DistributorLocation}</div>
              </td>
              <td className="px-4 py-2 text-gray-600">{item.Manufacturer}</td>
              <td className="px-4 py-2 text-green-600 flex items-center gap-1">
                <FaArrowDown className="text-xs" /> {item.Priority}
              </td>
              <td className="px-4 py-2 text-center text-gray-600">{item.MinStock}</td>
              <td className="px-4 py-2 text-center text-gray-600">{item.CurrentStock}</td>
              <td className="px-4 py-2 text-center text-gray-600">{item.RequestedQuantity}</td>
              <td className="px-4 py-2 text-yellow-600 font-semibold">{item.Status}</td>
              <td className="px-4 py-2 text-center">
                <button
                  onClick={() => openModal(item.ShortBookID)}
                  className="flex items-center justify-center gap-1"
                >
                  <FaUser className="text-blue-600" />
                  {item.RequestedByUser && item.RequestedByUser !== 'System' ? (
                    <FaCheck className="text-green-600 text-[10px]" />
                  ) : (
                    <FaPlus className="text-blue-600 text-[10px]" />
                  )}
                </button>
              </td>
              <td className="px-4 py-2 text-center">
                <FaEdit
                  className="inline text-blue-600 cursor-pointer hover:text-blue-800 mr-2 text-sm"
                  onClick={() => handleEditItem(item)}
                />
                <FaTrash
                  className="inline text-red-600 cursor-pointer hover:text-red-800 text-sm"
                  onClick={() => handleDeleteItem(item.ShortBookID)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ShortBook() {
  const [search, setSearch] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [medicineSuggestions, setMedicineSuggestions] = useState([]);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [shortBookItems, setShortBookItems] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState([]);
  const [selectedShortBookId, setSelectedShortBookId] = useState(null);
  const [addedCustomers, setAddedCustomers] = useState({});
  const [activeTab, setActiveTab] = useState('existing');
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerMobile, setNewCustomerMobile] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [editPriority, setEditPriority] = useState('');
  const [editQuantity, setEditQuantity] = useState('');
  const [editDistributorName, setEditDistributorName] = useState('');
  const [editDistributorLocation, setEditDistributorLocation] = useState('');
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: '', direction: 'asc' });
  const navigate = useNavigate();

  useEffect(() => {
    const loadShortBook = async () => {
      try {
        const data = await fetchShortBook();
        setShortBookItems(data);
      } catch (error) {
        alert('Failed to fetch ShortBook items. Please try again.');
      }
    };
    loadShortBook();
  }, []);

  const searchMedicinesDebounced = debounce(async (query) => {
    if (query.length < 3) {
      setMedicineSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);
    try {
      const data = await searchMedicines(query);
      setMedicineSuggestions(data);
      setShowSuggestions(true);
    } catch (error) {
      setMedicineSuggestions([]);
      setShowSuggestions(false);
      alert('Failed to search medicines. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, 300);

  const handleDrugNameChange = (e) => {
    const value = e.target.value;
    setNewItemName(value);
    setSelectedMedicine(null);
    if (value.length >= 3) {
      searchMedicinesDebounced(value);
    } else {
      setMedicineSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectMedicine = (medicine) => {
    setNewItemName(medicine.name);
    setSelectedMedicine(medicine);
    setShowSuggestions(false);
  };

  const handleCustomerSearch = debounce(async (query) => {
    setCustomerSearch(query);
    if (query.length < 3) {
      setCustomerResults([]);
      return;
    }

    try {
      const data = await searchCustomers(query);
      setCustomerResults(data);
    } catch (error) {
      setCustomerResults([]);
      alert('Failed to search customers. Please try again.');
    }
  }, 300);

  const handleSelectCustomer = (customer) => {
    setSelectedCustomer(customer);
  };

  const handleAddCustomer = async () => {
    if (!selectedShortBookId) {
      alert('No ShortBook item selected');
      return;
    }

    let customerData;
    if (activeTab === 'existing') {
      if (!selectedCustomer) {
        alert('Please select a customer');
        return;
      }
      customerData = {
        requestedByUser: selectedCustomer.name,
        mobile: selectedCustomer.mobile,
        isNewCustomer: false,
      };
    } else {
      if (!newCustomerName || !newCustomerMobile) {
        alert('Please enter both name and mobile number for the new customer');
        return;
      }
      customerData = {
        requestedByUser: newCustomerName,
        mobile: newCustomerMobile,
        isNewCustomer: true,
      };
    }

    try {
      await addCustomer(selectedShortBookId, customerData);
      setAddedCustomers((prev) => ({
        ...prev,
        [selectedShortBookId]: customerData.requestedByUser,
      }));
      setShortBookItems((prev) =>
        prev.map((item) =>
          item.ShortBookID === selectedShortBookId
            ? { ...item, RequestedByUser: customerData.requestedByUser }
            : item
        )
      );
      setIsModalOpen(false);
      setCustomerSearch('');
      setCustomerResults([]);
      setNewCustomerName('');
      setNewCustomerMobile('');
      setSelectedCustomer(null);
      setActiveTab('existing');
    } catch (error) {
      alert(`Failed to update RequestedByUser: ${error.message || 'Unknown error'}`);
    }
  };

  const handleAddItem = async () => {
    if (!newItemName || !selectedMedicine) {
      alert('Please select a medicine from the suggestions');
      return;
    }

    try {
      const itemDetails = await fetchItemDetails(selectedMedicine.id);
      const minStock = itemDetails.MinQty || 0;
      const currentStock = selectedMedicine.Quantity || 0;

      const newItem = {
        itemId: selectedMedicine.id,
        itemName: selectedMedicine.name,
        itemDescription:
          `${selectedMedicine.short_composition1 || ''} ${selectedMedicine.short_composition2 || ''}`.trim() ||
          selectedMedicine.pack_size_label,
        manufacturer: selectedMedicine.manufacturer_name || 'Unknown',
        minStock,
        currentStock,
        requestedQuantity: minStock > currentStock ? minStock - currentStock : 1,
      };

      const addedItem = await addShortBookItem(newItem);
      setShortBookItems([
        {
          ShortBookID: addedItem.shortBookId,
          ItemId: newItem.itemId,
          ItemName: newItem.itemName,
          ItemDescription: newItem.itemDescription,
          Date: new Date().toLocaleString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          }),
          DistributorName: 'Unknown',
          DistributorLocation: 'Unknown',
          Manufacturer: newItem.manufacturer,
          Priority: 'Low',
          MinStock: newItem.minStock,
          CurrentStock: newItem.currentStock,
          RequestedQuantity: newItem.requestedQuantity,
          Status: 'Pending',
          RequestedByUser: 'System',
        },
        ...shortBookItems,
      ]);
      setNewItemName('');
      setSelectedMedicine(null);
      setMedicineSuggestions([]);
    } catch (error) {
      alert('Failed to add item to ShortBook');
    }
  };

  const handleDeleteItem = async (shortBookId) => {
    if (!window.confirm('Are you sure you want to delete this item?')) {
      return;
    }

    try {
      await deleteShortBookItem(shortBookId);
      setShortBookItems(shortBookItems.filter((item) => item.ShortBookID !== shortBookId));
      setAddedCustomers((prev) => {
        const updated = { ...prev };
        delete updated[shortBookId];
        return updated;
      });
      if (editItem && editItem.ShortBookID === shortBookId) {
        setEditItem(null);
      }
      setSelectedItems((prev) => {
        const newSelected = new Set(prev);
        newSelected.delete(shortBookId);
        return newSelected;
      });
    } catch (error) {
      alert('Failed to delete item');
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedItems.size === 0) {
      alert('No items selected to delete');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${selectedItems.size} selected items?`)) {
      return;
    }

    try {
      const deletePromises = Array.from(selectedItems).map((id) => deleteShortBookItem(id));
      await Promise.all(deletePromises);
      setShortBookItems((prev) => prev.filter((item) => !selectedItems.has(item.ShortBookID)));
      setAddedCustomers((prev) => {
        const updated = { ...prev };
        selectedItems.forEach((id) => delete updated[id]);
        return updated;
      });
      setSelectedItems(new Set());
      setSelectAll(false);
    } catch (error) {
      alert('Error deleting selected items');
    }
  };

  const handleStatusUpdate = async (status) => {
    if (selectedItems.size === 0) {
      alert('No items selected to update');
      return;
    }

    try {
      const updatePromises = Array.from(selectedItems).map((id) => updateShortBookStatus(id, status));
      await Promise.all(updatePromises);
      setShortBookItems((prev) =>
        prev.map((item) => (selectedItems.has(item.ShortBookID) ? { ...item, Status: status } : item))
      );
      setSelectedItems(new Set());
      setSelectAll(false);
    } catch (error) {
      alert(`Error updating status to ${status}`);
    }
  };

  const handleGeneratePO = async () => {
    if (selectedItems.size === 0) {
      alert('No items selected to generate PO');
      return;
    }

    const selectedRows = shortBookItems.filter((item) => selectedItems.has(item.ShortBookID));

    try {
      const { poId } = await generatePurchaseOrder(selectedRows);
      setShortBookItems((prev) =>
        prev.map((item) =>
          selectedItems.has(item.ShortBookID) ? { ...item, Status: 'PO Generated' } : item
        )
      );
      setSelectedItems(new Set());
      setSelectAll(false);
      navigate(`/purchase-orders/${poId}`);
    } catch (error) {
      alert('Failed to generate PO');
    }
  };

  const openModal = (shortBookId) => {
    setSelectedShortBookId(shortBookId);
    setIsModalOpen(true);
    setActiveTab('existing');
    setCustomerSearch('');
    setCustomerResults([]);
    setNewCustomerName('');
    setNewCustomerMobile('');
    setSelectedCustomer(null);
  };

  const handleEditItem = (item) => {
    setEditItem(item);
    setEditPriority(item.Priority);
    setEditQuantity(item.RequestedQuantity.toString());
    setEditDistributorName(item.DistributorName);
    setEditDistributorLocation(item.DistributorLocation);
  };

  const handleSaveEdit = async () => {
    if (!editItem) return;

    const updatedItem = {
      priority: editPriority,
      requestedQuantity: parseInt(editQuantity),
      distributorName: editDistributorName,
      distributorLocation: editDistributorLocation,
    };

    try {
      await editShortBookItem(editItem.ShortBookID, updatedItem);
      setShortBookItems((prev) =>
        prev.map((item) =>
          item.ShortBookID === editItem.ShortBookID
            ? {
                ...item,
                Priority: editPriority,
                RequestedQuantity: parseInt(editQuantity),
                DistributorName: editDistributorName,
                DistributorLocation: editDistributorLocation,
              }
            : item
        )
      );
      alert(`Item "${editItem.ItemName}" updated successfully!`);
      setEditItem(null);
      setEditPriority('');
      setEditQuantity('');
      setEditDistributorName('');
      setEditDistributorLocation('');
    } catch (error) {
      alert('Failed to update item');
    }
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedItems(new Set());
      setSelectAll(false);
    } else {
      const newSelected = new Set(shortBookItems.map((item) => item.ShortBookID));
      setSelectedItems(newSelected);
      setSelectAll(true);
    }
  };

  const handleSelectItem = (shortBookId) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(shortBookId)) {
      newSelected.delete(shortBookId);
      setSelectAll(false);
    } else {
      newSelected.add(shortBookId);
      if (newSelected.size === shortBookItems.length) {
        setSelectAll(true);
      }
    }
    setSelectedItems(newSelected);
  };

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div className="flex items-center gap-4 relative">
          <h1 className="text-2xl font-bold text-gray-800">
            ShortBook <span className="text-blue-600">({shortBookItems.length})</span>
          </h1>
          <div className="relative">
            <input
              type="text"
              placeholder="Search and add new item"
              className="border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-80 bg-white shadow-sm transition-all"
              value={newItemName}
              onChange={handleDrugNameChange}
            />
            {showSuggestions && (
              <div className="absolute top-12 left-0 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-20 max-h-64 overflow-y-auto">
                {isLoading ? (
                  <div className="p-3 text-gray-500 text-sm">Loading...</div>
                ) : medicineSuggestions.length > 0 ? (
                  medicineSuggestions.map((medicine) => (
                    <div
                      key={medicine.id}
                      className="p-3 hover:bg-blue-50 cursor-pointer transition-all"
                      onClick={() => handleSelectMedicine(medicine)}
                    >
                      <div className="font-medium text-gray-800">{medicine.name}</div>
                      <div className="text-xs text-gray-500">{medicine.pack_size_label}</div>
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-gray-500 text-sm">No results found</div>
                )}
              </div>
            )}
          </div>
          <button
            onClick={handleAddItem}
            className="border border-blue-600 text-blue-600 px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-md hover:bg-blue-600 hover:text-white hover:shadow-lg"
          >
            Add Item
          </button>
        </div>

        <div className="flex items-center gap-4">
          {/* Order Assistant Icon with Hover Text */}
          <div className="relative group cursor-pointer flex items-center">
            <Link
              to="/orderassistant"
              className="border border-blue-600 text-blue-600 p-2 rounded-full transition-all shadow-md hover:bg-blue-600 hover:text-white"
            >
              <FiClipboard size={18} />
            </Link>
            <span className="absolute left-1/2 transform -translate-x-1/2 mt-16 bg-gray-900 text-white text-xs px-3 py-1 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap z-10">
              Go to Order Assistant
            </span>
          </div>

          {/* Search Box */}
          <div className="relative">
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Item, Manf., Distr., Priority, Status"
              className="border border-gray-300 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Download Button */}
          <button className="flex items-center gap-2 bg-white border border-blue-600 text-blue-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 hover:text-white transition-all shadow-md">
            <FiDownload />
            Download
          </button>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex justify-center items-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="bg-white w-full max-w-lg rounded-xl p-6 shadow-2xl animate-fade-in" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Add Customer for Request</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 text-xl font-bold"
              >
                ✕
              </button>
            </div>
            <div className="mb-6">
              <p className="text-sm text-gray-600">
                Keep your customers automatically notified by encouraging them to use the ePharma App.
              </p>
            </div>
            <div className="flex mb-6 border-b border-gray-200">
              <button
                className={`flex-1 py-3 text-sm font-medium ${
                  activeTab === 'existing' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('existing')}
              >
                Existing Customer
              </button>
              <button
                className={`flex-1 py-3 text-sm font-medium ${
                  activeTab === 'new' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('new')}
              >
                New Customer
              </button>
            </div>
            {activeTab === 'existing' ? (
              <>
                <div className="mb-6">
                  <input
                    type="text"
                    placeholder="Search by first 3 digits of Mobile"
                    className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm transition-all"
                    value={customerSearch}
                    onChange={(e) => handleCustomerSearch(e.target.value)}
                  />
                </div>
                {customerResults.length > 0 && (
                  <div className="mb-6 max-h-48 overflow-y-auto">
                    {customerResults.map((customer) => (
                      <div
                        key={customer.id}
                        className={`flex items-center justify-between p-3 border-b hover:bg-gray-50 cursor-pointer transition-all ${
                          selectedCustomer && selectedCustomer.id === customer.id ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => handleSelectCustomer(customer)}
                      >
                        <span className="text-gray-800 font-medium">{customer.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-gray-500 text-sm">{customer.mobile}</span>
                          <FaUser className="text-blue-600" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="mb-6">
                <input
                  type="text"
                  placeholder="Customer Name"
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3 bg-white shadow-sm transition-all"
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Mobile Number"
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm transition-all"
                  value={newCustomerMobile}
                  onChange={(e) => setNewCustomerMobile(e.target.value)}
                />
              </div>
            )}
            <div className="flex justify-end mb-6">
              <button
                onClick={handleAddCustomer}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-all shadow-md"
              >
                Submit
              </button>
            </div>
            <p className="text-sm text-gray-600">
              Ensure the customer mobile number is correct for accurate notifications.
            </p>
          </div>
        </div>
      )}

      {/* Edit Form */}
      {editItem && (
        <div className="bg-white p-6 mb-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Edit ShortBook Item</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Item Name</label>
              <input
                type="text"
                value={editItem.ItemName}
                disabled
                className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm bg-gray-100 text-gray-500 cursor-not-allowed shadow-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Requested By</label>
              <input
                type="text"
                value={editItem.RequestedByUser}
                disabled
                className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm bg-gray-100 text-gray-500 cursor-not-allowed shadow-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              <select
                value={editPriority}
                onChange={(e) => setEditPriority(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm transition-all"
              >
                <option value="Low">Low</option>
                <option value="High">High</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Requested Quantity</label>
              <input
                type="number"
                value={editQuantity}
                onChange={(e) => setEditQuantity(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm transition-all"
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Distributor Name</label>
              <input
                type="text"
                value={editDistributorName}
                onChange={(e) => setEditDistributorName(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Distributor Location</label>
              <input
                type="text"
                value={editDistributorLocation}
                onChange={(e) => setEditDistributorLocation(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm transition-all"
              />
            </div>
          </div>
          <div className="flex justify-end mt-6 gap-4">
            <button
              onClick={() => setEditItem(null)}
              className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-all shadow-md"
            >
              Save Changes
            </button>
          </div>
        </div>
      )}

      {/* DataTable */}
      <DataTable
        items={shortBookItems.filter(
          (item) =>
            item.ItemName.toLowerCase().includes(search.toLowerCase()) ||
            item.Manufacturer.toLowerCase().includes(search.toLowerCase()) ||
            item.DistributorName.toLowerCase().includes(search.toLowerCase()) ||
            item.Priority.toLowerCase().includes(search.toLowerCase()) ||
            item.Status.toLowerCase().includes(search.toLowerCase())
        )}
        selectedItems={selectedItems}
        selectAll={selectAll}
        handleSelectAll={handleSelectAll}
        handleSelectItem={handleSelectItem}
        handleEditItem={handleEditItem}
        handleDeleteItem={handleDeleteItem}
        openModal={openModal}
        sortConfig={sortConfig}
        setSortConfig={setSortConfig}
      />

      {/* Footer Buttons (conditionally rendered) */}
      {selectedItems.size > 0 && (
        <div className="mt-4 flex justify-center gap-3 items-center">
          <button
            onClick={() => handleStatusUpdate('Ordered')}
            className="border border-blue-600 text-blue-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 hover:text-white transition-all shadow-md"
          >
            Mark as Ordered
          </button>
          <button
            onClick={() => handleStatusUpdate('Delivered')}
            className="border border-green-600 text-green-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-600 hover:text-white transition-all shadow-md"
          >
            Mark as Delivered
          </button>
          <button
            onClick={handleGeneratePO}
            className="border border-purple-600 text-purple-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-600 hover:text-white transition-all shadow-md"
          >
            Generate PO
          </button>
          <button
            onClick={handleDeleteSelected}
            className="border border-red-600 text-red-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-600 hover:text-white transition-all shadow-md"
          >
            Remove Selected
          </button>
        </div>
      )}
    </div>
  );
}