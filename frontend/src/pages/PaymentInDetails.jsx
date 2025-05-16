import React, { useState, useEffect, useRef } from 'react';
import DataTable from 'react-data-table-component';
import { format, subMonths } from 'date-fns';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaFileInvoiceDollar, FaSearch, FaRupeeSign } from 'react-icons/fa';
import { fetchAllSales } from '../services/saleService';

const PaymentDetails = () => {
  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterText, setFilterText] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [dateFilter, setDateFilter] = useState('This Month');
  const searchRef = useRef(null);

  // Date filter options
  const dateFilterOptions = [
    'This Month',
    'Last 3 Months',
    'Last 6 Months',
    'Last 1 Year',
  ];

  // Fetch sales data
  useEffect(() => {
    const getSales = async () => {
      try {
        const salesData = await fetchAllSales();
        setSales(Array.isArray(salesData) ? salesData : []);
        setLoading(false);
      } catch (error) {
        toast.error(error.message);
        setSales([]);
        setLoading(false);
      }
    };
    getSales();
  }, []);

  // Handle date filter and text filter
  useEffect(() => {
    let filtered = Array.isArray(sales) ? [...sales] : [];

    // Apply date filter
    const now = new Date();
    let startDate;
    switch (dateFilter) {
      case 'This Month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'Last 3 Months':
        startDate = subMonths(now, 3);
        break;
      case 'Last 6 Months':
        startDate = subMonths(now, 6);
        break;
      case 'Last 1 Year':
        startDate = subMonths(now, 12);
        break;
      default:
        startDate = new Date(0); // All time
    }

    filtered = filtered.filter((sale) => {
      const saleDate = sale.BillDate ? new Date(sale.BillDate) : null;
      return saleDate && saleDate >= startDate && saleDate <= now;
    });

    // Apply text filter
    if (filterText) {
      filtered = filtered.filter(
        (sale) =>
          sale.CustomerName?.toLowerCase().includes(filterText.toLowerCase()) ||
          sale.BillNumber?.toLowerCase().includes(filterText.toLowerCase())
      );
    }

    setFilteredSales(filtered);
  }, [sales, dateFilter, filterText]);

  // Calculate total revenue
  const totalRevenue = filteredSales
    .reduce((sum, sale) => sum + parseFloat(sale.TotalAmount || 0), 0)
    .toFixed(2);

  // Handle outside click to collapse search bar
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchExpanded(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // DataTable columns
  const columns = [
    {
      name: 'Customer Name',
      selector: (row) => row.CustomerName || 'N/A',
      sortable: true,
      wrap: true,
    },
    {
      name: 'Bill Number',
      selector: (row) => row.BillNumber || 'N/A',
      sortable: true,
    },
    {
      name: 'Bill Date',
      selector: (row) => row.BillDate,
      sortable: true,
      cell: (row) =>
        row.BillDate ? format(new Date(row.BillDate), 'dd MMM yyyy') : 'N/A',
    },
    {
      name: 'Total Amount',
      selector: (row) => row.TotalAmount || 0,
      sortable: true,
      cell: (row) => `₹${parseFloat(row.TotalAmount || 0).toFixed(2)}`,
    },
    {
      name: 'Paid Amount',
      selector: (row) => row.PaidAmount || 0,
      sortable: true,
      cell: (row) => `₹${parseFloat(row.PaidAmount || 0).toFixed(2)}`,
    },
    {
      name: 'Payment Type',
      selector: (row) => row.PaymentType || 'N/A',
      sortable: true,
    },
    {
      name: 'Pay App',
      selector: (row) => row.PayAppName || 'N/A',
      sortable: true,
    },
    {
      name: 'Transaction No',
      selector: (row) => row.TsNum || 'N/A',
      sortable: true,
    },
    {
      name: 'Status',
      selector: (row) => row.Status || 'N/A',
      sortable: true,
      cell: (row) => (
        <span
          className={`px-2 py-1 rounded-full text-sm ${
            row.Status === 'Completed'
              ? 'bg-green-100 text-green-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}
        >
          {row.Status || 'N/A'}
        </span>
      ),
    },
    {
      name: 'Invoice',
      cell: (row) =>
        row.BillPath ? (
          <a
            href={`${import.meta.env.VITE_API_URL}/${row.BillPath}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            Download PDF
          </a>
        ) : (
          'N/A'
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
          {/* Header: Title, Search, Filter, and Total Revenue */}
          <div className="flex items-center mb-6">
            <div className="flex items-center space-x-3">
              <FaFileInvoiceDollar className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-800">
                Sale Payment Details
              </h1>
            </div>
            <div className="flex items-center space-x-4 ml-6" ref={searchRef}>
              {isSearchExpanded ? (
                <input
                  type="text"
                  placeholder="Search by Customer Name or Bill Number..."
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
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
              >
                {dateFilterOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 shadow-sm ml-auto">
              <FaRupeeSign className="w-5 h-5 text-blue-600 mr-2" />
              <span className="text-lg font-semibold text-gray-700">
                Total Revenue ({dateFilter}): ₹{totalRevenue}
              </span>
            </div>
          </div>

          {/* DataTable */}
          <DataTable
            columns={columns}
            data={filteredSales}
            progressPending={loading}
            pagination
            paginationPerPage={10}
            paginationRowsPerPageOptions={[10, 25, 50]}
            customStyles={customStyles}
            highlightOnHover
            pointerOnHover
            noDataComponent={
              <div className="text-center py-4">No payment records found</div>
            }
            progressComponent={
              <div className="flex justify-center py-4">
                <span className="text-blue-600 animate-pulse">Loading...</span>
              </div>
            }
          />
        </div>
      </main>

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

export default PaymentDetails;