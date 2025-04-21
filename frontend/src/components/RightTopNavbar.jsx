import { Bell, UserCircle, Search } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const RightTopNavbar = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

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
  

  return (
    <div className="fixed top-0 right-0 z-50 w-full md:w-[calc(100%-255px)] h-16 bg-gradient-to-b from-gray-900 to-gray-800 text-white shadow-md flex items-center justify-between px-4 md:px-8">
      {/* Search Bar */}
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

      {/* Icons & Profile */}
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
  );
};

export default RightTopNavbar;
