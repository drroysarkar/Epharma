import { Link, Outlet, useNavigate } from 'react-router-dom';
import {
  Briefcase, LayoutDashboard, Users, Receipt, ShoppingCart,
  CreditCard, Cloud, ClipboardList, FileText, Settings,
  ChevronDown, ChevronUp, Menu, X, Bell, UserCircle, Search,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

const AdminLayout = () => {
  const [openSection, setOpenSection] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarRef = useRef(null);
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const toggleSection = (section) => {
    setOpenSection(openSection === section ? '' : section);
  };

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
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
    dashboard: '/',
    register: '/register',
    employees: '/employees',
  };

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);

    const matchedRoute = Object.entries(routeMap).find(([key]) =>
      key.includes(term) || term.includes(key)
    );

    if (matchedRoute) {
      navigate(matchedRoute[1]);
    }
  };

  const SidebarSection = ({ icon, label, children }) => {
    const contentRef = useRef(null);
    const [height, setHeight] = useState(0);

    useEffect(() => {
      if (openSection === label && contentRef.current) {
        setHeight(contentRef.current.scrollHeight);
      } else {
        setHeight(0);
      }
    }, [openSection, label]);

    return (
      <div>
        <div
          className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-700 hover:text-yellow-400 rounded-lg transition"
          onClick={() => toggleSection(label)}
        >
          <div className="flex items-center gap-3">
            <span className="text-gray-400">{icon}</span>
            <span className="text-sm font-semibold">{label}</span>
          </div>
          {openSection === label ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
        <div
          ref={contentRef}
          style={{
            maxHeight: `${height}px`,
            transition: 'max-height 0.3s ease',
          }}
          className="overflow-hidden"
        >
          <div className="ml-6 space-y-1 py-1">{children}</div>
        </div>
      </div>
    );
  };

  const SidebarLink = ({ to, label, icon }) => (
    <Link
      to={to}
      className="flex items-center justify-between text-sm px-3 py-2 rounded-lg hover:bg-gray-700 hover:text-yellow-400 transition"
    >
      <span className="flex items-center gap-2">
        {icon && <span className="text-gray-400">{icon}</span>}
        {label}
      </span>
      <span className="text-xl font-bold text-gray-500">+</span>
    </Link>
  );

  return (
    <div className="flex h-screen w-full">
      {/* Hamburger & Top Navbar */}
      <div className="md:hidden fixed top-0 left-0 z-40 w-full bg-gray-900 h-16 flex items-center px-4 shadow-lg">
        <button onClick={handleSidebarToggle} className="text-yellow-400">
          {sidebarOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
        <h1 className="ml-4 text-lg font-bold text-white">Admin Panel</h1>
      </div>

      {/* Sidebar */}
      <div
  ref={sidebarRef}
  className={`absolute md:relative top-0 left-0 min-h-screen w-64 z-30 bg-gradient-to-b from-gray-900 to-gray-800 text-white shadow-2xl border-r border-gray-700 transform transition-transform duration-300 ease-in-out ${
    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
  } md:translate-x-0 overflow-y-auto`}
>

        <div className="p-6 text-center border-b border-gray-700 bg-gradient-to-tr from-gray-800 to-gray-700 shadow-inner">
          <h1 className="text-2xl font-extrabold tracking-wide text-yellow-400">Admin Panel</h1>
        </div>

        <nav className="flex flex-col flex-grow mt-6 px-3 space-y-2 overflow-y-auto pb-6">
          <SidebarLink to="/" icon={<LayoutDashboard size={20} />} label="Home" />

          <SidebarSection icon={<Users size={20} />} label="Parties">
            <SidebarLink to="/parties/details" label="Party Details" />
            <SidebarLink to="/parties/whatsapp" label="WhatsApp Smart Connect" />
          </SidebarSection>

          <SidebarSection icon={<Receipt size={20} />} label="Sale">
            <SidebarLink to="/sale/invoices" label="Sale Invoices" />
            <SidebarLink to="/sale/estimate" label="Estimate/ Quotation" />
            <SidebarLink to="/sale/payment-in" label="Payment In" />
            <SidebarLink to="/sale/order" label="Sale Order" />
            <SidebarLink to="/sale/delivery" label="Delivery Challan" />
            <SidebarLink to="/sale/return" label="Sale Return/ Credit Note" />
            <SidebarLink to="/sale/pos" label="Vyapar POS" />
          </SidebarSection>

          <SidebarSection icon={<ShoppingCart size={20} />} label="Purchase & Expense">
            <SidebarLink to="/purchase/bills" label="Purchase Bills" />
            <SidebarLink to="/purchase/payment-out" label="Payment Out" />
            <SidebarLink to="/purchase/expenses" label="Expenses" />
            <SidebarLink to="/purchase/order" label="Purchase Order" />
            <SidebarLink to="/purchase/return" label="Purchase Return/ Dr. Note" />
          </SidebarSection>

          <SidebarSection icon={<CreditCard size={20} />} label="Cash & Bank">
            <SidebarLink to="/cash/bank-accounts" label="Bank Accounts" />
            <SidebarLink to="/cash/cash-in-hand" label="Cash In Hand" />
            <SidebarLink to="/cash/cheques" label="Cheques" />
            <SidebarLink to="/cash/loan-accounts" label="Loan Accounts" />
          </SidebarSection>

          <SidebarSection icon={<Cloud size={20} />} label="Sync, Share & Backup">
            <SidebarLink to="/sync/share" label="Sync & Share" />
            <SidebarLink to="/sync/auto" label="Auto Backup" />
            <SidebarLink to="/sync/computer" label="Backup To Computer" />
            <SidebarLink to="/sync/drive" label="Backup To Drive" />
            <SidebarLink to="/sync/restore" label="Restore Backup" />
          </SidebarSection>

          <SidebarSection icon={<ClipboardList size={20} />} label="Utilities">
            <SidebarLink to="/utilities/import-items" label="Import Items" />
            <SidebarLink to="/utilities/setup-business" label="Set Up My Business" />
            <SidebarLink to="/utilities/accountant-access" label="Accountant Access" />
            <SidebarLink to="/utilities/barcode" label="Barcode Generator" />
            <SidebarLink to="/utilities/update-items" label="Update Items In Bulk" />
            <SidebarLink to="/utilities/import-tally" label="Import From Tally" />
            <SidebarLink to="/utilities/import-parties" label="Import Parties" />
            <SidebarLink to="/utilities/export-tally" label="Exports To Tally" />
            <SidebarLink to="/utilities/export-items" label="Export Items" />
            <SidebarLink to="/utilities/verify" label="Verify My Data" />
            <SidebarLink to="/utilities/close-year" label="Close Financial Year" />
          </SidebarSection>

          <SidebarLink to="/reports" icon={<FileText size={20} />} label="Reports" />
          <SidebarLink to="/settings" icon={<Settings size={20} />} label="Settings" />
        </nav>

        <div className="px-4 py-4 text-center text-sm text-gray-500 tracking-wide">
    © 2025 TTSPL. All rights reserved.
  </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:ml-0 min-h-screen">

        {/* Top Navbar */}
        <div className="hidden md:flex fixed top-0 right-0 z-20 w-full md:w-[calc(100%-256px)] h-16 bg-gradient-to-b from-gray-900 to-gray-800 text-white shadow-md items-center justify-between px-6">
          <div className="flex items-center w-full max-w-xs bg-white rounded-md px-3 py-1 focus-within:ring-2 ring-yellow-400 transition">
            <Search className="w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={handleSearch}
              className="ml-2 w-full outline-none bg-transparent text-sm text-gray-700"
            />
          </div>

          <div className="flex items-center gap-4 text-white">
            <button className="relative p-2 rounded-full hover:bg-yellow-700 transition">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 bg-red-500 w-2 h-2 rounded-full" />
            </button>
            <button className="flex items-center gap-2 p-2 rounded-full hover:bg-yellow-700 transition">
              <UserCircle className="w-6 h-6" />
              <span className="hidden md:inline text-sm font-medium">Admin</span>
            </button>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="pt-16 p-4 bg-gray-100 flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
