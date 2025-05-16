import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaSearch, FaBook, FaPen, FaCheck } from 'react-icons/fa';

const OrderAssistant = () => {
  const [selectedOption, setSelectedOption] = useState('Sell');
  const [searchQuery, setSearchQuery] = useState('');
  const [hideShortbook, setHideShortbook] = useState(false);
  const [showOnlySuggested, setShowOnlySuggested] = useState(true);
  const [sellQtyFilter, setSellQtyFilter] = useState('5 Days');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const endpoint = selectedOption === 'Sell' ? '/api/oa/sale-items' : '/api/oa/purchase-items';
        const response = await fetch(`http://localhost:5010${endpoint}?filter=${sellQtyFilter}`);
        if (!response.ok) throw new Error('Failed to fetch data');
        const data = await response.json();
        setItems(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedOption, sellQtyFilter]);

  const handleAddToShortbook = async (itemId) => {
    try {
      const response = await fetch('http://localhost:5010/api/oa/add-to-shortbook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, type: selectedOption }),
      });
      if (response.ok) {
        setItems(items.map(item =>
          item.ItemID === itemId ? { ...item, IsInShortbook: true } : item
        ));
      }
    } catch (err) {
      console.error('Error adding to Shortbook:', err);
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.ItemName.toLowerCase().includes(searchQuery.toLowerCase());
    if (hideShortbook && item.IsInShortbook) return false;
    if (showOnlySuggested && !item.IsSuggested) return false;
    return matchesSearch;
  });

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-6">
        <div>
          <h1 className="text-3xl font-bold text-blue-700">🛒 Order Assistant</h1>
          <p className="text-sm text-gray-600 mt-1">Smart assist for purchase & sale optimization</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="relative">
            <FaSearch className="absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Item name or Manufacturer"
              className="pl-10 pr-4 py-2 border rounded-lg shadow-sm text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select
            className="px-3 py-2 border rounded-lg text-sm shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedOption}
            onChange={(e) => setSelectedOption(e.target.value)}
          >
            <option value="Sell">Sell</option>
            <option value="Purchase">Purchase</option>
          </select>

          <Link
            to="/purchase/shortbook"
            className="text-blue-600 hover:text-blue-800 text-sm font-medium underline underline-offset-2"
          >
            Go to Shortbook
          </Link>
        </div>
      </header>

      <div className="flex justify-end items-center mb-4 gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={hideShortbook}
            onChange={() => setHideShortbook(!hideShortbook)}
            className="accent-blue-600"
          />
          Hide Shortbook
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showOnlySuggested}
            onChange={() => setShowOnlySuggested(!showOnlySuggested)}
            className="accent-blue-600"
          />
          Only Suggested
        </label>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700">Sales Period:</span>
          <select
            className="border border-gray-300 rounded-md px-2 py-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={sellQtyFilter}
            onChange={(e) => setSellQtyFilter(e.target.value)}
          >
            <option>Today</option>
            <option>Yesterday</option>
            <option>Last 3 Days</option>
            <option>5 Days</option>
          </select>
        </div>
      </div>

      {loading && <p className="text-center text-gray-500">Fetching items...</p>}
      {error && <p className="text-center text-red-500">{error}</p>}

      <div className="bg-white shadow-lg rounded-xl overflow-hidden">
        <table className="min-w-full text-sm text-gray-800">
          <thead className="bg-blue-900 text-white">
            <tr className="text-left">
              <th className="px-4 py-3 font-semibold">Item</th>
              <th className="px-4 py-3 font-semibold">Stock</th>
              <th className="px-4 py-3 font-semibold">Sell Qty</th>
              <th className="px-4 py-3 font-semibold">Add to Shortbook</th>
              <th className="px-4 py-3 font-semibold">Min Qty</th>
              <th className="px-4 py-3 font-semibold">Max Qty</th>
              <th className="px-4 py-3 font-semibold text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map(item => (
              <tr
                key={item.ItemID}
                className="hover:bg-blue-50 transition duration-150 border-t"
              >
                <td className="px-4 py-3">
                  <div className="font-medium">{item.ItemName}</div>
                  <div className="text-xs text-gray-500">{item.manufacturer_name || 'N/A'} • {item.Pack}</div>
                </td>
                <td className="px-4 py-3">{item.Stock}</td>
                <td className="px-4 py-3">{item.SellQty || 0}</td>
                <td className="px-4 py-3">
                  <div className="relative inline-block">
                    {item.IsSuggested ? (
                      <FaCheck className="text-green-500 h-5 w-5" />
                    ) : (
                      <button
                        onClick={() => handleAddToShortbook(item.ItemID)}
                        disabled={item.IsInShortbook}
                        className={`p-1 rounded-full border transition relative ${
                          item.IsInShortbook ? 'text-gray-400 cursor-not-allowed bg-gray-100' : 'text-blue-600 hover:bg-blue-300'
                        }`}
                      >
                        <FaBook className="h-5 w-5" />
                        {item.IsInShortbook && (
                          <div className="absolute -top-1 -right-1 h-5 w-5 bg-green-500 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                            <FaCheck className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </button>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">{item.MinQty ?? '-'}</td>
                <td className="px-4 py-3">{item.MaxQty ?? '-'}</td>
                <td className="px-4 py-3 text-center">
                  <button className="text-blue-600 hover:text-blue-800">
                    <FaPen className="inline-block h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
            {!filteredItems.length && !loading && (
              <tr>
                <td colSpan="7" className="text-center text-gray-400 py-6">No items found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrderAssistant;