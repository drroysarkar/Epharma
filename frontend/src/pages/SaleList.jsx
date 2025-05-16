import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from 'react-data-table-component';
import { FaTimes, FaEdit, FaSearch, FaTrash, FaEye, FaEyeSlash } from 'react-icons/fa';
import { fetchAllSales, fetchSaleById, deleteSale } from '../services/saleService'; // Import API service functions

const SaleList = () => {
    const [sales, setSales] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [selectedSale, setSelectedSale] = useState(null);
    const [saleItems, setSaleItems] = useState([]);
    const navigate = useNavigate();
    const searchRef = useRef(null);

    useEffect(() => {
        const loadSales = async () => {
            try {
                const data = await fetchAllSales();
                setSales(data);
            } catch (error) {
                console.error('Error fetching sales:', error);
                alert('Failed to load sales. Please try again.');
            }
        };

        loadSales();
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

    const handleNewSale = () => {
        navigate('/sale/new');
    };

    const handleSaleReturn = () => {
        navigate('/sale/return');
    };

    const handleDeleteSale = async (saleId) => {
        if (!window.confirm('Are you sure you want to delete this sale?')) {
            return;
        }

        try {
            await deleteSale(saleId);
            // Refetch sales to update the table
            const data = await fetchAllSales();
            setSales(data);
            alert('Sale deleted successfully');
        } catch (error) {
            console.error('Error deleting sale:', error);
            alert('Failed to delete sale. Please try again.');
        }
    };

    const handleRowClick = async (sale) => {
        try {
            const data = await fetchSaleById(sale.SaleID);
            if (!data.saleDetails) {
                console.error('No saleDetails in response for SaleID:', sale.SaleID);
                alert('Sale details not found');
                setSelectedSale(null);
                setSaleItems([]);
                return;
            }

            const items = data.saleItems || [];
            setSelectedSale(data.saleDetails);
            setSaleItems(items);

            if (items.length === 0) {
                console.warn(`No items found for SaleID: ${sale.SaleID}`);
                alert('No sale items found for this sale');
            }
        } catch (error) {
            console.error('Error fetching sale data for SaleID:', sale.SaleID, error);
            alert('Something went wrong while fetching sale data');
            setSelectedSale(null);
            setSaleItems([]);
        }
    };

    const closeModal = () => {
        setSelectedSale(null);
        setSaleItems([]);
    };

    const filteredSales = useMemo(() => {
        return sales.filter((sale) =>
            Object.values(sale).some((value) =>
                value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
            )
        );
    }, [sales, searchTerm]);

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
            width: '150px',
        },
        {
            name: 'Bill Date',
            selector: (row) => new Date(row.BillDate).toLocaleDateString(),
            sortable: true,
            width: '150px',
        },
        {
            name: 'Entry By',
            selector: (row) => row.CreatedBy,
            sortable: true,
            width: '150px',
        },
        {
            name: 'Customer',
            selector: (row) => row.CustomerName,
            sortable: true,
            width: '200px',
        },
        {
            name: 'Bill Amount',
            selector: (row) => (
                <span className="flex items-center justify-start">
                    {`₹${row.TotalAmount.toFixed(2)}`}
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
            sortFunction: (rowA, rowB) => rowA.TotalAmount - rowB.TotalAmount,
            width: '260px',
        },
        {
            name: 'Bill PDF',
            selector: (row) => (
                <div className="flex justify-center">
                    {row.BillPath ? (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                window.open(`http://localhost:5010/${row.BillPath}`, '_blank');
                            }}
                            className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
                            title="View PDF"
                        >
                            <FaEye size={20} />
                        </button>
                    ) : (
                        <span className="text-gray-400" title="No PDF Available">
                            <FaEyeSlash size={20} />
                        </span>
                    )}
                </div>
            ),
            width: '100px',
        },
        {
            name: 'Action',
            selector: (row) => (
                <div className="flex justify-center gap-4">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/sale-next-step/${row.SaleID}`);
                        }}
                        className="text-blue-500 hover:text-blue-800 transition-colors duration-200"
                        title="Edit Sale"
                    >
                        <FaEdit size={20} />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSale(row.SaleID);
                        }}
                        className="text-red-500 hover:text-red-800 transition-colors duration-200"
                        title="Delete Sale"
                    >
                        <FaTrash size={20} />
                    </button>
                </div>
            ),
            width: '140px',
        },
    ];

    const itemColumns = [
        { name: 'Item Name', selector: (row) => row.ItemName, sortable: true, width: '200px' },
        { name: 'Batch', selector: (row) => row.Batch, sortable: true, width: '120px' },
        { name: 'Expiry', selector: (row) => row.Expiry, sortable: true, width: '100px' },
        { name: 'MRP', selector: (row) => `₹${row.MRP.toFixed(2)}`, sortable: true, width: '100px' },
        { name: 'Qty', selector: (row) => row.Quantity, sortable: true, width: '100px' },
        { name: 'Dis(%)', selector: (row) => row.Discount.toFixed(2), sortable: true, width: '120px' },
        { name: 'GST(%)', selector: (row) => row.GST.toFixed(2), sortable: true, width: '100px' },
        { name: 'Amount', selector: (row) => `₹${row.NetAmount.toFixed(2)}`, sortable: true, width: '120px' },
        { name: 'Loose', selector: (row) => (row.Is_Loose ? 'Yes' : 'No'), sortable: true, width: '100px' },
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
                        <h1 className="text-3xl font-semibold text-gray-800">Sales</h1>

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
                                            placeholder="Search by Customer, Bill No., Entry"
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
                                onClick={handleNewSale}
                                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition duration-200 shadow-sm"
                            >
                                + New Sale
                            </button>
                            <button
                                onClick={handleSaleReturn}
                                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition duration-200 shadow-sm"
                            >
                                Sale Return
                            </button>
                        </div>
                    </div>
                </div>

                <DataTable
                    columns={columns}
                    data={filteredSales}
                    customStyles={customStyles}
                    pagination
                    highlightOnHover
                    pointerOnHover
                    onRowClicked={handleRowClick}
                    responsive
                    noDataComponent={
                        <div className="p-4 text-gray-500">No sales found.</div>
                    }
                />

                {selectedSale && (
                    <div
                        className="fixed inset-0 flex items-center justify-center z-50 transition-opacity duration-300"
                        style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
                    >
                        <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto shadow-xl relative">
                            <div className="flex justify-between items-center mb-4 border-b pb-2 border-gray-200">
                                <h2 className="text-xl font-semibold text-gray-800">
                                    Sale Details - <span className="text-blue-600">#{selectedSale.BillNumber}</span>
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
                                    <span className="block font-medium text-gray-500">Customer:</span>
                                    <p className="text-lg font-semibold text-gray-800">{selectedSale.CustomerName}</p>
                                </div>
                                <div>
                                    <span className="block font-medium text-gray-500">Bill Date:</span>
                                    <p className="text-lg font-semibold text-gray-800">
                                        {new Date(selectedSale.BillDate).toLocaleDateString()}
                                    </p>
                                </div>
                                <div>
                                    <span className="block font-medium text-gray-500">Status:</span>
                                    <p className={`text-lg font-semibold ${selectedSale.Status === 'Paid' ? 'text-green-500' : 'text-red-500'}`}>
                                        {selectedSale.Status} ({selectedSale.PaymentType})
                                    </p>
                                </div>
                            </div>

                            <div className="mb-4">
                                <DataTable
                                    columns={itemColumns}
                                    data={saleItems}
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
                                            No items found for this sale.
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

export default SaleList;