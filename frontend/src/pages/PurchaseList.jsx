import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from 'react-data-table-component';
import { FaTimes, FaEdit, FaSearch, FaTrash } from 'react-icons/fa';
import { fetchPurchases, fetchPurchaseById, deletePurchase } from '../services/purchaseService'; // Import API service functions

const PurchaseList = () => {
  const [purchases, setPurchases] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [purchaseItems, setPurchaseItems] = useState([]);
  const navigate = useNavigate();
  const searchRef = useRef(null);

  useEffect(() => {
    const loadPurchases = async () => {
      try {
        const data = await fetchPurchases();
        setPurchases(data);
      } catch (error) {
        alert('Something went wrong while fetching purchases');
      }
    };

    loadPurchases();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNewPurchase = () => {
    navigate('/purchase/new');
  };

  const handlePurchaseReturn = () => {
    navigate('/purchase/return');
  };

  const handleDeletePurchase = async (purchaseId) => {
    if (!window.confirm('Are you sure you want to delete this purchase?')) {
      return;
    }

    try {
      await deletePurchase(purchaseId);
      const data = await fetchPurchases();
      setPurchases(data);
      alert('Purchase deleted successfully');
    } catch (error) {
      alert('Something went wrong while deleting purchase');
    }
  };

  const handleRowClick = async (purchase) => {
    console.log('Fetching purchase for PurchaseID:', purchase.PurchaseID);
    try {
      const data = await fetchPurchaseById(purchase.PurchaseID);
      console.log('API Response:', JSON.stringify(data, null, 2));

      if (!data.purchaseDetails) {
        console.error('No purchaseDetails in response for PurchaseID:', purchase.PurchaseID);
        alert('Purchase details not found');
        setSelectedPurchase(null);
        setPurchaseItems([]);
        return;
      }

      const items = data.purchaseItems || [];
      console.log('PurchaseItems before filter:', items);

      // Handle IsDeleted as number (0/1) or boolean (false/true)
      const activeItems = items.filter(item => {
        const isDeleted = item.IsDeleted;
        console.log(`Item ID: ${item.ItemID}, IsDeleted: ${isDeleted} (type: ${typeof isDeleted})`);
        return isDeleted === 0 || isDeleted === false;
      });

      console.log('Active PurchaseItems:', activeItems);

      setSelectedPurchase(data.purchaseDetails);
      setPurchaseItems(activeItems);

      if (activeItems.length === 0) {
        console.warn(`No active items found for PurchaseID: ${purchase.PurchaseID}. Total items: ${items.length}`);
        alert('No active purchase items found for this purchase');
      }
    } catch (error) {
      if (error.response?.status === 404) {
        console.error('Purchase not found for PurchaseID:', purchase.PurchaseID);
        alert('Purchase not found');
      } else {
        console.error('Error fetching purchase data for PurchaseID:', purchase.PurchaseID, error);
        alert('Something went wrong while fetching purchase data');
      }
      setSelectedPurchase(null);
      setPurchaseItems([]);
    }
  };

  const closeModal = () => {
    setSelectedPurchase(null);
    setPurchaseItems([]);
  };

  const filteredPurchases = useMemo(() => {
    return purchases.filter((purchase) =>
      Object.values(purchase).some((value) =>
        value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [purchases, searchTerm]);

  const columns = [
    {
      name: 'Sr No.',
      selector: (row, index) => index + 1,
      width: '100px',
    },
    {
      name: 'Bill No.',
      selector: (row) => row.BillNumber,
      sortable: true,
      width: '180px',
    },
    {
      name: 'Entry Date',
      selector: (row) => new Date(row.CreatedAt).toLocaleDateString(),
      sortable: true,
      width: '140px',
    },
    {
      name: 'Bill Date',
      selector: (row) => new Date(row.BillDate).toLocaleDateString(),
      sortable: true,
      width: '140px',
    },
    {
      name: 'Entry By',
      selector: (row) => row.CreatedBy,
      sortable: true,
      width: '180px',
    },
    {
      name: 'Distributor',
      selector: (row) => row.DistributorName,
      sortable: true,
      width: '220px',
    },
    {
      name: 'Bill Amount',
      selector: (row) => (
        <span className="flex items-center justify-start">
          {`₹${row.PaidAmount.toFixed(2)}`}
          <span
            className={
              row.Status === 'Due' ? 'text-red-500 ml-1' : 'text-green-500 ml-1'
            }
          >
            {`(${row.Status}) (${row.PaymentType})`}
          </span>
        </span>
      ),
      sortable: true,
      sortFunction: (rowA, rowB) => rowA.PaidAmount - rowB.PaidAmount,
      width: '320px',
    },
    {
      name: 'Action',
      selector: (row) => (
        <div className="flex justify-center gap-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/purchase-next-step/${row.PurchaseID}`);
            }}
            className="text-blue-500 hover:text-blue-800 transition-colors duration-200"
            title="Edit Purchase"
          >
            <FaEdit size={20} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeletePurchase(row.PurchaseID);
            }}
            className="text-red-500 hover:text-red-800 transition-colors duration-200"
            title="Delete Purchase"
          >
            <FaTrash size={20} />
          </button>
        </div>
      ),
      width: '150px',
    },
  ];

  const itemColumns = [
    { name: 'Item Name', selector: (row) => row.ItemName, sortable: true, width: '200px' },
    { name: 'Pack', selector: (row) => row.Pack, sortable: true, width: '100px' },
    { name: 'Batch', selector: (row) => row.Batch, sortable: true, width: '120px' },
    { name: 'Expiry', selector: (row) => row.Expiry, sortable: true, width: '100px' },
    { name: 'MRP', selector: (row) => `₹${row.MRP.toFixed(2)}`, sortable: true, width: '100px' },
    { name: 'PTR', selector: (row) => `₹${row.PTR.toFixed(2)}`, sortable: true, width: '100px' },
    { name: 'Qty', selector: (row) => row.Quantity, sortable: true, width: '100px' },
    { name: 'Free', selector: (row) => row.Free, sortable: true, width: '80px' },
    { name: 'Sch.Amt', selector: (row) => `₹${row.SchAmt.toFixed(2)}`, sortable: true, width: '120px' },
    { name: 'Disc(%)', selector: (row) => row.Discount, sortable: true, width: '120px' },
    { name: 'Base', selector: (row) => `₹${row.Base.toFixed(2)}`, sortable: true, width: '100px' },
    { name: 'GST(%)', selector: (row) => row.GST, sortable: true, width: '100px' },
    { name: 'NetAmount', selector: (row) => `₹${row.NetAmount.toFixed(2)}`, sortable: true, width: '140px' },
  ];

  const customStyles = {
    headCells: {
      style: {
        backgroundColor: '#000080',
        color: '#ffffff',
        fontSize: '16px',
        fontWeight: 'bold',
        padding: '12px',
      },
    },
    cells: {
      style: {
        padding: '16px',
        fontSize: '15px',
        borderBottom: '1px solid #e5e7eb',
      },
    },
    rows: {
      style: {
        '&:hover': {
          backgroundColor: '#f1f5f9',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          transform: 'translateY(-2px)',
          transition: 'all 0.2s ease-in-out',
          cursor: 'pointer',
        },
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
    <div className="min-h-screen bg-gray-100 p-4 md:p-6">
      <div className="border border-gray-300 rounded-lg p-4 bg-white w-full">
        <div>
          {/* Header and Actions Row */}
          <div className="flex justify-between items-center mb-6">
            {/* Heading on the left */}
            <h1 className="text-3xl font-semibold text-gray-800">Purchases</h1>

            {/* Search and Buttons on the right */}
            <div className="flex items-center gap-3">
              {/* Search Icon and Search Bar */}
              <div className="relative" ref={searchRef}>
                {!isSearchOpen ? (
                  <button
                    onClick={() => setIsSearchOpen(true)}
                    className="p-2 border border-gray-300 rounded-lg shadow-sm flex items-center justify-center text-gray-600 hover:text-blue-600 transition-colors duration-200"
                    title="Search"
                  >
                    <FaSearch size={20} />
                  </button>
                ) : (
                  <div className="w-64 flex items-center px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus-within:ring-2 focus-within:ring-blue-500">
                    <FaSearch size={18} className="text-gray-500 mr-2" />
                    <input
                      type="text"
                      placeholder="Search by Distributor, Bill No., Entry"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="flex-1 bg-transparent focus:outline-none text-sm"
                      autoFocus
                    />
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <button
                onClick={handleNewPurchase}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition duration-200 shadow-sm"
              >
                + New Purchase
              </button>
              <button
                onClick={handlePurchaseReturn}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition duration-200 shadow-sm"
              >
                Purchase Return
              </button>
            </div>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredPurchases}
          customStyles={customStyles}
          pagination
          highlightOnHover
          pointerOnHover
          onRowClicked={handleRowClick}
          noDataComponent={
            <div className="p-4 text-gray-500">No purchases found.</div>
          }
        />

        {selectedPurchase && (
          <div
            className="fixed inset-0 flex items-center justify-center z-50 transition-opacity duration-300"
            style={{ backgroundColor: `rgba(0, 0, 0, 0.6)` }}
          >
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto shadow-xl relative">
              <div className="flex justify-between items-center mb-4 border-b pb-2 border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800">
                  Purchase Details - <span className="text-blue-600">#{selectedPurchase.BillNumber}</span>
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-500 hover:text-red-500 transition duration-200"
                >
                  <FaTimes size={20} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-gray-600">
                <div>
                  <span className="block font-medium text-gray-500">Distributor:</span>
                  <p className="text-lg font-semibold text-gray-800">{selectedPurchase.DistributorName}</p>
                </div>
                <div>
                  <span className="block font-medium text-gray-500">Bill Date:</span>
                  <p className="text-lg font-semibold text-gray-800">
                    {new Date(selectedPurchase.BillDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <span className="block font-medium text-gray-500">Status:</span>
                  <p className={`text-lg font-semibold ${selectedPurchase.Status === "Paid" ? "text-green-500" : "text-red-500"}`}>
                    {selectedPurchase.Status} ({selectedPurchase.PaymentType})
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <DataTable
                  columns={itemColumns}
                  data={purchaseItems}
                  customStyles={{
                    ...customStyles,
                    table: {
                      style: {
                        ...customStyles.table.style,
                        boxShadow: 'none',
                      },
                    },
                  }}
                  pagination
                  highlightOnHover
                  noDataComponent={
                    <div className="p-4 text-center text-gray-500">
                      No items found for this purchase.
                    </div>
                  }
                />
              </div>

              <div className="flex justify-end mt-4">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-md transition duration-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PurchaseList;