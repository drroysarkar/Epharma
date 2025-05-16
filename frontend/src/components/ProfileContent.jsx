import React, { useEffect, useState } from "react";
import Documents from "./Documents";
import axios from "axios";

const ProfileContent = ({ activeTab }) => {
  const userId = localStorage.getItem("userId");
  const [formData, setFormData] = useState({
    pharmacyName: "",
    pharmacistName: "",
    mobile: "",
    email: "",
    address: "",
    address2: "",
    area: "",
    pincode: "",
    city: "",
    state: "",
    companyLogo: null,
    signature: null,
  });

  const [isProfileExist, setIsProfileExist] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const res = await axios.get(`http://localhost:5010/api/pharmacy/profile/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = res.data;
        if (res.status === 200 && data.profile) {
          setIsProfileExist(true);
          setFormData({
            pharmacyName: data.profile.pharmacyName || "",
            pharmacistName: data.profile.pharmacistName || "",
            mobile: data.profile.mobile || "",
            email: data.profile.email || "",
            address: data.profile.address || "",
            address2: data.profile.address2 || "",
            area: data.profile.area || "",
            pincode: data.profile.pincode || "",
            city: data.profile.city || "",
            state: data.profile.state || "",
            companyLogo: data.profile.companyLogoPath
              ? `http://localhost:5010/${data.profile.companyLogoPath}`
              : null,
            signature: data.profile.signaturePath
              ? `http://localhost:5010/${data.profile.signaturePath}`
              : null,
          });
        } else {
          setIsEditing(true); // Show form for new users
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e, fieldName) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        [fieldName]: file,
      }));
    }
  };

  const handleSubmit = async () => {
    const formDataToSend = new FormData();

    Object.keys(formData).forEach((key) => {
      if (key !== "companyLogo" && key !== "signature") {
        formDataToSend.append(key, formData[key]);
      }
    });

    formDataToSend.append("userId", userId);

    if (formData.companyLogo && typeof formData.companyLogo !== "string") {
      formDataToSend.append("companyLogo", formData.companyLogo);
    }
    if (formData.signature && typeof formData.signature !== "string") {
      formDataToSend.append("signature", formData.signature);
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5010/api/pharmacy/${isProfileExist ? "update-profile" : "save-profile"}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formDataToSend,
        }
      );

      const result = await response.json();
      if (response.ok) {
        alert(isProfileExist ? "Profile updated successfully!" : "Profile saved successfully!");
        setIsProfileExist(true);
        setIsEditing(false);
      } else {
        alert(result.message || "Error saving profile. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting profile:", error);
      alert("An error occurred while saving the profile.");
    }
  };

  const renderProfileView = () => (
    <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 lg:p-10 transition-all duration-300">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Pharmacy Profile</h2>
        <button
          onClick={() => setIsEditing(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-all duration-200"
        >
          Edit Profile
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {[
          { label: "Pharmacy Name", value: formData.pharmacyName },
          { label: "Pharmacist Name", value: formData.pharmacistName },
          { label: "Mobile Number", value: formData.mobile },
          { label: "Email", value: formData.email },
          { label: "Address", value: formData.address },
          { label: "Address Line 2", value: formData.address2 },
          { label: "Area", value: formData.area },
          { label: "Pincode", value: formData.pincode },
          { label: "City", value: formData.city },
          { label: "State", value: formData.state },
        ].map(({ label, value }) => (
          <div key={label} className="flex flex-col">
            <span className="text-sm font-medium text-gray-500">{label}</span>
            <span className="text-base text-gray-800">{value || "N/A"}</span>
          </div>
        ))}
      </div>
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Media</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <span className="text-sm font-medium text-gray-500">Company Logo</span>
            {formData.companyLogo ? (
              <img
                src={formData.companyLogo}
                alt="Company Logo"
                className="mt-2 w-32 h-32 object-contain rounded-lg border border-gray-200"
              />
            ) : (
              <span className="text-base text-gray-800">N/A</span>
            )}
          </div>
          <div>
            <span className="text-sm font-medium text-gray-500">Signature</span>
            {formData.signature ? (
              <img
                src={formData.signature}
                alt="Signature"
                className="mt-2 w-32 h-32 object-contain rounded-lg border border-gray-200"
              />
            ) : (
              <span className="text-base text-gray-800">N/A</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderForm = () => (
    <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 lg:p-10 transition-all duration-300">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        {isProfileExist ? "Edit Profile" : "Create Profile"}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {[
          { label: "Pharmacy Name", name: "pharmacyName" },
          { label: "Pharmacist Name", name: "pharmacistName" },
          { label: "Mobile Number", name: "mobile" },
          { label: "Email", name: "email", type: "email" },
          { label: "Address", name: "address" },
          { label: "Address Line 2", name: "address2" },
          { label: "Area", name: "area" },
          { label: "Pincode", name: "pincode" },
          { label: "City", name: "city" },
          { label: "State", name: "state" },
          { label: "Company Logo", name: "companyLogo", type: "file" },
          { label: "Signature", name: "signature", type: "file" },
        ].map(({ label, name, type = "text" }) => (
          <div key={name}>
            <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
            {type === "file" ? (
              <>
                <input
                  type="file"
                  name={name}
                  onChange={(e) => handleFileChange(e, name)}
                  className="w-full border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 transition duration-200"
                />
                {formData[name] && (
                  <div className="mt-2 text-sm text-gray-500">
                    {typeof formData[name] === "string" ? (
                      <img
                        src={formData[name]}
                        alt={name}
                        className="w-20 h-20 object-contain rounded"
                      />
                    ) : (
                      `${name === "companyLogo" ? "Company Logo" : "Signature"} uploaded: ${
                        formData[name].name
                      }`
                    )}
                  </div>
                )}
              </>
            ) : (
              <input
                type={type}
                name={name}
                value={formData[name]}
                onChange={handleChange}
                placeholder={`Enter ${label.toLowerCase()}`}
                className="w-full border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 transition duration-200"
              />
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-end mt-8 gap-4">
        {isProfileExist && (
          <button
            onClick={() => setIsEditing(false)}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-6 rounded-lg shadow-md transition-all duration-200"
          >
            Cancel
          </button>
        )}
        <button
          onClick={handleSubmit}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg shadow-md transition-all duration-200"
        >
          {isProfileExist ? "Update Profile" : "Save Profile"}
        </button>
      </div>
    </div>
  );

  return (
    <div>
      {(() => {
        switch (activeTab) {
          case "about":
            return isProfileExist && !isEditing ? renderProfileView() : renderForm();
          case "documents":
            return <Documents userId={userId} />;
          default:
            return (
              <div className="text-center py-10 text-gray-500 text-lg">Welcome</div>
            );
        }
      })()}
    </div>
  );
};

export default ProfileContent;