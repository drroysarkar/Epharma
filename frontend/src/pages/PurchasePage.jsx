import React, { useState, useEffect, useRef } from "react";
import { VscSettingsGear } from "react-icons/vsc";
import { useNavigate } from 'react-router-dom';
import { FaTimes } from 'react-icons/fa';
import { debounce } from 'lodash';
import Papa from 'papaparse';
import { searchMedicines, createPurchase } from '../services/purchaseService'; // Import API service functions

export default function PurchasePage() {
    const [selectedIndex, setSelectedIndex] = useState(null);
    const [items, setItems] = useState([]);
    const [newItemName, setNewItemName] = useState("");
    const [bulkDisc, setBulkDisc] = useState("");
    const [bulkGST, setBulkGST] = useState("");
    const [showBulkDiscInput, setShowBulkDiscInput] = useState(false);
    const [showBulkGSTInput, setShowBulkGSTInput] = useState(false);
    const [billDate, setBillDate] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [noteCount, setNoteCount] = useState(1);
    const [noteAmount, setNoteAmount] = useState(26.0);
    const [createdBy, setCreatedBy] = useState("");
    const [paymentType, setPaymentType] = useState("");
    const [distributor, setDistributor] = useState("");
    const [medicineSuggestions, setMedicineSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isCsvLoading, setIsCsvLoading] = useState(false);
    const [isCsvImported, setIsCsvImported] = useState(false);
    const [selectedMedicine, setSelectedMedicine] = useState(null);
    const suggestionsRef = useRef(null);
    const discHeaderRef = useRef(null);
    const gstHeaderRef = useRef(null);
    const [errors, setErrors] = useState({});
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [modalData, setModalData] = useState({
        payName: "",
        paidAmount: "",
        tsNum: ""
    });
    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const today = new Date();
        const due = new Date();
        due.setDate(today.getDate() + 7);
        setBillDate(today.toISOString().split("T")[0]);
        setDueDate(due.toISOString().split("T")[0]);
    }, []);

    const handleRowClick = (index) => setSelectedIndex(index);

    const calculateAmount = (mrp, disc, gst) => {
        const m = parseFloat(mrp) || 0;
        const d = parseFloat(disc) || 0;
        const g = parseFloat(gst) || 0;
        const base = m - (m * d) / 100;
        const amount = base + (base * g) / 100;
        return amount.toFixed(2);
    };

    const handleInputChange = (index, field, value) => {
        const updatedItems = [...items];

        if (field === "expiry") {
            let cleaned = value.replace("/", "");
            if (!/^\d{0,4}$/.test(cleaned)) return;
            value = cleaned.length === 4 ? cleaned.replace(/^(\d{2})(\d{2})$/, "$1/$2") : cleaned;
        }

        if (field === "disc" && parseFloat(value) >= 50) {
            alert("You are giving Discount more or equal to 50%");
            value = "";
        }

        if (field === "gst" && parseFloat(value) > 18) {
            alert("GST cannot be more than 18%");
            value = "";
        }

        const numericFields = ["qty", "free", "mrp", "ptr", "disc", "gst", "schAmt"];
        if (numericFields.includes(field)) {
            value = value.replace(/^0+(?!$)/, "");
        }

        updatedItems[index][field] = value;

        if (["mrp", "disc", "gst"].includes(field)) {
            const { mrp, disc, gst } = updatedItems[index];
            updatedItems[index].amount = calculateAmount(mrp, disc, gst);
        }

        setItems(updatedItems);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const searchMedicinesDebounced = debounce(async (query) => {
        if (query.length < 3) {
            setMedicineSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        setIsLoading(true);
        try {
            const data = await searchMedicines(query);
            setMedicineSuggestions(data);
            setShowSuggestions(true);
        } catch (error) {
            console.error('Error searching medicines:', error);
            setMedicineSuggestions([]);
            setShowSuggestions(false);
            alert('Failed to fetch medicine suggestions. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, 300);

    const handleDrugNameChange = (e) => {
        const value = e.target.value;
        setNewItemName(value);
        setSelectedMedicine(null);
        searchMedicinesDebounced(value);
    };

    const handleSelectMedicine = (medicine) => {
        setNewItemName(medicine.name);
        setSelectedMedicine(medicine);
        setShowSuggestions(false);
    };

    const handleAddItem = () => {
        if (!newItemName) {
            alert("Please enter a medicine name");
            return;
        }

        if (!selectedMedicine) {
            alert("Please select a medicine from the suggestions");
            return;
        }

        setItems([
            ...items,
            {
                name: newItemName,
                pack: selectedMedicine.pack_size_label || "",
                batch: "",
                expiry: "",
                mrp: selectedMedicine.price || "",
                ptr: "",
                qty: "",
                free: "0",
                schAmt: "0",
                disc: "",
                base: "",
                gst: "",
                amount: "",
                medicineId: selectedMedicine.id
            },
        ]);
        setNewItemName("");
        setSelectedMedicine(null);
        setMedicineSuggestions([]);
        setSelectedIndex(items.length);
    };

    const handleDeleteItem = (index) => {
        const updatedItems = items.filter((_, i) => i !== index);
        setItems(updatedItems);
        setSelectedIndex(null);
    };

    const applyBulkDiscount = () => {
        if (parseFloat(bulkDisc) >= 50) {
            alert("You are giving Discount more or equal to 50%");
            setBulkDisc("");
            return;
        }

        const updatedItems = items.map((item) => {
            const disc = bulkDisc;
            const mrp = item.mrp;
            const gst = item.gst;
            return {
                ...item,
                disc,
                amount: calculateAmount(mrp, disc, gst),
            };
        });
        setItems(updatedItems);
        setBulkDisc("");
        setShowBulkDiscInput(false);
    };

    const applyBulkGST = () => {
        if (parseFloat(bulkGST) > 18) {
            alert("GST cannot be more than 18%");
            setBulkGST("");
            return;
        }

        const updatedItems = items.map((item) => {
            const gst = bulkGST;
            const mrp = item.mrp;
            const disc = item.disc;
            return {
                ...item,
                gst,
                amount: calculateAmount(mrp, disc, gst),
            };
        });
        setItems(updatedItems);
        setBulkGST("");
        setShowBulkGSTInput(false);
    };

    const validateForm = () => {
        const newErrors = {};

        if (!distributor) newErrors.distributor = "Distributor is required";
        if (!createdBy) newErrors.createdBy = "Owner is required";
        if (!paymentType) newErrors.paymentType = "Payment type is required";

        items.forEach((item, index) => {
            if (!item.name || !item.mrp || !item.qty || !item.disc || !item.gst) {
                newErrors[`item_${index}`] = "Please fill all item fields";
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const totalAmount = items.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
    const pendingCreditNoteText = `${noteCount} Pending Credit Notes ₹${noteAmount.toFixed(2)}`;

    const handleModalInputChange = (field, value) => {
        setModalData((prev) => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSavePurchase = () => {
        if (!validateForm()) {
            alert("Please fill all required fields and ensure all items are complete");
            return;
        }

        if (items.some(item => !item.name || !item.mrp || !item.qty || !item.disc || !item.gst)) {
            alert("Please complete all item details before saving");
            return;
        }

        if (paymentType) {
            setShowPaymentModal(true);
        } else {
            alert("Please select a payment type");
        }
    };

    const handleModalSubmit = async () => {
        const { payName, paidAmount, tsNum } = modalData;
        const parsedPaidAmount = parseFloat(paidAmount) || 0;

        if (parsedPaidAmount > totalAmount) {
            alert("Paid amount cannot exceed total amount");
            return;
        }

        const pendingAmount = (totalAmount - parsedPaidAmount).toFixed(2);

        let status;
        if (pendingAmount == totalAmount) {
            status = "Pending";
        } else if (pendingAmount > 0) {
            status = "Due";
        } else {
            status = "Paid";
        }

        const payload = {
            DistributorName: distributor,
            BillDate: billDate,
            DueDate: dueDate,
            PaidAmount: parsedPaidAmount.toFixed(2),
            PendingAmount: pendingAmount,
            CreatedBy: createdBy,
            PaymentType: paymentType,
            PayName: payName,
            TsNum: tsNum,
            Status: status,
            PurchaseItems: items.map((item) => ({
                ItemName: item.name,
                ItemLocation: "",
                HSNCode: "",
                Pack: item.pack,
                Batch: item.batch,
                Expiry: item.expiry,
                MRP: parseFloat(item.mrp) || 0,
                PTR: parseFloat(item.ptr) || 0,
                Quantity: parseInt(item.qty) || 0,
                Free: parseInt(item.free) || 0,
                SchAmt: parseFloat(item.schAmt) || 0,
                Discount: parseFloat(item.disc) || 0,
                Is_DiscLocked: false,
                Base: parseFloat(item.base) || 0,
                GST: parseFloat(item.gst) || 0,
                NetAmount: parseFloat(item.amount) || 0,
                medicineId: item.medicineId
            })),
        };

        try {
            const data = await createPurchase(payload);
            const purchaseID = data.purchaseID;
            const billNumber = data.billNumber;
            alert(`Purchase saved successfully! Bill Number: ${billNumber}`);
            navigate(`/purchase-next-step/${purchaseID}`);
            setShowPaymentModal(false);
            setModalData({ payName: "", paidAmount: "", tsNum: "" });
        } catch (error) {
            console.error("Error saving purchase:", error);
            alert("Something went wrong while saving purchase. Please try again.");
        }
    };

    const handleImportCSV = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setIsCsvLoading(true);
        Papa.parse(file, {
            complete: (result) => {
                const newItems = result.data.slice(1).map(row => ({
                    name: row[0] || "",
                    pack: row[1] || "",
                    batch: row[2] || "",
                    expiry: row[3] || "",
                    mrp: row[4] || "",
                    ptr: row[5] || "",
                    qty: row[6] || "",
                    free: row[7] || "0",
                    schAmt: row[8] || "0",
                    disc: row[9] || "",
                    base: row[10] || "",
                    gst: row[11] || "",
                    amount: calculateAmount(row[4], row[9], row[11]),
                    medicineId: row[12] || ""
                })).filter(item => item.name); // Filter out rows with no name

                setItems([...items, ...newItems]);
                setIsCsvImported(true);
                setSelectedIndex(null);
                fileInputRef.current.value = null; // Reset file input
                setIsCsvLoading(false);
            },
            error: (error) => {
                console.error("Error parsing CSV:", error);
                alert("Failed to parse CSV file");
                setIsCsvLoading(false);
                fileInputRef.current.value = null;
            },
            header: false,
            skipEmptyLines: true,
        });
    };

    const handleClearCSV = () => {
        setItems([]);
        setIsCsvImported(false);
        setSelectedIndex(null);
    };

    return (
        <div className="p-4 bg-[#f1f5f9] min-h-screen font-sans">
            <div className="flex justify-end items-center mb-4 gap-2">
                <div className="flex items-center gap-4 bg-white p-2 rounded shadow border border-gray-200">
                    <button
                        onClick={() => fileInputRef.current.click()}
                        className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm"
                    >
                        Import CSV
                    </button>
                    <input
                        type="file"
                        accept=".csv"
                        ref={fileInputRef}
                        onChange={handleImportCSV}
                        className="hidden"
                    />
                    <select
                        value={createdBy}
                        onChange={(e) => setCreatedBy(e.target.value)}
                        className={`border ${errors.createdBy ? 'border-red-500' : 'border-gray-300'} rounded px-2 py-1 text-sm text-gray-700 w-32`}
                    >
                        <option value="">Select Member</option>
                        <option value="Rajesh">Rajesh</option>
                        <option value="Sourav">Sourav</option>
                    </select>
                    {errors.createdBy && <span className="text-red-500 text-xs">{errors.createdBy}</span>}

                    <select
                        value={paymentType}
                        onChange={(e) => setPaymentType(e.target.value)}
                        className={`border ${errors.paymentType ? 'border-red-500' : 'border-gray-300'} rounded px-2 py-1 text-sm text-gray-700 w-32`}
                    >
                        <option value="">Select Payment</option>
                        <option value="Online">Online</option>
                        <option value="Offline">Offline</option>
                    </select>
                    {errors.paymentType && <span className="text-red-500 text-xs">{errors.paymentType}</span>}

                    <button className="border border-gray-300 rounded p-2 hover:bg-yellow-700 bg-blue-200">
                        <VscSettingsGear />
                    </button>
                </div>
            </div>

            <div className="bg-white p-4 shadow rounded-md mb-4 border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-2 items-start">
                    <div>
                        <label className="text-sm text-gray-700">Distributor</label>
                        <input
                            className={`w-full border ${errors.distributor ? 'border-red-500' : 'border-gray-300'} rounded px-2 py-1 text-sm`}
                            type="text"
                            placeholder="R S M Pharma Pvt Ltd"
                            value={distributor}
                            onChange={(e) => setDistributor(e.target.value)}
                        />
                        {errors.distributor && <span className="text-red-500 text-xs">{errors.distributor}</span>}
                    </div>

                    <div>
                        <label className="text-sm text-gray-700">Bill Date</label>
                        <input
                            type="date"
                            value={billDate}
                            onChange={(e) => setBillDate(e.target.value)}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-blue-500"
                        />
                    </div>
                    <div>
                        <label className="text-sm text-gray-700">Due Date</label>
                        <input
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-blue-500"
                        />
                    </div>
                    <div>
                        <label className="text-sm text-gray-700">Pending Credit Notes</label>
                        <input
                            type="text"
                            value={pendingCreditNoteText}
                            readOnly
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm bg-gray-100 text-red-500"
                        />
                    </div>
                </div>

                <div className="mt-2">
                    <label className="text-sm text-gray-700 block mb-1">Item Name</label>
                    <div className="flex items-center gap-2 relative" ref={suggestionsRef}>
                        <div className="flex-grow relative">
                            <input
                                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                                type="text"
                                placeholder="Search medicine (min 3 characters)"
                                value={newItemName}
                                onChange={handleDrugNameChange}
                                onFocus={() => medicineSuggestions.length > 0 && setShowSuggestions(true)}
                            />
                            {isLoading && (
                                <div className="absolute z-10 w-full bg-white shadow-lg rounded-b border border-gray-300 p-2">
                                    Loading...
                                </div>
                            )}
                            {showSuggestions && medicineSuggestions.length > 0 && (
                                <div className="absolute z-10 w-full bg-white shadow-lg rounded-b border border-gray-300 max-h-60 overflow-y-auto">
                                    {medicineSuggestions.map((medicine) => (
                                        <div
                                            key={medicine.id}
                                            className="p-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100"
                                            onClick={() => handleSelectMedicine(medicine)}
                                        >
                                            <div className="font-medium">{medicine.name}</div>
                                            <div className="text-xs text-gray-600">
                                                {medicine.manufacturer_name} | {medicine.pack_size_label}
                                            </div>
                                            {medicine.short_composition1 && (
                                                <div className="text-xs text-gray-500">
                                                    {medicine.short_composition1}
                                                    {medicine.short_composition2 && ` + ${medicine.short_composition2}`}
                                                </div>
                                            )}
                                            <div className="text-xs font-semibold">
                                                MRP: ₹{medicine.price}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <button
                            onClick={handleAddItem}
                            className="px-4 py-2 bg-[#1976d2] text-white rounded hover:bg-[#155fa0] text-sm whitespace-nowrap"
                        >
                            Add Item
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white p-3 shadow rounded-md border border-gray-200 overflow-auto">
                {isCsvImported && (
                    <div className="flex justify-end mb-4">
                        <button
                            onClick={handleClearCSV}
                            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded text-sm"
                        >
                            Clear CSV
                        </button>
                    </div>
                )}

                <div className="relative">
                    {showBulkDiscInput && discHeaderRef.current && (() => {
                        const rect = discHeaderRef.current.getBoundingClientRect();
                        const tableRect = discHeaderRef.current.closest('table').getBoundingClientRect();
                        return (
                            <div
                                className="absolute z-20 w-44 bg-white border border-blue-300 rounded-lg p-2 shadow-md"
                                style={{
                                    top: '-50px',
                                    left: rect.left - tableRect.left + (rect.width / 2) - 88,
                                }}
                            >
                                <div className="flex gap-2 items-center">
                                    <input
                                        type="number"
                                        value={bulkDisc}
                                        onChange={(e) => setBulkDisc(e.target.value)}
                                        placeholder="Bulk Disc%"
                                        className="w-full border border-blue-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    />
                                    <button
                                        onClick={applyBulkDiscount}
                                        className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs"
                                    >
                                        Apply
                                    </button>
                                </div>
                            </div>
                        );
                    })()}

                    {showBulkGSTInput && gstHeaderRef.current && (() => {
                        const rect = gstHeaderRef.current.getBoundingClientRect();
                        const tableRect = gstHeaderRef.current.closest('table').getBoundingClientRect();
                        return (
                            <div
                                className="absolute z-20 w-44 bg-white border border-green-300 rounded-lg p-2 shadow-md"
                                style={{
                                    top: '-50px',
                                    left: rect.left - tableRect.left + (rect.width / 2) - 88,
                                }}
                            >
                                <div className="flex gap-2 items-center">
                                    <input
                                        type="number"
                                        value={bulkGST}
                                        onChange={(e) => setBulkGST(e.target.value)}
                                        placeholder="Bulk GST%"
                                        className="w-full border border-green-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-green-400"
                                    />
                                    <button
                                        onClick={applyBulkGST}
                                        className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs"
                                    >
                                        Apply
                                    </button>
                                </div>
                            </div>
                        );
                    })()}

                    <table className="min-w-full table-fixed text-sm text-gray-700 shadow-xl rounded-xl overflow-hidden border-2 border-gray-800 mt-10">
                        <thead>
                            <tr>
                                {[
                                    "Item Name",
                                    "Unit/Pack",
                                    "Batch",
                                    "Expiry",
                                    "MRP",
                                    "PTR",
                                    "Qty",
                                    "Free",
                                    "Sch. Amt",
                                    "Disc%",
                                    "Base",
                                    "GST%",
                                    "Amount",
                                    "Delete",
                                ].map((head, i) => (
                                    <th
                                        key={i}
                                        ref={head === "Disc%" ? discHeaderRef : head === "GST%" ? gstHeaderRef : null}
                                        className={`border border-gray-300 bg-[#f3f6fb] px-4 py-3 text-center font-semibold whitespace-nowrap ${
                                            head === "Disc%" || head === "GST%" ? "cursor-pointer" : ""
                                        } ${
                                            head === "Disc%" ? "bg-[#fceaff] hover:bg-[#4b0082] hover:text-white transition" : ""
                                        } ${
                                            head === "GST%" ? "bg-[#fff4e5] hover:bg-[#8b0000] hover:text-white transition" : ""
                                        }`}
                                        onClick={() =>
                                            head === "Disc%" ? setShowBulkDiscInput(!showBulkDiscInput) :
                                            head === "GST%" ? setShowBulkGSTInput(!showBulkGSTInput) :
                                            null
                                        }
                                    >
                                        {head}
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <tbody className="bg-white">
                            {items.map((item, index) => (
                                <tr
                                    key={index}
                                    className={`transition-all border-t border-gray-300 ${
                                        selectedIndex === index ? "bg-blue-50 ring-1 ring-blue-300" : "hover:bg-gray-50"
                                    } cursor-pointer`}
                                    onClick={() => handleRowClick(index)}
                                >
                                    <td className="border border-gray-300 px-4 py-2 font-medium whitespace-nowrap">{item.name}</td>

                                    {[
                                        "pack",
                                        "batch",
                                        "expiry",
                                        "mrp",
                                        "ptr",
                                        "qty",
                                        "free",
                                        "schAmt",
                                        "disc",
                                        "base",
                                        "gst",
                                        "amount",
                                    ].map((field, i) => (
                                        <td key={i} className="border border-gray-300 px-3 py-2 text-center font-mono">
                                            {selectedIndex === index ? (
                                                <input
                                                    className={`w-full border text-sm px-2 py-1 rounded-md ${
                                                        !item[field] && errors[`item_${index}`]
                                                            ? "border-red-500"
                                                            : "border-gray-300"
                                                    } focus:outline-none focus:ring-2 focus:ring-blue-300`}
                                                    value={item[field]}
                                                    onChange={(e) => handleInputChange(index, field, e.target.value)}
                                                    placeholder={field === "expiry" ? "MMYY" : undefined}
                                                />
                                            ) : field === "mrp" || field === "amount" ? (
                                                <span className="text-gray-800 font-semibold">₹{item[field]}</span>
                                            ) : (
                                                item[field]
                                            )}
                                        </td>
                                    ))}

                                    <td className="border border-gray-300 text-center px-2 py-2">
                                        {selectedIndex === index && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteItem(index);
                                                }}
                                                className="text-red-500 hover:text-red-700 transition"
                                                title="Delete row"
                                            >
                                                <FaTimes />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {items.length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                        No items added yet. Use the form above to add items.
                    </div>
                )}

                <div className="text-right mt-4 font-semibold text-md text-gray-800">
                    Total: ₹{totalAmount.toFixed(2)}
                </div>

                <div className="flex justify-end items-center mt-4">
                    <button
                        onClick={handleSavePurchase}
                        disabled={items.length === 0}
                        className={`px-6 py-2 ${items.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'} text-white rounded text-sm`}
                    >
                        Save & Next
                    </button>
                </div>
            </div>

            {showPaymentModal && (
                <div className="fixed inset-0 bg-[rgba(0,0,0,0.6)] flex items-center justify-center z-50 transition-opacity duration-300 ease-out">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold">
                                {paymentType === "Online" ? "Online Payment Details" : "Offline Payment Details"}
                            </h2>
                            <button
                                onClick={() => setShowPaymentModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <FaTimes />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm text-gray-700 block mb-1">
                                    {paymentType === "Online" ? "Payment App Name" : "Payment Method"}
                                </label>
                                <input
                                    type="text"
                                    value={modalData.payName}
                                    onChange={(e) => handleModalInputChange("payName", e.target.value)}
                                    placeholder={paymentType === "Online" ? "e.g., Paytm, GPay" : "e.g., Cash, Cheque"}
                                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-sm text-gray-700 block mb-1">Paid Amount</label>
                                <input
                                    type="number"
                                    value={modalData.paidAmount}
                                    onChange={(e) => handleModalInputChange("paidAmount", e.target.value)}
                                    placeholder="Enter paid amount"
                                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                                    min="0"
                                    step="0.01"
                                />
                            </div>
                            {paymentType === "Online" && (
                                <div>
                                    <label className="text-sm text-gray-700 block mb-1">Transaction Number</label>
                                    <input
                                        type="text"
                                        value={modalData.tsNum}
                                        onChange={(e) => handleModalInputChange("tsNum", e.target.value)}
                                        placeholder="Enter transaction number"
                                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                                    />
                                </div>
                            )}
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <button
                                onClick={() => {
                                    setShowPaymentModal(false);
                                    setModalData({ payName: "", paidAmount: "", tsNum: "" });
                                }}
                                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleModalSubmit}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                            >
                                Save Payment
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isCsvLoading && (
                <div className="fixed inset-0 bg-[rgba(0,0,0,0.6)] flex items-center justify-center z-50">
                    <div className="flex flex-col items-center">
                        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="mt-4 text-white text-lg">Loading CSV...</p>
                    </div>
                </div>
            )}
        </div>
    );
}