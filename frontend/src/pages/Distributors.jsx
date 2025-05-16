import React, { useState, useEffect, useRef } from 'react';
import DataTable from 'react-data-table-component';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaMoneyCheckAlt, FaSearch, FaTrash } from 'react-icons/fa';
import { fetchDistributors, addDistributor, updateDistributor, deleteDistributor } from '../services/distributorService';

const Distributors = () => {
  const [distributors, setDistributors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterText, setFilterText] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const searchRef = useRef(null);
  const [currentDistributor, setCurrentDistributor] = useState({
    DistributorID: null,
    Name: '',
    ContactNumber: '',
    Email: '',
    Address: '',
  });

  // Fetch distributors
  useEffect(() => {
    const getDistributors = async () => {
      try {
        const distributorsData = await fetchDistributors();
        setDistributors(Array.isArray(distributorsData) ? distributorsData : []);
        setLoading(false);
      } catch (error) {
        toast.error(error.message);
        setDistributors([]);
        setLoading(false);
      }
    };
    getDistributors();
  }, []);

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

  // Filter distributors
  const filteredDistributors = Array.isArray(distributors)
    ? distributors.filter((distributor) =>
        distributor.Name?.toLowerCase().includes(filterText.toLowerCase())
      )
    : [];

  // Open modal for adding
  const openAddModal = () => {
    setIsEditMode(false);
    setCurrentDistributor({
      DistributorID: null,
      Name: '',
      ContactNumber: '',
      Email: '',
      Address: '',
    });
    setIsModalOpen(true);
  };

  // Open modal for editing
  const openEditModal = (distributor) => {
    setIsEditMode(true);
    setCurrentDistributor(distributor);
    setIsModalOpen(true);
  };

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentDistributor((prev) => ({ ...prev, [name]: value }));
  };

  // Save or update distributor
  const saveDistributor = async () => {
    if (!currentDistributor.Name) {
      toast.error('Name is required');
      return;
    }

    try {
      if (isEditMode) {
        const updatedDistributor = await updateDistributor(currentDistributor.DistributorID, currentDistributor);
        setDistributors((prev) =>
          prev.map((dist) =>
            dist.DistributorID === currentDistributor.DistributorID ? updatedDistributor : dist
          )
        );
        toast.success('Distributor updated successfully');
      } else {
        const newDistributor = await addDistributor(currentDistributor);
        setDistributors((prev) => [
          { ...currentDistributor, DistributorID: newDistributor.distributorID, CreatedAt: new Date() },
          ...prev,
        ]);
        toast.success('Distributor added successfully');
      }
      setIsModalOpen(false);
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Delete distributor
  const handleDeleteDistributor = async (id) => {
    if (!window.confirm('Are you sure you want to delete this distributor?')) return;

    try {
      await deleteDistributor(id);
      setDistributors((prev) => prev.filter((dist) => dist.DistributorID !== id));
      toast.success('Distributor deleted successfully');
    } catch (error) {
      toast.error(error.message);
    }
  };

  // DataTable columns
  const columns = [
    {
      name: 'Name',
      selector: (row) => row.Name || 'N/A',
      sortable: true,
      wrap: true,
    },
    {
      name: 'Contact Number',
      selector: (row) => row.ContactNumber || 'N/A',
      sortable: true,
    },
    {
      name: 'Email',
      selector: (row) => row.Email || 'N/A',
      sortable: true,
    },
    {
      name: 'Address',
      selector: (row) => row.Address || 'N/A',
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
            onClick={() => handleDeleteDistributor(row.DistributorID)}
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
    <div className="min-h-screen bg-gray-100">
      {/* Main Content */}
      <main className="container mx-auto px-4 py-2">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          {/* Header, Add Button, and Search Section */}
          <div className="flex items-center justify-between mb-6">
            {/* Header with Icon */}
            <div className="flex items-center">
              <FaMoneyCheckAlt className="w-8 h-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-800">Distributors</h1>
            </div>

            {/* Add Button and Search Bar */}
            <div className="flex items-center space-x-3">
              <button
                onClick={openAddModal}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
              >
                <span className="mr-2">+</span>
                Add Distributor
              </button>

              {/* Search Bar */}
              <div className="relative" ref={searchRef}>
                {isSearchExpanded ? (
                  <input
                    type="text"
                    placeholder="Search by Name..."
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
            data={filteredDistributors}
            progressPending={loading}
            pagination
            paginationPerPage={10}
            paginationRowsPerPageOptions={[10, 25, 50]}
            customStyles={customStyles}
            highlightOnHover
            pointerOnHover
            noDataComponent={
              <div className="text-center py-4">No distributors found</div>
            }
            progressComponent={
              <div className="flex justify-center py-4">
                <span className="text-blue-600 animate-pulse">Loading...</span>
              </div>
            }
          />
        </div>
      </main>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.6)] flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-lg transform transition-all duration-300">
            <h2 className="text-2xl font-semibold mb-6 bg-blue-900 text-white p-4 rounded-lg shadow-md">
              {isEditMode ? 'Edit Distributor' : 'Add Distributor'}
            </h2>

            <form>
              {/* Name */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  name="Name"
                  value={currentDistributor.Name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  required
                />
              </div>

              {/* Contact Number */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                <input
                  type="text"
                  name="ContactNumber"
                  value={currentDistributor.ContactNumber}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>

              {/* Email */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  name="Email"
                  value={currentDistributor.Email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>

              {/* Address */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  name="Address"
                  value={currentDistributor.Address}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  rows="4"
                ></textarea>
              </div>

              {/* Action Buttons */}
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
                  onClick={saveDistributor}
                  className="px-5 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition"
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

export default Distributors;