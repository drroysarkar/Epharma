import {
  User,
  FileText,
  Shield,
  Package,
  Key,
  Users,
  Settings,
  Plus,
} from "lucide-react";

const navItems = [
  { name: "About", icon: <User size={20} />, key: "about" },
  { name: "Documents", icon: <FileText size={20} />, key: "documents" },
  { name: "Security", icon: <Shield size={20} />, key: "security" },
  { name: "Plan", icon: <Package size={20} />, key: "plan" },
  { name: "Password", icon: <Key size={20} />, key: "password" },
  { name: "Staff", icon: <Users size={20} />, key: "staff" },
  { name: "Integrations", icon: <Plus size={20} />, key: "integrations" },
  { name: "Settings", icon: <Settings size={20} />, key: "settings" },
];

const ProfileNavbar = ({ activeTab, setActiveTab, setIsSidebarOpen }) => {
  return (
    <nav className="w-64 bg-blue-900 shadow-xl h-full flex flex-col border-t-4 border-black">
      <div className="p-4 md:p-6">
        <h3 className="text-lg md:text-xl font-semibold text-white">Profile Menu</h3>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-hide divide-y divide-gray-500">
        {navItems.map((item) => {
          const isActive = activeTab === item.key;
          return (
            <button
              key={item.key}
              onClick={() => {
                setActiveTab(item.key);
                setIsSidebarOpen(false); // Close sidebar on item click (mobile)
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 md:px-6 md:py-4 text-sm md:text-base font-medium transition duration-300
                ${
                  isActive
                    ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                    : "text-gray-300 hover:bg-gradient-to-r hover:from-yellow-400 hover:to-orange-500 hover:text-black"
                }`}
            >
              <span className="flex items-center justify-center">{item.icon}</span>
              <span>{item.name}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default ProfileNavbar;