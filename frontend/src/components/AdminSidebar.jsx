import { Link } from 'react-router-dom';
import {
  Briefcase, LayoutDashboard, Users, Receipt, ShoppingCart,
  CreditCard, Cloud, ClipboardList, FileText, Settings,
  ChevronDown, ChevronUp, Menu, X
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

const AdminSidebar = ({ onToggle }) => {
  const [openSection, setOpenSection] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarRef = useRef(null);

  const toggleSection = (section) => {
    setOpenSection(openSection === section ? '' : section);
  };

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
    onToggle(!sidebarOpen); // Notify parent of state change
  };

  const handleClickOutside = (e) => {
    if (sidebarRef.current && !sidebarRef.current.contains(e.target)) {
      setSidebarOpen(false);
      onToggle(false); // Notify parent when closing
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    onToggle(sidebarOpen); // Sync initial state and updates
  }, [sidebarOpen, onToggle]);

  const SidebarSection = ({ icon, label, children }) => {
    const contentRef = useRef(null);
    const [height, setHeight] = useState(0);

    useEffect(() => {
      if (contentRef.current && openSection === label) {
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
          className="overflow-hidden transition-max-height duration-500 ease-in-out"
          style={{ maxHeight: height }}
        >
          <div className="ml-6 space-y-1">{children}</div>
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
    <>
      {/* Hamburger Button for Small Screens */}
      <div className="md:hidden flex items-center p-4 bg-gray-900 shadow-lg z-20">
        <button
          onClick={handleSidebarToggle}
          className="text-yellow-400 focus:outline-none"
        >
          {sidebarOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
        <h1 className="text-lg text-white font-bold ml-4">Admin Panel</h1>
      </div>

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className={`fixed md:static top-0 left-0 h-full w-64 z-30 bg-gradient-to-b from-gray-900 to-gray-800 text-white shadow-2xl border-r border-gray-700 transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
      >
        <div className="p-6 text-center border-b border-gray-700 bg-gradient-to-tr from-gray-800 to-gray-700 shadow-inner">
          <h1 className="text-2xl font-extrabold tracking-wide text-yellow-400">Admin Panel</h1>
        </div>

        <nav className="flex flex-col flex-grow mt-6 px-3 space-y-2 overflow-y-auto">
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

        <div className="absolute bottom-4 left-0 right-0 text-center text-sm text-gray-500 tracking-wide">
          © 2025 TTSPL. All rights reserved.
        </div>
      </div>
    </>
  );
};

export default AdminSidebar;