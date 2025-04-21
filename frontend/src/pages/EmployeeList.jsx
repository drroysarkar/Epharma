import React, { useEffect, useState } from "react";
import DataTable from "react-data-table-component";

const EmployeeList = () => {
    const [employees, setEmployees] = useState([]);
    const [filteredEmployees, setFilteredEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [fullscreenImage, setFullscreenImage] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [newImage, setNewImage] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState({ id: null, open: false });

    const fetchEmployees = async () => {
        try {
            const res = await fetch("http://localhost:5010/api/employees/all");
            const data = await res.json();
            if (data.success) {
                setEmployees(data.employees);
                setFilteredEmployees(data.employees);
            } else {
                alert("Failed to fetch employees.");
            }
        } catch (err) {
            console.error(err);
            alert("An error occurred while fetching employees.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, []);

    useEffect(() => {
        const filtered = employees.filter(emp =>
            `${emp.first_Name} ${emp.last_Name}`.toLowerCase().includes(search.toLowerCase()) ||
            emp.email.toLowerCase().includes(search.toLowerCase()) ||
            emp.phone_Number.toLowerCase().includes(search.toLowerCase()) ||
            emp.address.toLowerCase().includes(search.toLowerCase())
        );
        setFilteredEmployees(filtered);
    }, [search, employees]);

    const handleEdit = (employee) => {
        setSelectedEmployee(employee);
        setIsModalOpen(true);
        setNewImage(null);
    };

    const handleDelete = async (id) => {
        try {
            const res = await fetch(`http://localhost:5010/api/employees/${id}`, {
                method: "DELETE",
            });
            const data = await res.json();
            if (data.success) {
                setEmployees(prev => prev.filter(emp => emp.id !== id));
                setFilteredEmployees(prev => prev.filter(emp => emp.id !== id));
                alert("Employee deleted successfully.");
            } else {
                alert("Failed to delete employee.");
            }
        } catch (err) {
            console.error(err);
            alert("An error occurred while deleting the employee.");
        } finally {
            setConfirmDelete({ id: null, open: false });
        }
    };

    const handleSave = async () => {
        if (!selectedEmployee) return;

        const formData = new FormData();
        formData.append("first_Name", selectedEmployee.first_Name);
        formData.append("last_Name", selectedEmployee.last_Name);
        formData.append("email", selectedEmployee.email);
        formData.append("phone_Number", selectedEmployee.phone_Number);
        formData.append("address", selectedEmployee.address);

        if (newImage) {
            formData.append("profile_Image", newImage);
        }

        try {
            setUploading(true);
            const res = await fetch(`http://localhost:5010/api/employees/${selectedEmployee.id}`, {
                method: "PUT",
                body: formData,
            });
            const data = await res.json();
            if (data.success) {
                await fetchEmployees(); // Refresh list
                setIsModalOpen(false);
                alert("Employee updated successfully.");
            } else {
                alert("Failed to update employee.");
            }
        } catch (err) {
            console.error(err);
            alert("An error occurred while updating the employee.");
        } finally {
            setUploading(false);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setNewImage(file);
            setUploading(true);
            setTimeout(() => setUploading(false), 1000); // simulate preview/loading delay
        }
    };

    const handleRemoveImage = () => {
        setNewImage(null);
    };

    const columns = [
        {
            name: "Profile Image",
            selector: row => (
                <img
                    src={`http://localhost:5010/${row.profile_Image}`}
                    alt="Profile"
                    className="h-12 w-12 rounded-full object-cover cursor-pointer transition-transform duration-200 hover:scale-105"
                    onClick={() => setFullscreenImage(`http://localhost:5010/${row.profile_Image}`)}
                />
            ),
        },
        {
            name: "Name",
            selector: row => `${row.first_Name} ${row.last_Name}`,
            sortable: true,
        },
        {
            name: "Email",
            selector: row => row.email,
            sortable: true,
        },
        {
            name: "Phone",
            selector: row => row.phone_Number,
        },
        {
            name: "Address",
            selector: row => row.address,
            wrap: true,
        },
        {
            name: "Actions",
            cell: (row) => (
                <div className="flex gap-2">
                    <button
                        onClick={() => handleEdit(row)}
                        className="bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600"
                    >
                        Edit
                    </button>
                    <button
                        onClick={() => setConfirmDelete({ id: row.id, open: true })}
                        className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600"
                    >
                        Delete
                    </button>
                </div>
            ),
        },
    ];

    return (
        <div className="p-8 bg-white min-h-screen">
            <div className="max-w-7xl mx-auto bg-blue-200 p-6 rounded-xl shadow-2xl border border-gray-200 hover:shadow-purple-300 transition-shadow duration-300">
                <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
                    <h2 className="text-3xl font-extrabold text-red text-center sm:text-left">
                        Employee Directory
                    </h2>
                    <input
                        type="text"
                        placeholder="Search employees..."
                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-400 w-full sm:w-72"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <DataTable
                    columns={columns}
                    data={filteredEmployees}
                    progressPending={loading}
                    pagination
                    highlightOnHover
                    responsive
                    striped
                    customStyles={{
                        headCells: {
                            style: {
                                fontWeight: "bold",
                                fontSize: "16px",
                                color: "white",
                                backgroundColor: "black",
                            },
                        },
                        rows: {
                            style: {
                                fontSize: "15px",
                            },
                        },
                    }}
                />
            </div>

            {/* Fullscreen Image Modal */}
            {fullscreenImage && (
                <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
                    <div className="relative">
                        <img
                            src={fullscreenImage}
                            alt="Full view"
                            className="max-h-[90vh] max-w-[90vw] rounded-lg shadow-lg"
                        />
                        <button
                            className="absolute top-2 right-2 text-white bg-red-500 hover:bg-red-600 p-2 rounded-full text-xl"
                            onClick={() => setFullscreenImage(null)}
                        >
                            &times;
                        </button>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {isModalOpen && selectedEmployee && (
                <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full relative">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-2 right-2 text-4xl text-gray-500 hover:text-gray-700"
                        >
                            &times;
                        </button>
                        <h2 className="text-2xl font-bold mb-4">Edit Employee</h2>

                        {/* Image */}
                        <div className="mb-4 text-center">
                            <p className="text-gray-600 mb-2 font-semibold">Current Image</p>
                            <img
                                src={
                                    newImage
                                        ? URL.createObjectURL(newImage)
                                        : `http://localhost:5010/${selectedEmployee.profile_Image}`
                                }
                                alt="Preview"
                                className="h-24 w-24 rounded-full object-cover border-2 border-yellow-300 mx-auto"
                            />
                            {uploading && <p className="text-blue-500 mt-2">Loading image preview...</p>}
                        </div>

                        <div className="mb-4 flex gap-4">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="w-full border px-4 py-2 bg-yellow-100 rounded-lg"
                            />
                            {newImage && (
                                <button
                                    onClick={handleRemoveImage}
                                    className="bg-red-500 text-white px-2 py-1 rounded-lg hover:bg-red-600"
                                >
                                    Remove
                                </button>
                            )}
                        </div>

                        {/* Form */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <input
                                type="text"
                                className="col-span-1 px-4 py-2 border bg-yellow-100 rounded-lg"
                                value={selectedEmployee.first_Name}
                                onChange={(e) =>
                                    setSelectedEmployee({ ...selectedEmployee, first_Name: e.target.value })
                                }
                            />
                            <input
                                type="text"
                                className="col-span-1 px-4 py-2 border bg-yellow-100 rounded-lg"
                                value={selectedEmployee.last_Name}
                                onChange={(e) =>
                                    setSelectedEmployee({ ...selectedEmployee, last_Name: e.target.value })
                                }
                            />
                        </div>
                        <input
                            type="email"
                            className="w-full mb-4 px-4 py-2 border bg-yellow-100 rounded-lg"
                            value={selectedEmployee.email}
                            onChange={(e) =>
                                setSelectedEmployee({ ...selectedEmployee, email: e.target.value })
                            }
                        />
                        <input
                            type="text"
                            className="w-full mb-4 px-4 py-2 border bg-yellow-100 rounded-lg"
                            value={selectedEmployee.phone_Number}
                            onChange={(e) =>
                                setSelectedEmployee({ ...selectedEmployee, phone_Number: e.target.value })
                            }
                        />
                        <input
                            type="text"
                            className="w-full mb-4 px-4 py-2 border bg-yellow-100 rounded-lg"
                            value={selectedEmployee.address}
                            onChange={(e) =>
                                setSelectedEmployee({ ...selectedEmployee, address: e.target.value })
                            }
                        />

                        <div className="flex justify-end gap-4">
                            <button
                                onClick={handleSave}
                                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                                disabled={uploading}
                            >
                                {uploading ? "Saving..." : "Save"}
                            </button>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {confirmDelete.open && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-md text-center">
                        <h3 className="text-xl font-semibold mb-4">Are you sure you want to delete?</h3>
                        <div className="flex justify-center gap-4">
                            <button
                                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
                                onClick={() => handleDelete(confirmDelete.id)}
                            >
                                Yes, Delete
                            </button>
                            <button
                                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                                onClick={() => setConfirmDelete({ id: null, open: false })}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployeeList;
