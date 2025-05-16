import { Link, Outlet, useNavigate } from 'react-router-dom';
import {
  Home, Receipt, ShoppingCart, FileText, Settings,
  ChevronDown, ChevronRight, Menu, X, Bell, UserCircle, Search, Users, MoreHorizontal
} from 'lucide-react';
import { LogOut, User, Folder } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [openMobileSection, setOpenMobileSection] = useState(''); // State for mobile collapsible sections
  const sidebarRef = useRef(null);
  const navigate = useNavigate();

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleMobileSectionToggle = (section) => {
    setOpenMobileSection(openMobileSection === section ? '' : section);
  };

  const handleNavigation = (path) => {
    setSidebarOpen(false); // Close sidebar after navigation
    navigate(path);
  };

  const handleClickOutside = (e) => {
    if (sidebarRef.current && !sidebarRef.current.contains(e.target)) {
      setSidebarOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const routeMap = {
    home: '/',
    sale: '/sale/invoices',
    purchase: '/purchase/bills',
    reports: '/reports',
    distributors: '/distributors',
  };

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);

    const matchedRoute = Object.entries(routeMap).find(([key]) =>
      key.includes(term) || term.includes(key)
    );

    if (matchedRoute) {
      navigate(matchedRoute[1]);
      setSearchOpen(false); // Close search bar after navigation
      setSearchTerm(''); // Clear search term
    }
  };

  const handleLogout = () => {
    setSidebarOpen(false);
    navigate("/login");
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Navbar */}
      <nav className="bg-blue-900 text-white shadow-md fixed top-0 left-0 w-full z-40">
        <div className="flex items-center justify-between h-14 px-4 md:px-6">
          {/* Hamburger for small screens */}
          <div className="md:hidden flex items-center">
            <button onClick={handleSidebarToggle} className="text-white hover:text-yellow-400 transition">
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Navbar Items for larger screens */}
          <div className="hidden md:flex items-center gap-4">
            {/* Home Icon */}
            <Link to="/" onClick={() => handleNavigation('/')} className="p-2 hover:bg-blue-800 rounded-md transition hover:text-yellow-400">
              <Home size={20} />
            </Link>

            {/* Sale Dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-1 p-2 hover:bg-blue-800 rounded-md transition hover:text-yellow-400">
                <Receipt size={20} />
                <span className="text-sm font-medium">Sales</span>
                <ChevronDown size={16} className="group-hover:rotate-180 transition-transform" />
              </button>
              <div className="absolute left-0 mt-2 w-48 bg-white text-gray-800 rounded-lg shadow-lg border border-gray-300 opacity-0 group-hover:opacity-100 group-hover:visible invisible transition-all duration-200">
                <Link to="/sale/invoices" onClick={() => handleNavigation('/sale/invoices')} className="block px-4 py-2 hover:bg-blue-300 transition">Sale Invoices</Link>
                <Link to="/sale/payment-in" onClick={() => handleNavigation('/sale/payment-in')} className="block px-4 py-2 hover:bg-blue-300 transition">Payment In</Link>
                <Link to="/sale/order" onClick={() => handleNavigation('/sale/order')} className="block px-4 py-2 hover:bg-blue-300 transition">Sale Order</Link>
                <Link to="/sale/return" onClick={() => handleNavigation('/sale/return')} className="block px-4 py-2 hover:bg-blue-300 transition">Sale Return</Link>
              </div>
            </div>

            {/* Purchase & Expense Dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-1 p-2 hover:bg-blue-800 rounded-md transition hover:text-yellow-400">
                <ShoppingCart size={20} />
                <span className="text-sm font-medium">Purchase</span>
                <ChevronDown size={16} className="group-hover:rotate-180 transition-transform" />
              </button>
              <div className="absolute left-0 mt-2 w-48 bg-white text-gray-800 rounded-lg shadow-lg border border-gray-300 opacity-0 group-hover:opacity-100 group-hover:visible invisible transition-all duration-200">
                <Link to="/purchase/bills" onClick={() => handleNavigation('/purchase/bills')} className="block px-4 py-2 hover:bg-blue-300 transition">Purchase Bills</Link>
                <Link to="/purchase/payment-out" onClick={() => handleNavigation('/purchase/payment-out')} className="block px-4 py-2 hover:bg-blue-300 transition">Payment Out</Link>
                <Link to="/purchase/order" onClick={() => handleNavigation('/purchase/order')} className="block px-4 py-2 hover:bg-blue-300 transition">Purchase Order</Link>
                <Link to="/purchase/return" onClick={() => handleNavigation('/purchase/return')} className="block px-4 py-2 hover:bg-blue-300 transition">Purchase Return</Link>
              </div>
            </div>

            {/* Inventory */}
            <Link to="/inventory" onClick={() => handleNavigation('/inventory')} className="flex items-center gap-1 p-2 hover:bg-blue-800 rounded-md transition hover:text-yellow-400">
              <ShoppingCart size={20} />
              <span className="text-sm font-medium">Inventory</span>
            </Link>

            {/* Distributors */}
            <Link to="/distributors" onClick={() => handleNavigation('/distributors')} className="flex items-center gap-1 p-2 hover:bg-blue-800 rounded-md transition hover:text-yellow-400">
              <Users size={20} />
              <span className="text-sm font-medium">Distributors</span>
            </Link>

            {/* More Dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-1 p-2 hover:bg-blue-800 rounded-md transition hover:text-yellow-400">
                <MoreHorizontal size={20} />
                <span className="text-sm font-medium">More</span>
                <ChevronDown size={16} className="group-hover:rotate-180 transition-transform" />
              </button>
              <div className="absolute left-0 mt-2 w-48 bg-white text-gray-800 rounded-lg shadow-lg border border-gray-300 opacity-0 group-hover:opacity-100 group-hover:visible invisible transition-all duration-200">
                <Link to="/purchase/shortbook" onClick={() => handleNavigation('/purchase/shortbook')} className="block px-4 py-2 hover:bg-blue-300 transition">ShortBook</Link>
                <Link to="/orderassistant" onClick={() => handleNavigation('/orderassistant')} className="block px-4 py-2 hover:bg-blue-300 transition">Order Assistant</Link>
              </div>
            </div>
          </div>

          {/* Right Side: Search, Notification, and User */}
          <div className="flex items-center gap-3">
            {/* Search Icon and Bar */}
            <div className="relative">
              {!searchOpen ? (
                <button onClick={() => setSearchOpen(true)} className="p-2 hover:bg-blue-800 rounded-md transition hover:text-yellow-400">
                  <Search size={20} />
                </button>
              ) : (
                <div className="flex items-center bg-white rounded-md px-3 py-1 w-64 transition-all duration-300">
                  <Search className="w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={handleSearch}
                    className="ml-2 w-full outline-none bg-transparent text-sm text-gray-700"
                    autoFocus
                    onBlur={() => {
                      setSearchOpen(false);
                      setSearchTerm('');
                    }}
                  />
                </div>
              )}
            </div>

            {/* Notification Icon */}
            <button className="relative p-2 hover:bg-blue-800 rounded-md transition hover:text-yellow-400">
              <Bell size={20} />
              <span className="absolute top-1 right-1 bg-orange-500 w-4 h-4 rounded-full flex items-center justify-center text-xs">3</span>
            </button>

            {/* User Icon and Dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-2 p-2 hover:bg-blue-800 rounded-md transition hover:text-yellow-400">
                <UserCircle size={20} />
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-white text-gray-800 rounded-lg shadow-lg border border-gray-300 opacity-0 group-hover:opacity-100 group-hover:visible invisible transition-all duration-200">
                <ul className="py-2">
                  <li
                    onClick={() => handleNavigation("/profile")}
                    className="px-4 py-2 hover:bg-blue-300 cursor-pointer flex items-center gap-2 transition"
                  >
                    <User className="w-4 h-4 text-blue-600" />
                    <span>Profile</span>
                  </li>
                  <li
                    onClick={() => handleNavigation("/collection")}
                    className="px-4 py-2 hover:bg-blue-300 cursor-pointer flex items-center gap-2 transition"
                  >
                    <Folder className="w-4 h-4 text-blue-600" />
                    <span>Collection</span>
                  </li>
                  <li
                    onClick={handleLogout}
                    className="px-4 py-2 hover:bg-blue-300 cursor-pointer flex items-center gap-2 border-t border-gray-200 transition"
                  >
                    <LogOut className="w-4 h-4 text-red-500" />
                    <span>Logout</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Sidebar (Hamburger Menu) */}
        <div
          ref={sidebarRef}
          className={`md:hidden fixed top-14 left-0 w-64 h-[calc(100vh-3.5rem)] bg-blue-900 text-white transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} z-30 overflow-y-auto`}
        >
          <nav className="flex flex-col p-4 space-y-2">
            {/* Home */}
            <Link to="/" onClick={() => handleNavigation('/')} className="flex items-center gap-2 p-2 hover:bg-blue-800 rounded-md hover:text-yellow-400 transition">
              <Home size={20} />
              <span className="text-sm font-medium">Home</span>
            </Link>

            {/* Sale (Collapsible) */}
            <div className="flex flex-col">
              <button
                onClick={() => handleMobileSectionToggle('sales')}
                className="flex items-center justify-between gap-2 p-2 hover:bg-blue-800 rounded-md hover:text-yellow-400 transition"
              >
                <div className="flex items-center gap-2">
                  <Receipt size={20} />
                  <span className="text-sm font-medium">Sales</span>
                </div>
                {openMobileSection === 'sales' ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
              <div className={`ml-6 space-y-1 overflow-hidden transition-all duration-200 ${openMobileSection === 'sales' ? 'max-h-96' : 'max-h-0'}`}>
                <Link to="/sale/invoices" onClick={() => handleNavigation('/sale/invoices')} className="block px-4 py-2 hover:bg-blue-800 rounded-md text-sm hover:text-yellow-400 transition">Sale Invoices</Link>
                <Link to="/sale/payment-in" onClick={() => handleNavigation('/sale/payment-in')} className="block px-4 py-2 hover:bg-blue-800 rounded-md text-sm hover:text-yellow-400 transition">Payment In</Link>
                <Link to="/sale/order" onClick={() => handleNavigation('/sale/order')} className="block px-4 py-2 hover:bg-blue-800 rounded-md text-sm hover:text-yellow-400 transition">Sale Order</Link>
                <Link to="/sale/return" onClick={() => handleNavigation('/sale/return')} className="block px-4 py-2 hover:bg-blue-800 rounded-md text-sm hover:text-yellow-400 transition">Sale Return/ Credit Note</Link>
                <Link to="/sale/pos" onClick={() => handleNavigation('/sale/pos')} className="block px-4 py-2 hover:bg-blue-800 rounded-md text-sm hover:text-yellow-400 transition">Vyapar POS</Link>
              </div>
            </div>

            {/* Purchase & Expense (Collapsible) */}
            <div className="flex flex-col">
              <button
                onClick={() => handleMobileSectionToggle('purchase')}
                className="flex items-center justify-between gap-2 p-2 hover:bg-blue-800 rounded-md hover:text-yellow-400 transition"
              >
                <div className="flex items-center gap-2">
                  <ShoppingCart size={20} />
                  <span className="text-sm font-medium">Purchase</span>
                </div>
                {openMobileSection === 'purchase' ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
              <div className={`ml-6 space-y-1 overflow-hidden transition-all duration-200 ${openMobileSection === 'purchase' ? 'max-h-96' : 'max-h-0'}`}>
                <Link to="/purchase/bills" onClick={() => handleNavigation('/purchase/bills')} className="block px-4 py-2 hover:bg-blue-800 rounded-md text-sm hover:text-yellow-400 transition">Purchase Bills</Link>
                <Link to="/purchase/payment-out" onClick={() => handleNavigation('/purchase/payment-out')} className="block px-4 py-2 hover:bg-blue-800 rounded-md text-sm hover:text-yellow-400 transition">Payment Out</Link>
                <Link to="/purchase/order" onClick={() => handleNavigation('/purchase/order')} className="block px-4 py-2 hover:bg-blue-800 rounded-md text-sm hover:text-yellow-400 transition">Purchase Order</Link>
                <Link to="/purchase/return" onClick={() => handleNavigation('/purchase/return')} className="block px-4 py-2 hover:bg-blue-800 rounded-md text-sm hover:text-yellow-400 transition">Purchase Return/ Dr. Note</Link>
              </div>
            </div>

            {/* Inventory */}
            <Link to="/inventory" onClick={() => handleNavigation('/inventory')} className="flex items-center gap-2 p-2 hover:bg-blue-800 rounded-md hover:text-yellow-400 transition">
              <ShoppingCart size={20} />
              <span className="text-sm font-medium">Inventory</span>
            </Link>

            {/* Distributors */}
            <Link to="/distributors" onClick={() => handleNavigation('/distributors')} className="flex items-center gap-2 p-2 hover:bg-blue-800 rounded-md hover:text-yellow-400 transition">
              <Users size={20} />
              <span className="text-sm font-medium">Distributors</span>
            </Link>

            {/* More (Collapsible) */}
            <div className="flex flex-col">
              <button
                onClick={() => handleMobileSectionToggle('more')}
                className="flex items-center justify-between gap-2 p-2 hover:bg-blue-800 rounded-md hover:text-yellow-400 transition"
              >
                <div className="flex items-center gap-2">
                  <MoreHorizontal size={20} />
                  <span className="text-sm font-medium">More</span>
                </div>
                {openMobileSection === 'more' ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
              <div className={`ml-6 space-y-1 overflow-hidden transition-all duration-200 ${openMobileSection === 'more' ? 'max-h-96' : 'max-h-0'}`}>
                <Link to="/reports" onClick={() => handleNavigation('/reports')} className="block px-4 py-2 hover:bg-blue-800 rounded-md text-sm hover:text-yellow-400 transition">Reports</Link>
                <Link to="/settings" onClick={() => handleNavigation('/settings')} className="block px-4 py-2 hover:bg-blue-800 rounded-md text-sm hover:text-yellow-400 transition">Settings</Link>
              </div>
            </div>
          </nav>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-14 flex-1 overflow-y-auto bg-gray-100">
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;