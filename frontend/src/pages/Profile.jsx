import { useState } from "react";
import ProfileNavbar from "../components/ProfileNavbar";
import ProfileContent from "../components/ProfileContent";

const Profile = () => {
  const [activeTab, setActiveTab] = useState("about");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const formatTitle = (key) =>
    key
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Assuming Parent Navbar exists above with height accounted for */}
      <div className="">
        {/* Hamburger Menu Bar */}
        <div className="bg-blue-900 text-white p-4 flex items-center justify-between md:hidden">
          <h3 className="text-lg font-semibold">Profile Menu</h3>
          <button
            onClick={toggleSidebar}
            aria-label="Toggle Sidebar"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d={isSidebarOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
              />
            </svg>
          </button>
        </div>

        <div className="flex flex-1">
          {/* Sidebar */}
          <div
            className={`w-64 bg-blue-900 transform ${
              isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            } md:translate-x-0 fixed   h-[calc(100vh-3.5rem)] z-40 transition-transform duration-300`}
          >
            <ProfileNavbar
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              setIsSidebarOpen={setIsSidebarOpen}
            />
          </div>

          {/* Overlay for mobile */}
          {isSidebarOpen && (
            <div
              className="fixed inset-0 backdrop-blur-sm bg-transparent z-30 md:hidden"
              onClick={toggleSidebar}
            />
          )}

          {/* Content Area */}
          <div
            className={`flex-1 ml-0 md:ml-64 p-4 md:p-6 overflow-auto transition-all duration-300 ${
              isSidebarOpen ? "brightness-75 md:brightness-100" : ""
            }`}
          >
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 border-b pb-2">
              {formatTitle(activeTab)}
            </h2>
            <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
              <ProfileContent activeTab={activeTab} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;