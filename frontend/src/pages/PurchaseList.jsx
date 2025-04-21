import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from 'react-data-table-component';

const PurchaseList = () => {
  const [purchases, setPurchases] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPurchases = async () => {
      try {
        const response = await fetch('http://localhost:5010/api/purchases');
        if (response.ok) {
          const data = await response.json();
          setPurchases(data);
        } else {
          alert('Failed to load purchases');
        }
      } catch (error) {
        console.error('Error fetching purchases:', error);
        alert('Something went wrong while fetching purchases');
      }
    };

    fetchPurchases();
  }, []);

  const handleNewPurchase = () => {
    navigate('/purchase/new');
  };

  const handlePurchaseReturn = () => {
    navigate('/purchase/return');
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
      width: '80px',
    },
    {
      name: 'Bill No.',
      selector: (row) => row.BillNumber,
      sortable: true,
      width: '160px',
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
      width: '120px',
    },
    {
      name: 'Distributor',
      selector: (row) => row.DistributorName,
      sortable: true,
      width: '160px',
    },
    {
      name: 'Bill Amount',
      selector: (row) => (
        <span className="flex items-center justify-start">
          {`₹${row.PendingAmount.toFixed(2)}`}
          <span
            className={
              row.PaymentStatus === 'Due' ? 'text-red-500 ml-1' : 'text-green-500 ml-1'
            }
          >
            {`(${row.PaymentStatus}) (${row.PaymentType})`}
          </span>
        </span>
      ),
      sortable: true,
      sortFunction: (rowA, rowB) => rowA.PendingAmount - rowB.PendingAmount,
      width: '200px',
    },
  ];

  const customStyles = {
    headCells: {
      style: {
        backgroundColor: '#2563eb',
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

  const handleRowClick = (row) => {
    if (window.confirm('Do you want to edit this purchase?')) {
      navigate(`/purchase-next-step/${row.PurchaseID}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="border border-gray-300 rounded-lg p-4 bg-white">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Purchases</h1>
          <button
            onClick={handleNewPurchase}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-md"
          >
            + New
          </button>
        </div>
        <div className="flex justify-between items-center mb-4">
          <div className="w-1/3">
            <input
              type="text"
              placeholder="Search purchase by Distributor,BillNo.,Entry "
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handlePurchaseReturn}
            className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200 shadow-md"
          >
            Purchase Return
          </button>
        </div>
        <DataTable
          columns={columns}
          data={filteredPurchases}
          customStyles={customStyles}
          pagination
          highlightOnHover
          pointerOnHover
          responsive
          noDataComponent={
            <div className="p-4 text-gray-500">No purchases found.</div>
          }
          onRowClicked={handleRowClick} // Add row click handler
        />
      </div>
    </div>
  );
};

export default PurchaseList;