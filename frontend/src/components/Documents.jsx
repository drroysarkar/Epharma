import React, { useState, useEffect } from "react";
import axios from "axios";

const initialDocs = [
  { title: "License 20", documentName: "License 20", documentType: "", licenseNumber: "", expiryDate: "", file: null },
  { title: "License 21", documentName: "License 21", documentType: "", licenseNumber: "", expiryDate: "", file: null },
  { title: "FSSAI", documentName: "FSSAI", documentType: "", licenseNumber: "", expiryDate: "", file: null },
  { title: "License 20B", documentName: "License 20B", documentType: "", licenseNumber: "", expiryDate: "", file: null },
  { title: "License 21B", documentName: "License 21B", documentType: "", licenseNumber: "", expiryDate: "", file: null },
];

const Documents = ({ userId }) => {
  const [documents, setDocuments] = useState(initialDocs);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`http://localhost:5010/api/pharmacy/documents/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const fetchedDocs = response.data.documents || [];
        
        // Map fetched documents to initialDocs structure
        const updatedDocs = initialDocs.map((doc) => {
          const matchingDoc = fetchedDocs.find((fd) => fd.document_name === doc.documentName);
          if (matchingDoc) {
            return {
              ...doc,
              licenseNumber: matchingDoc.license_number || "",
              expiryDate: matchingDoc.doc_expiry ? new Date(matchingDoc.doc_expiry).toISOString().substring(0, 10) : "",
              file: matchingDoc.document_data ? `http://localhost:5010/${matchingDoc.document_data}` : null,
              documentType: matchingDoc.document_type || "",
              id: matchingDoc.id,
            };
          }
          return doc;
        });
        setDocuments(updatedDocs);
      } catch (error) {
        console.error("Error fetching documents:", error);
      }
    };
    if (userId) fetchDocuments();
  }, [userId]);

  const handleChange = (index, field, value) => {
    const updatedDocs = [...documents];
    updatedDocs[index][field] = value;
    setDocuments(updatedDocs);
  };

  const handleFileChange = (index, file) => {
    const updatedDocs = [...documents];
    updatedDocs[index].file = file;
    updatedDocs[index].documentType = file ? file.name.split(".").pop().toLowerCase() : "";
    setDocuments(updatedDocs);
  };

  const handleSubmit = async (index) => {
    const doc = documents[index];
    // Require at least one field to be filled
    if (!doc.licenseNumber && !doc.expiryDate && !doc.file) {
      alert(`Please fill at least one field for ${doc.documentName} before submitting.`);
      return;
    }

    const isUpdating = !!doc.id;
    const token = localStorage.getItem("token");
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("documentName", doc.documentName);
      formDataToSend.append("documentType", doc.documentType || "");
      formDataToSend.append("licenseNumber", doc.licenseNumber || "");
      formDataToSend.append("docExpiry", doc.expiryDate || "");
      formDataToSend.append("userId", userId);
      if (doc.file && typeof doc.file !== "string") {
        formDataToSend.append("documentData", doc.file);
      }

      const url = isUpdating
        ? `http://localhost:5010/api/pharmacy/update-document/${doc.id}`
        : `http://localhost:5010/api/pharmacy/save-document`;

      const response = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formDataToSend,
      });

      const result = await response.json();
      if (!response.ok) {
        alert(result.message || `Error ${isUpdating ? "updating" : "saving"} ${doc.documentName}.`);
        return;
      }

      // Update document with returned ID if newly created
      const updatedDocs = [...documents];
      if (!isUpdating && result.document?.id) {
        updatedDocs[index].id = result.document.id;
        updatedDocs[index].file = result.document.document_data
          ? `http://localhost:5010/${result.document.document_data}`
          : doc.file;
        setDocuments(updatedDocs);
      }

      alert(isUpdating ? `${doc.documentName} updated successfully!` : `${doc.documentName} saved successfully!`);
    } catch (error) {
      console.error(`Error ${isUpdating ? "updating" : "saving"} document:`, error);
      alert(`An error occurred while ${isUpdating ? "updating" : "saving"} ${doc.documentName}.`);
    }
  };

  return (
    <div className="p-2 mx-auto">
      <div className="grid gap-6">
        {documents.map((doc, index) => (
          <div
            key={index}
            className="bg-white shadow-lg rounded-xl p-6 flex flex-col md:flex-row gap-6 border border-gray-100 transition-all duration-200 hover:shadow-xl"
          >
            <div className="flex-1 space-y-5">
              <h3 className="text-lg font-semibold text-blue-600">{doc.title}</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">License Number</label>
                <input
                  type="text"
                  value={doc.licenseNumber}
                  onChange={(e) => handleChange(index, "licenseNumber", e.target.value)}
                  placeholder="Enter license number"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                <input
                  type="date"
                  value={doc.expiryDate}
                  onChange={(e) => handleChange(index, "expiryDate", e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                />
              </div>
            </div>

            <div className="flex flex-col items-center gap-3 w-40">
              <label className="block text-sm font-medium text-gray-700 w-full text-center">Upload File</label>
              <label className="cursor-pointer w-full">
                {doc.file ? (
                  <img
                    src={typeof doc.file === "string" ? doc.file : URL.createObjectURL(doc.file)}
                    alt={doc.title}
                    className="w-full h-20 object-contain border border-gray-200 rounded-md"
                  />
                ) : (
                  <div className="w-full h-20 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center text-gray-400 text-2xl">
                    +
                  </div>
                )}
                <input
                  type="file"
                  onChange={(e) => handleFileChange(index, e.target.files[0])}
                  className="hidden"
                  accept=".pdf,.png,.jpg"
                />
              </label>
              <button
                onClick={() => handleSubmit(index)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-4 py-2 mt-8 rounded-md shadow-sm transition-all duration-200"
              >
                {doc.id ? "Update" : "Save"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Documents;