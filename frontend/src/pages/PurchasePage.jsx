import React, { useState, useEffect } from "react";
import { VscSettingsGear } from "react-icons/vsc";
import { useNavigate } from 'react-router-dom';
import { FaTimes } from 'react-icons/fa';

export default function PurchasePage() {
    const [selectedIndex, setSelectedIndex] = useState(null);
    const [items, setItems] = useState([]);
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
    const [billNumber, setBillNumber] = useState("");
    const [errors, setErrors] = useState({});
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

    const handleAddItem = () => {
        setItems([
            ...items,
            {
                name: "",
                pack: "",
                batch: "",
                expiry: "",
                mrp: "",
                ptr: "",
                qty: "",
                free: "0",
                schAmt: "0",
                disc: "",
                base: "",
                gst: "",
                amount: "",
            },
        ]);
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
    };

    const validateForm = () => {
        const newErrors = {};
        
        if (!distributor) newErrors.distributor = "Distributor is required";
        if (!billNumber) newErrors.billNumber = "Bill number is required";
        if (!createdBy) newErrors.createdBy = "Owner is required";
        if (!paymentType) newErrors.paymentType = "Payment type is required";
        
        // Check for empty rows
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

    const handleSavePurchase = async () => {
        if (!validateForm()) {
            alert("Please fill all required fields and ensure all items are complete");
            return;
        }

        // Check for any empty rows
        if (items.some(item => !item.name || !item.mrp || !item.qty || !item.disc || !item.gst)) {
            alert("Please complete all item details before saving");
            return;
        }

        const payload = {
            DistributorName: distributor,
            BillNumber: billNumber,
            BillDate: billDate,
            DueDate: dueDate,
            PendingAmount: totalAmount.toFixed(2),
            CreatedBy: createdBy,
            PaymentType: paymentType,
            Status: "Pending",
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
            })),
        };
    
        try {
            const response = await fetch("http://localhost:5010/api/purchases", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });
    
            if (response.ok) {
                const data = await response.json();
                const purchaseID = data.purchaseID;
                alert("Purchase saved successfully!");
                navigate(`/purchase-next-step/${purchaseID}`);
                console.log(data);
            } else {
                const errorData = await response.json();
                alert("Failed to save purchase");
                console.error(errorData);
            }
        } catch (error) {
            console.error("Error saving purchase:", error);
            alert("Something went wrong while saving purchase");
        }
    };

    return (
        <div className="p-4 bg-[#f1f5f9] min-h-screen font-sans">
            <div className="flex justify-end items-center mb-4 gap-2">
                <div className="flex items-center gap-4 bg-white p-2 rounded shadow border border-gray-200">
                    <select
                        value={createdBy}
                        onChange={(e) => setCreatedBy(e.target.value)}
                        className={`border ${errors.createdBy ? 'border-red-500' : 'border-gray-300'} rounded px-2 py-1 text-sm text-gray-700`}
                    >
                        <option value="">Owner</option>
                        <option value="Rajesh">Rajesh</option>
                        <option value="Sourav">Sourav</option>
                    </select>
                    {errors.createdBy && <span className="text-red-500 text-xs">{errors.createdBy}</span>}
                    
                    <select
                        value={paymentType}
                        onChange={(e) => setPaymentType(e.target.value)}
                        className={`border ${errors.paymentType ? 'border-red-500' : 'border-gray-300'} rounded px-2 py-1 text-sm text-gray-700`}
                    >
                        <option value="">Select Payment</option>
                        <option value="Online">Online</option>
                        <option value="Offline">Offline</option>
                    </select>
                    {errors.paymentType && <span className="text-red-500 text-xs">{errors.paymentType}</span>}
                    
                    <select className="border border-gray-300 rounded px-2 py-1 text-sm text-gray-700">
                        <option value="">Save</option>
                        <option value="option5">Save As Draft</option>
                        <option value="option6">Save And Exit</option>
                    </select>
                    <button className="border border-gray-300 rounded p-2 hover:bg-yellow-700 bg-blue-200">
                        <VscSettingsGear />
                    </button>
                </div>
            </div>

            {/* Top Section */}
            <div className="bg-white p-4 shadow rounded-md mb-4 border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2 items-start">
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
                        <label className="text-sm text-gray-700">Bill No.</label>
                        <input
                            className={`w-full border ${errors.billNumber ? 'border-red-500' : 'border-gray-300'} rounded px-2 py-1 text-sm`}
                            type="text"
                            placeholder="Bill Number"
                            value={billNumber}
                            onChange={(e) => setBillNumber(e.target.value)}
                        />
                        {errors.billNumber && <span className="text-red-500 text-xs">{errors.billNumber}</span>}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
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
                    </div>
                </div>

                <div className="flex justify-end">
                    <div className="text-red-500 text-sm font-medium">
                        {pendingCreditNoteText ?? "1 Pending Credit Notes ₹26.00"}
                    </div>
                </div>
            </div>

            {/* Items Table */}
            <div className="bg-white p-4 shadow rounded-md border border-gray-200 overflow-auto">
                <table className="min-w-full table-fixed text-sm text-gray-700">
                    <thead className="bg-[#e8f1fb] text-gray-800">
                        {(showBulkDiscInput || showBulkGSTInput) && (
                            <tr>
                                <th colSpan={10}></th>
                                <th>
                                    {showBulkDiscInput && (
                                        <input
                                            type="number"
                                            value={bulkDisc}
                                            onChange={(e) => setBulkDisc(e.target.value)}
                                            onBlur={applyBulkDiscount}
                                            placeholder="Bulk Disc%"
                                            className="w-full border border-blue-300 rounded px-1 py-0.5 text-xs"
                                        />
                                    )}
                                </th>
                                <th></th>
                                <th>
                                    {showBulkGSTInput && (
                                        <input
                                            type="number"
                                            value={bulkGST}
                                            onChange={(e) => setBulkGST(e.target.value)}
                                            onBlur={applyBulkGST}
                                            placeholder="Bulk GST%"
                                            className="w-full border border-green-300 rounded px-1 py-0.5 text-xs"
                                        />
                                    )}
                                </th>
                                <th></th>
                            </tr>
                        )}
                        <tr>
                            <th className="border px-2 py-2 w-8">Delete</th>
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
                            ].map((head, i) => (
                                <th
                                    key={i}
                                    className={`border px-2 py-2 ${head === "Disc%" || head === "GST%" ? "cursor-pointer" : ""
                                        } ${head === "Disc%" ? "bg-[#EE82EE] hover:bg-[#000080] hover:text-white" : ""
                                        } ${head === "GST%" ? "bg-[#FF8C00] hover:bg-[#800000] hover:text-white" : ""}`}
                                    onClick={() =>
                                        head === "Disc%" ? setShowBulkDiscInput(!showBulkDiscInput)
                                            : head === "GST%" ? setShowBulkGSTInput(!showBulkGSTInput)
                                                : null
                                    }
                                >
                                    {head}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, index) => (
                            <tr
                                key={index}
                                className={`border text-sm ${selectedIndex === index
                                    ? "bg-blue-100"
                                    : "hover:bg-blue-50 cursor-pointer"
                                    }`}
                                onClick={() => handleRowClick(index)}
                            >
                                <td className="border px-1 py-1 text-center">
                                    {selectedIndex === index && (
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteItem(index);
                                            }}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            <FaTimes />
                                        </button>
                                    )}
                                </td>
                                {[
                                    "name",
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
                                    <td className="border px-2 py-1" key={i}>
                                        {selectedIndex === index ? (
                                            <input
                                                className={`w-full border ${!item[field] && errors[`item_${index}`] ? 'border-red-500' : 'border-gray-300'} rounded px-1 py-0.5 text-xs`}
                                                value={item[field]}
                                                onChange={(e) =>
                                                    handleInputChange(index, field, e.target.value)
                                                }
                                                placeholder={field === "expiry" ? "MMYY" : undefined}
                                            />
                                        ) : field === "mrp" || field === "amount" ? (
                                            `₹${item[field]}`
                                        ) : (
                                            item[field]
                                        )}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>

                {items.length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                        No items added yet. Click "Add Item" to start.
                    </div>
                )}

                <div className="text-right mt-4 font-semibold text-md text-gray-800">
                    Total: ₹{totalAmount.toFixed(2)}
                </div>

                <div className="flex justify-between items-center mt-4">
                    <button
                        onClick={handleAddItem}
                        className="px-4 py-2 bg-[#1976d2] text-white rounded hover:bg-[#155fa0] text-sm"
                    >
                        Add Item
                    </button>
                    <button
                        onClick={handleSavePurchase}
                        disabled={items.length === 0}
                        className={`px-6 py-2 ${items.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'} text-white rounded text-sm`}
                    >
                        Save & Next
                    </button>
                </div>
            </div>
        </div>
    );
}