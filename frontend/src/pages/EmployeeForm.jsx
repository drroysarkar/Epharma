import React, { useRef, useState } from "react";

const EmployeeForm = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    address: "",
    profileImage: null,
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [loadingImage, setLoadingImage] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "phoneNumber") {
      // Only allow numbers and max 10 digits
      const cleaned = value.replace(/\D/g, "").slice(0, 10);
      setFormData((prev) => ({
        ...prev,
        [name]: cleaned,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLoadingImage(true);
      const reader = new FileReader();

      reader.onloadend = () => {
        setTimeout(() => {
          setImagePreview(reader.result);
          setLoadingImage(false);
        }, 500);
      };

      reader.readAsDataURL(file);

      setFormData((prev) => ({
        ...prev,
        profileImage: file,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(formData.email)) {
      alert("❌ Please enter a valid email address.");
      return;
    }

    if (formData.phoneNumber.length !== 10) {
      alert("❌ Phone number must be exactly 10 digits.");
      return;
    }

    try {
      const data = new FormData();
      Object.keys(formData).forEach((key) => {
        data.append(key, formData[key]);
      });

      const res = await fetch("http://localhost:5010/api/employees/add", {
        method: "POST",
        body: data,
      });

      const result = await res.json();

      if (res.ok) {
        alert("✅ Employee added successfully!");
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          phoneNumber: "",
          address: "",
          profileImage: null,
        });
        setImagePreview(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        alert(`❌ Error: ${result.message || "Something went wrong!"}`);
      }
    } catch (error) {
      alert(`❌ Error: ${error.message}`);
      console.error("Error submitting form:", error);
    }
  };

  const openFullScreen = () => {
    setIsFullScreen(true);
  };

  const closeFullScreen = () => {
    setIsFullScreen(false);
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setFormData((prev) => ({
      ...prev,
      profileImage: null,
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="relative bg-white flex items-center justify-center px-4 py-4">
      {loadingImage && (
        <div className="absolute inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <svg
              className="animate-spin h-12 w-12 text-yellow-400 mb-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            <p className="text-white text-lg font-medium">Loading image preview...</p>
          </div>
        </div>
      )}

      {isFullScreen && imagePreview && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-70 flex items-center justify-center">
          <button
            onClick={closeFullScreen}
            className="absolute top-5 right-5 text-white text-4xl font-bold z-50 bg-black bg-opacity-60 px-4 py-1 rounded-full hover:bg-opacity-80 transition"
          >
            &times;
          </button>
          <div className="relative">
            <img
              src={imagePreview}
              alt="Full Screen Preview"
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-blue-200 max-w-2xl w-full rounded-2xl p-10 space-y-6 shadow-[0_4px_20px_rgba(0,0,0,0.3)] border border-gray-200"
      >
        <h2 className="text-4xl font-bold text-center text-gray-800 mb-6">
          Add New Employee
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {[{ label: "First Name", name: "firstName" }, { label: "Last Name", name: "lastName" }].map(
            ({ label, name }) => (
              <div key={name}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {label}
                </label>
                <input
                  type="text"
                  name={name}
                  value={formData[name]}
                  onChange={handleChange}
                  className="w-full p-3 bg-yellow-50 border border-yellow-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition"
                  required
                />
              </div>
            )
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full p-3 bg-yellow-50 border border-yellow-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              maxLength={10}
              pattern="\d*"
              className="w-full p-3 bg-yellow-50 border border-yellow-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Address
          </label>
          <textarea
            name="address"
            rows="3"
            value={formData.address}
            onChange={handleChange}
            className="w-full p-3 bg-yellow-50 border border-yellow-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition"
            required
          />
        </div>

        <div className="col-span-1 sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Profile Image
          </label>

          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6">
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="block w-full sm:w-auto text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-yellow-400 file:text-black hover:file:bg-yellow-700 transition"
            />

            {imagePreview && !loadingImage && (
              <div className="mt-4 sm:mt-0 flex flex-col items-center space-y-2">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="h-24 w-24 object-cover rounded-full border border-yellow-300 shadow-md cursor-pointer"
                  onClick={openFullScreen}
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="text-sm text-black bg-red-500 hover:bg-yellow-200 px-3 py-1 rounded-full shadow-md transition"
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={loadingImage}
          className="w-full py-3 px-6 bg-blue-600 text-white font-semibold rounded-xl hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-300 disabled:opacity-50 transition-all duration-300"
        >
          {loadingImage ? "Uploading..." : "Add Employee"}
        </button>
      </form>
    </div>
  );
};

export default EmployeeForm;
