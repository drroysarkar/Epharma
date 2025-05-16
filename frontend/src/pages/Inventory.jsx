import React, { useState, useEffect, useRef } from 'react';
import DataTable from 'react-data-table-component';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaPills, FaSearch, FaTrash } from 'react-icons/fa';
import { fetchMedicines, addMedicine, updateMedicine, deleteMedicine } from '../services/medicineService';

const Inventory = () => {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterText, setFilterText] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [viewMode, setViewMode] = useState('My');
  const searchRef = useRef(null);
  const [currentMedicine, setCurrentMedicine] = useState({
    id: null,
    name: '',
    Batch: '',
    price: 0,
    Expiry: '',
    Quantity: 0,
    QtyInLoose: 0,
    Is_discontinued: false,
    manufacturer_name: '',
    type: '',
    pack_size_label: '',
    short_composition1: '',
    short_composition2: '',
  });

  // Fetch medicines
  useEffect(() => {
    const getMedicines = async () => {
      try {
        setLoading(true);
        const medicinesData = await fetchMedicines(viewMode);
        const normalizedData = Array.isArray(medicinesData)
          ? medicinesData.map(med => ({
              ...med,
              Quantity: Number(med.Quantity || 0),
              QtyInLoose: Number(med.QtyInLoose || 0),
            }))
          : [];
        setMedicines(normalizedData);
        setLoading(false);
      } catch (error) {
        toast.error(error.message);
        setMedicines([]);
        setLoading(false);
      }
    };
    getMedicines();
  }, [viewMode]);

  // Handle outside click to collapse search bar
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchExpanded(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter medicines
  const filteredMedicines = Array.isArray(medicines)
    ? medicines.filter((medicine) =>
        medicine.name?.toLowerCase().includes(filterText.toLowerCase()) ||
        medicine.Batch?.toLowerCase().includes(filterText.toLowerCase()) ||
        medicine.manufacturer_name?.toLowerCase().includes(filterText.toLowerCase()) ||
        medicine.type?.toLowerCase().includes(filterText.toLowerCase()) ||
        medicine.pack_size_label?.toLowerCase().includes(filterText.toLowerCase()) ||
        medicine.short_composition1?.toLowerCase().includes(filterText.toLowerCase()) ||
        medicine.short_composition2?.toLowerCase().includes(filterText.toLowerCase())
      )
    : [];

  // Open modal for adding
  const openAddModal = () => {
    setIsEditMode(false);
    setCurrentMedicine({
      id: null,
      name: '',
      Batch: '',
      price: 0,
      Expiry: '',
      Quantity: 0,
      QtyInLoose: 0,
      Is_discontinued: false,
      manufacturer_name: '',
      type: '',
      pack_size_label: '',
      short_composition1: '',
      short_composition2: '',
    });
    setIsModalOpen(true);
  };

  // Open modal for editing
  const openEditModal = (medicine) => {
    setIsEditMode(true);
    setCurrentMedicine({
      ...medicine,
      Quantity: Number(medicine.Quantity || 0),
      QtyInLoose: Number(medicine.QtyInLoose || 0),
    });
    setIsModalOpen(true);
  };

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCurrentMedicine((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value,
    }));
  };

  // Save or update medicine
  const saveMedicine = async () => {
    if (!currentMedicine.name) {
      toast.error('Name is required');
      return;
    }

    try {
      if (isEditMode) {
        const updatedMedicine = await updateMedicine(currentMedicine.id, currentMedicine);
        setMedicines((prev) =>
          prev.map((med) =>
            med.id === currentMedicine.id ? updatedMedicine : med
          )
        );
        toast.success('Medicine updated successfully');
      } else {
        const newMedicine = await addMedicine(currentMedicine);
        setMedicines((prev) => [
          { ...currentMedicine, id: newMedicine.id, UpdatedAt: new Date() },
          ...prev,
        ]);
        toast.success('Medicine added successfully');
      }
      setIsModalOpen(false);
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Delete medicine (soft delete)
  const handleDeleteMedicine = async (id) => {
    if (!window.confirm('Are you sure you want to delete this medicine?')) return;

    try {
      await deleteMedicine(id);
      setMedicines((prev) => prev.filter((med) => med.id !== id));
      toast.success('Medicine deleted successfully');
    } catch (error) {
      toast.error(error.message);
    }
  };

  // DataTable columns
  const columns = [
    {
      name: 'Name',
      selector: (row) => (
        <div>
          <div>{row.name || 'N/A'}</div>
          <div className="text-sm text-gray-600">
            {row.manufacturer_name || 'N/A'} | {row.pack_size_label || 'N/A'}
          </div>
        </div>
      ),
      sortable: true,
      wrap: true,
      width: '300px',
    },
    { name: 'Batch', selector: (row) => row.Batch || 'N/A', sortable: true },
    { 
      name: 'Price', 
      selector: (row) => `₹${Number(row.price || 0).toFixed(2)}`, 
      sortable: true 
    },
    { name: 'Expiry', selector: (row) => row.Expiry || 'N/A', sortable: true },
    {
      name: 'Qty(Full)',
      selector: (row) => row.Quantity !== undefined && row.Quantity !== null ? row.Quantity : 0,
      sortable: true,
      width: '120px',
    },
    {
      name: 'Qty(Loose)',
      selector: (row) => row.QtyInLoose !== undefined && row.QtyInLoose !== null ? row.QtyInLoose : 0,
      sortable: true,
      width: '120px',
    },
    {
      name: 'Discontinued',
      selector: (row) => (row.Is_discontinued ? 'Yes' : 'No'),
      sortable: true,
    },
    { name: 'Type', selector: (row) => row.type || 'N/A', sortable: true },
    {
      name: 'Composition',
      selector: (row) =>
        `${row.short_composition1 || 'N/A'} + ${row.short_composition2 || 'N/A'}`,
      sortable: true,
      wrap: true,
    },
    {
      name: 'Action',
      cell: (row) => (
        <div className="flex space-x-2">
          <button
            onClick={() => openEditModal(row)}
            className="text-blue-600 hover:text-blue-800"
            title="Edit"
          >
            ✏️
          </button>
          <button
            onClick={() => handleDeleteMedicine(row.id)}
            className="text-red-600 hover:text-red-800"
            title="Delete"
          >
            <FaTrash />
          </button>
        </div>
      ),
      sortable: false,
    },
  ];

  // Custom styles for DataTable
  const customStyles = {
    headCells: {
      style: {
        backgroundColor: '#000080',
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: '14px',
        padding: '12px',
      },
    },
    cells: {
      style: {
        fontSize: '13px',
        padding: '12px',
      },
    },
    table: {
      style: {
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      },
    },
  };

  return (
    <div className="min-h-screen bg-gray-100 relative">
      {/* Main Content */}
      <main className="container mx-auto px-4 py-2">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          {/* Header, Dropdown, Add Button, and Search Section */}
          <div className="flex items-center justify-between mb-6">
            {/* Header with Icon */}
            <div className="flex items-center">
              <FaPills className="w-8 h-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-800">Inventory</h1>
            </div>

            {/* Dropdown, Add Button, and Search Bar */}
            <div className="flex items-center space-x-3">
              {/* View Mode Dropdown */}
              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value)}
                className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="My">My (In Stock)</option>
                <option value="Master">Master (All)</option>
              </select>

              <button
                onClick={openAddModal}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
              >
                <span className="mr-2">+</span>
                Add Medicine
              </button>

              {/* Search Bar */}
              <div className="relative" ref={searchRef}>
                {isSearchExpanded ? (
                  <input
                    type="text"
                    placeholder="Search by Name, Batch, Manufacturer, Type, Pack Size, Composition..."
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    className="w-64 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                    autoFocus
                  />
                ) : (
                  <button
                    onClick={() => setIsSearchExpanded(true)}
                    className="w-10 h-10 flex items-center justify-center border rounded-lg bg-gray-200 hover:bg-gray-300 transition-all duration-300"
                  >
                    <FaSearch className="text-gray-600" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* DataTable */}
          <DataTable
            columns={columns}
            data={filteredMedicines}
            progressPending={loading}
            pagination
            paginationPerPage={10}
            paginationRowsPerPageOptions={[10, 25, 50]}
            customStyles={customStyles}
            highlightOnHover
            pointerOnHover
            noDataComponent={
              <div className="text-center py-4">No medicines found</div>
            }
            progressComponent={
              <div className="flex justify-center py-4">
                <span className="text-blue-600 animate-pulse">Loading...</span>
              </div>
            }
          />
        </div>
      </main>

      {/* Loader Overlay for Master View */}
      {loading && viewMode === 'Master' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="flex flex-col items-center">
            <span className="text-white text-lg animate-pulse">Loading Master Data...</span>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.6)] flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-3xl transform transition-all duration-300">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 bg-blue-900 text-white rounded-lg p-4">
              {isEditMode ? 'Edit Medicine' : 'Add Medicine'}
            </h2>
            <form>
              {/* Row 1: Name, Manufacturer, Pack Size */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={currentMedicine.name}
                    onChange={handleInputChange}
                    className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Manufacturer</label>
                  <input
                    type="text"
                    name="manufacturer_name"
                    value={currentMedicine.manufacturer_name}
                    onChange={handleInputChange}
                    className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Pack Size</label>
                  <input
                    type="text"
                    name="pack_size_label"
                    value={currentMedicine.pack_size_label}
                    onChange={handleInputChange}
                    className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>
              </div>

              {/* Row 2: Batch, Price, Expiry */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Batch</label>
                  <input
                    type="text"
                    name="Batch"
                    value={currentMedicine.Batch}
                    onChange={handleInputChange}
                    className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Price</label>
                  <input
                    type="number"
                    name="price"
                    value={currentMedicine.price}
                    onChange={handleInputChange}
                    className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Expiry</label>
                  <input
                    type="text"
                    name="Expiry"
                    value={currentMedicine.Expiry}
                    onChange={handleInputChange}
                    className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>
              </div>

              {/* Row 3: Quantity, Loose Qty, Discontinued */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Quantity (Full)</label>
                  <input
                    type="number"
                    name="Quantity"
                    value={currentMedicine.Quantity}
                    onChange={handleInputChange}
                    className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Quantity (Loose)</label>
                  <input
                    type="number"
                    name="QtyInLoose"
                    value={currentMedicine.QtyInLoose}
                    onChange={handleInputChange}
                    className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>
                <div className="flex items-center space-x-2 mt-6">
                  <label className="text-sm font-medium text-gray-700">Discontinued</label>
                  <input
                    type="checkbox"
                    name="Is_discontinued"
                    checked={currentMedicine.Is_discontinued}
                    onChange={handleInputChange}
                    className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Row 4: Type, Composition 1, Composition 2 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <input
                    type="text"
                    name="type"
                    value={currentMedicine.type}
                    onChange={handleInputChange}
                    className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Composition 1</label>
                  <input
                    type="text"
                    name="short_composition1"
                    value={currentMedicine.short_composition1}
                    onChange={handleInputChange}
                    className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Composition 2</label>
                  <input
                    type="text"
                    name="short_composition2"
                    value={currentMedicine.short_composition2}
                    onChange={handleInputChange}
                    className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveMedicine}
                  className="px-5 py-2 bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-lg hover:from-blue-600 hover:to-blue-800 transition"
                >
                  {isEditMode ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
};

export default Inventory;