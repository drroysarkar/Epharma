import React, { useState } from "react";
import { X } from "lucide-react";

const Invoice = () => {
  // State for editable fields
  const [company, setCompany] = useState({
    name: "My Company",
    phone: "9142951380",
  });
  const [billTo, setBillTo] = useState({
    name: "Sarkar",
    address: "Lucknow",
    contact: "9545120325",
    state: "09-Uttar Pradesh",
  });
  const [invoiceDetails, setInvoiceDetails] = useState({
    no: "2",
    date: "21/04/2025",
    placeOfSupply: "09-Uttar Pradesh",
  });
  const [items, setItems] = useState([
    { id: 1, name: "Sample Item", hsn: "", quantity: 1, price: 100.0, gstRate: 3, gstAmount: 3.0, amount: 103.0 },
    { id: 2, name: "Sample Item", hsn: "", quantity: 1, price: 100.0, gstRate: 3, gstAmount: 3.0, amount: 103.0 },
  ]);
  const [taxSummary, setTaxSummary] = useState({
    taxableAmount: 200.0,
    cgstRate: 1.5,
    cgstAmount: 3.0,
    sgstRate: 1.5,
    sgstAmount: 3.0,
    totalTax: 6.0,
    subTotal: 206.0,
    total: 206.0,
    totalInWords: "Two Hundred Six Rupees only",
  });

  const printInvoice = () => {
    window.print();
  };

  // Handle changes for company details
  const handleCompanyChange = (field, value) => {
    setCompany({ ...company, [field]: value });
  };

  // Handle changes for bill to details
  const handleBillToChange = (field, value) => {
    setBillTo({ ...billTo, [field]: value });
  };

  // Handle changes for invoice details
  const handleInvoiceDetailsChange = (field, value) => {
    setInvoiceDetails({ ...invoiceDetails, [field]: value });
  };

  // Handle changes for item fields
  const handleItemChange = (id, field, value) => {
    const updatedItems = items.map((item) => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        if (field === "price" || field === "quantity" || field === "gstRate") {
          const price = field === "price" ? parseFloat(value) : item.price;
          const quantity = field === "quantity" ? parseInt(value) : item.quantity;
          const gstRate = field === "gstRate" ? parseFloat(value) : item.gstRate;
          updatedItem.gstAmount = ((price * quantity * gstRate) / 100).toFixed(2);
          updatedItem.amount = (price * quantity + parseFloat(updatedItem.gstAmount)).toFixed(2);
        }
        return updatedItem;
      }
      return item;
    });
    setItems(updatedItems);
    updateTaxSummary(updatedItems);
  };

  // Remove item
  const removeItem = (id) => {
    const updatedItems = items.filter((item) => item.id !== id);
    setItems(updatedItems);
    updateTaxSummary(updatedItems);
  };

  // Update tax summary based on items
  const updateTaxSummary = (updatedItems) => {
    const taxableAmount = updatedItems
      .reduce((sum, item) => sum + item.price * item.quantity, 0)
      .toFixed(2);
    const totalTax = updatedItems
      .reduce((sum, item) => sum + parseFloat(item.gstAmount), 0)
      .toFixed(2);
    const total = (parseFloat(taxableAmount) + parseFloat(totalTax)).toFixed(2);
    setTaxSummary({
      ...taxSummary,
      taxableAmount,
      cgstAmount: (parseFloat(totalTax) / 2).toFixed(2),
      sgstAmount: (parseFloat(totalTax) / 2).toFixed(2),
      totalTax,
      subTotal: total,
      total,
      totalInWords: numberToWords(total),
    });
  };

  // Convert number to words (simplified for demo)
  const numberToWords = (num) => {
    return "Two Hundred Six Rupees only"; // Placeholder
  };

  // Add new item
  const addItem = () => {
    const newItem = {
      id: items.length + 1,
      name: "Sample Item",
      hsn: "",
      quantity: 1,
      price: 100.0,
      gstRate: 3,
      gstAmount: 3.0,
      amount: 103.0,
    };
    const updatedItems = [...items, newItem];
    setItems(updatedItems);
    updateTaxSummary(updatedItems);
  };

  return (
    <>
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            .invoice-container, .invoice-container * {
              visibility: visible;
            }
            .invoice-container {
              position: absolute;
              top: 0;
              left: 0;
              width: 210mm;
              height: 297mm;
              margin: 0 !important;
              padding: 10mm !important;
              box-shadow: none !important;
              font-size: 10pt;
              transform: scale(0.95); /* Slight scaling to fit content */
              transform-origin: top left;
            }
            .no-print, .sidebar, nav, header, footer {
              display: none !important;
            }
            input {
              border: none !important;
              background: transparent !important;
              pointer-events: none;
              appearance: none;
              -webkit-appearance: none;
              -moz-appearance: none;
            }
            table {
              page-break-inside: avoid;
              break-inside: avoid;
            }
            tr {
              page-break-inside: avoid;
              break-inside: avoid;
            }
            @page {
              size: A4;
              margin: 0;
            }
          }
          .invoice-container {
            font-size: 12pt;
          }
          table tbody tr {
            height: 20px; /* Reduced row height */
          }
          input {
            font-size: 10pt;
            padding: 1px;
          }
          th, td {
            padding: 4px !important; /* Reduced padding */
          }
        `}
      </style>
      <div className="invoice-container bg-white p-6 shadow-lg max-w-4xl w-full mx-auto my-4">
        <h1 className="text-xl font-bold text-center mb-3">Tax Invoice</h1>

        {/* Company Details */}
        <div className="flex justify-between mb-4">
          <div>
            <input
              type="text"
              value={company.name}
              onChange={(e) => handleCompanyChange("name", e.target.value)}
              className="text-base font-semibold border-b border-gray-300 focus:outline-none w-48"
            />
            <div className="text-xs">
              Phone:{" "}
              <input
                type="text"
                value={company.phone}
                onChange={(e) => handleCompanyChange("phone", e.target.value)}
                className="border-b border-gray-300 focus:outline-none w-28"
              />
            </div>
          </div>
          <div className="no-print">
            <button
              onClick={printInvoice}
              className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm"
            >
              Print Invoice
            </button>
          </div>
        </div>

        {/* Bill To and Invoice Details */}
        <div className="flex justify-between mb-4">
          <div>
            <h2 className="font-semibold text-sm">Bill To:</h2>
            <input
              type="text"
              value={billTo.name}
              onChange={(e) => handleBillToChange("name", e.target.value)}
              className="border-b border-gray-300 focus:outline-none w-36 text-xs"
            />
            <div className="text-xs">
              <input
                type="text"
                value={billTo.address}
                onChange={(e) => handleBillToChange("address", e.target.value)}
                className="border-b border-gray-300 focus:outline-none w-36"
              />
            </div>
            <div className="text-xs">
              Contact No:{" "}
              <input
                type="text"
                value={billTo.contact}
                onChange={(e) => handleBillToChange("contact", e.target.value)}
                className="border-b border-gray-300 focus:outline-none w-28"
              />
            </div>
            <div className="text-xs">
              State:{" "}
              <input
                type="text"
                value={billTo.state}
                onChange={(e) => handleBillToChange("state", e.target.value)}
                className="border-b border-gray-300 focus:outline-none w-36"
              />
            </div>
          </div>
          <div>
            <h2 className="font-semibold text-sm">Invoice Details:</h2>
            <div className="text-xs">
              No:{" "}
              <input
                type="text"
                value={invoiceDetails.no}
                onChange={(e) => handleInvoiceDetailsChange("no", e.target.value)}
                className="border-b border-gray-300 focus:outline-none w-16"
              />
            </div>
            <div className="text-xs">
              Date:{" "}
              <input
                type="text"
                value={invoiceDetails.date}
                onChange={(e) => handleInvoiceDetailsChange("date", e.target.value)}
                className="border-b border-gray-300 focus:outline-none w-28"
              />
            </div>
            <div className="text-xs">
              Place Of Supply:{" "}
              <input
                type="text"
                value={invoiceDetails.placeOfSupply}
                onChange={(e) => handleInvoiceDetailsChange("placeOfSupply", e.target.value)}
                className="border-b border-gray-300 focus:outline-none w-36"
              />
            </div>
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full border-collapse mb-4">
          <thead>
            <tr className="bg-gray-200 text-xs">
              <th className="border p-1 text-left">#</th>
              <th className="border p-1 text-left">Item name</th>
              <th className="border p-1 text-left">HSN/SAC</th>
              <th className="border p-1 text-left">Qty</th>
              <th className="border p-1 text-left">Price/Unit(₹)</th>
              <th className="border p-1 text-left">GST(₹)</th>
              <th className="border p-1 text-left">Amount(₹)</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={item.id} className="group text-xs">
                <td className="border p-1 relative group">
                  <span className="group-hover:hidden">{index + 1}</span>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="absolute right-1 transform -translate-y-1/2 hidden group-hover:block text-red-500 hover:text-red-700"
                    title="Remove Item"
                  >
                    <X size={16} strokeWidth={3} />
                  </button>
                </td>
                <td className="border p-1">
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => handleItemChange(item.id, "name", e.target.value)}
                    className="w-full focus:outline-none text-xs"
                  />
                </td>
                <td className="border p-1">
                  <input
                    type="text"
                    value={item.hsn}
                    onChange={(e) => handleItemChange(item.id, "hsn", e.target.value)}
                    className="w-full focus:outline-none text-xs"
                  />
                </td>
                <td className="border p-1">
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(item.id, "quantity", e.target.value)}
                    className="w-full focus:outline-none text-xs"
                  />
                </td>
                <td className="border p-1">
                  <input
                    type="number"
                    value={item.price}
                    onChange={(e) => handleItemChange(item.id, "price", e.target.value)}
                    className="w-full focus:outline-none text-xs"
                  />
                </td>
                <td className="border p-1">
                  <input
                    type="number"
                    value={item.gstRate}
                    onChange={(e) => handleItemChange(item.id, "gstRate", e.target.value)}
                    className="w-10 focus:outline-none text-xs"
                  />
                  % (₹{item.gstAmount})
                </td>
                <td className="border p-1">₹{item.amount}</td>
              </tr>
            ))}
            <tr className="font-semibold text-xs">
              <td className="border p-1" colSpan="3">
                Total
              </td>
              <td className="border p-1">{items.reduce((sum, item) => sum + item.quantity, 0)}</td>
              <td className="border p-1"></td>
              <td className="border p-1">₹{taxSummary.totalTax}</td>
              <td className="border p-1">₹{taxSummary.total}</td>
            </tr>
          </tbody>
        </table>

        <button
          onClick={addItem}
          className="no-print bg-blue-500 text-white px-3 py-1 rounded mb-4 hover:bg-blue-600 text-sm"
        >
          Add Item
        </button>

        {/* Tax Summary and Totals */}
        <div className="flex justify-between">
          <div>
            <h2 className="font-semibold text-sm mb-1">Tax Summary:</h2>
            <table className="border-collapse text-xs">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border p-1 text-left">HSN/SAC</th>
                  <th className="border p-1 text-left">Taxable amt (₹)</th>
                  <th className="border p-1 text-left" colSpan="2">
                    GST
                  </th>
                  <th className="border p-1 text-left">Total</th>
                </tr>
                <tr className="bg-gray-200">
                  <th className="border p-1"></th>
                  <th className="border p-1"></th>
                  <th className="border p-1">Rate (%)</th>
                  <th className="border p-1">Amt (₹)</th>
                  <th className="border p-1"></th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border p-1"></td>
                  <td className="border p-1">₹{taxSummary.taxableAmount}</td>
                  <td className="border p-1">{taxSummary.cgstRate}</td>
                  <td className="border p-1">{taxSummary.cgstAmount}</td>
                  <td className="border p-1" rowSpan="2">
                    ₹{taxSummary.totalTax}
                  </td>
                </tr>
                <tr>
                  <td className="border p-1"></td>
                  <td className="border p-1"></td>
                  <td className="border p-1">{taxSummary.sgstRate}</td>
                  <td className="border p-1">{taxSummary.sgstAmount}</td>
                </tr>
                <tr className="font-semibold">
                  <td className="border p-1" colSpan="2">
                    TOTAL
                  </td>
                  <td className="border p-1"></td>
                  <td className="border p-1">₹{taxSummary.totalTax}</td>
                  <td className="border p-1"></td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="text-right text-xs">
            <div className="mb-1">
              Sub Total: <span className="font-semibold">₹{taxSummary.subTotal}</span>
            </div>
            <div className="mb-1">
              Total: <span className="font-semibold">₹{taxSummary.total}</span>
            </div>
            <div className="text-xs italic">{taxSummary.totalInWords}</div>
          </div>
        </div>

        {/* Terms & Conditions */}
        <div className="mt-4 text-xs">
          <h2 className="font-semibold">Terms & Conditions:</h2>
          <p>Thanks for doing business with us!</p>
        </div>

        {/* Authorized Signatory */}
        <div className="mt-3 text-right text-xs">
          <p>For {company.name}:</p>
          <p>Authorized Signatory</p>
        </div>
      </div>
    </>
  );
};

export default Invoice;