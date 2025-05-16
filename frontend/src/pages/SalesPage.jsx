import React, { useState, useEffect, useRef } from 'react';
import { VscSettingsGear } from 'react-icons/vsc';
import { useNavigate } from 'react-router-dom';
import { FaTimes } from 'react-icons/fa';
import { debounce } from 'lodash';
import { searchMedicines, searchCustomers, createSale } from '../services/saleService'; // Import API service functions

export default function SalesPage() {
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [items, setItems] = useState([]);
  const [bulkDisc, setBulkDisc] = useState('');
  const [bulkGST, setBulkGST] = useState('');
  const [showBulkDiscInput, setShowBulkDiscInput] = useState(false);
  const [showBulkGSTInput, setShowBulkGSTInput] = useState(false);
  const [billDate, setBillDate] = useState('2025-04-24');
  const [paymentDate, setPaymentDate] = useState('2025-04-24');
  const [customer, setCustomer] = useState('');
  const [Phnumber, setPhnumber] = useState('');
  const [doctor, setDoctor] = useState('');
  const [createdBy, setCreatedBy] = useState('');
  const [paymentType, setPaymentType] = useState('');
  const [drugName, setDrugName] = useState('');
  const [medicineSuggestions, setMedicineSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [errors, setErrors] = useState({});
  const [showUPIModal, setShowUPIModal] = useState(false);
  const [showOfflineModal, setShowOfflineModal] = useState(false);
  const [payAppName, setPayAppName] = useState('');
  const [tsNum, setTsNum] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [saleType, setSaleType] = useState('');
  const [looseQty, setLooseQty] = useState('');
  const [nonStripQty, setNonStripQty] = useState('');
  const [customerSuggestions, setCustomerSuggestions] = useState([]);
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
  const [isCustomerLoading, setIsCustomerLoading] = useState(false);
  const navigate = useNavigate();
  const suggestionsRef = useRef(null);
  const customerSuggestionsRef = useRef(null);

  useEffect(() => {
    const today = new Date();
    setBillDate(today.toISOString().split('T')[0]);
    setPaymentDate(today.toISOString().split('T')[0]);

    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
      if (customerSuggestionsRef.current && !customerSuggestionsRef.current.contains(event.target)) {
        setShowCustomerSuggestions(false);
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
      return;
    }

    setIsLoading(true);
    try {
      const data = await searchMedicines(query);
      setMedicineSuggestions(data);
    } catch (error) {
      console.error('Error searching medicines:', error);
      setMedicineSuggestions([]);
      alert('Failed to search medicines. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, 300);

  const searchCustomersDebounced = debounce(async (query) => {
    if (query.length < 3) {
      setCustomerSuggestions([]);
      setShowCustomerSuggestions(false);
      return;
    }

    setIsCustomerLoading(true);
    try {
      const data = await searchCustomers(query);
      setCustomerSuggestions(data);
      setShowCustomerSuggestions(true);
    } catch (error) {
      console.error('Error searching customers:', error);
      setCustomerSuggestions([]);
      setShowCustomerSuggestions(false);
      alert('Failed to search customers. Please try again.');
    } finally {
      setIsCustomerLoading(false);
    }
  }, 300);

  const handleDrugNameChange = (e) => {
    const value = e.target.value;
    setDrugName(value);
    setSelectedMedicine(null);
    setSaleType('');
    setLooseQty('');
    setNonStripQty('');

    if (value.length >= 3) {
      searchMedicinesDebounced(value);
      setShowSuggestions(true);
    } else {
      setMedicineSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handlePhoneNumberChange = (e) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) {
      setPhnumber(value);
      if (value.length >= 3) {
        searchCustomersDebounced(value);
      } else {
        setCustomerSuggestions([]);
        setShowCustomerSuggestions(false);
      }
    }
  };

  const handleSelectMedicine = (medicine) => {
    if (medicine.quantity === null || medicine.quantity === 0) {
      alert('Selected medicine is out of stock and cannot be added to the bill.');
      return;
    }
    setDrugName(medicine.name);
    setSelectedMedicine(medicine);
    setShowSuggestions(false);
  };

  const handleSelectCustomer = (customer) => {
    setCustomer(customer.name);
    setPhnumber(customer.mobile);
    setShowCustomerSuggestions(false);
    setCustomerSuggestions([]);
  };

  const handleRowClick = (index) => setSelectedIndex(index);

  const calculateAmount = (mrp, qty, disc, gst, isStrip, saleType) => {
    const m = parseFloat(mrp) || 0;
    const q = parseInt(qty) || 0;
    const d = parseFloat(disc) || 0;
    const g = parseFloat(gst) || 0;

    const base = (isStrip && saleType === 'Loose') ? m : m * q;
    const discounted = base - (base * d) / 100;
    const total = discounted + (discounted * g) / 100;
    return total.toFixed(2);
  };

  const handleAddItem = () => {
    if (!drugName || !selectedMedicine) {
      alert('Please select a medicine from the suggestions');
      return;
    }

    const isStrip = selectedMedicine.pack_size_label.toLowerCase().startsWith('strip');
    const stripSize = isStrip ? parseInt(selectedMedicine.pack_size_label.match(/\d+/)[0]) : null;

    if (isStrip && !saleType) {
      alert('Please select a sale type (Full strip or Loose)');
      return;
    }

    if (isStrip && saleType === 'Loose' && (!looseQty || parseInt(looseQty) <= 0 || parseInt(looseQty) > stripSize)) {
      alert(`Please enter a valid loose quantity (1 to ${stripSize})`);
      return;
    }

    if (!isStrip && (!nonStripQty || parseInt(nonStripQty) <= 0)) {
      alert('Please enter a valid quantity for non-strip product');
      return;
    }

    let itemPrice = selectedMedicine.price;
    let itemQty = isStrip ? (saleType === 'Loose' ? parseInt(looseQty) : 1) : parseInt(nonStripQty);

    if (isStrip && saleType === 'Loose') {
      itemPrice = (selectedMedicine.price / stripSize) * itemQty;
    }

    const isQtyFixed = isStrip && saleType === 'Loose';

    setItems([
      ...items,
      {
        name: drugName,
        batch: selectedMedicine.batch || '',
        expiry: selectedMedicine.expiry || '',
        qty: itemQty.toString(),
        mrp: itemPrice.toFixed(2),
        disc: '',
        gst: '',
        amount: calculateAmount(itemPrice, itemQty, 0, 0, isStrip, saleType),
        medicineId: selectedMedicine.id,
        isStrip,
        stripSize,
        saleType: isStrip ? saleType : null,
        isQtyFixed,
        pack: selectedMedicine.pack_size_label,
      },
    ]);
    setSelectedIndex(items.length);
    setDrugName('');
    setSelectedMedicine(null);
    setMedicineSuggestions([]);
    setSaleType('');
    setLooseQty('');
    setNonStripQty('');
  };

  const handleDeleteItem = (index) => {
    const updatedItems = items.filter((_, i) => i !== index);
    setItems(updatedItems);
    setSelectedIndex(null);
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...items];
    updatedItems[index][field] = value;
    updatedItems[index].amount = calculateAmount(
      updatedItems[index].mrp,
      updatedItems[index].qty,
      updatedItems[index].disc,
      updatedItems[index].gst,
      updatedItems[index].isStrip,
      updatedItems[index].saleType
    );
    setItems(updatedItems);
  };

  const applyBulkDiscount = () => {
    if (parseFloat(bulkDisc) >= 50) {
      alert('You are giving Discount more or equal to 50%');
      setBulkDisc('');
      return;
    }

    const updatedItems = items.map((item) => {
      const disc = bulkDisc;
      const { mrp, qty, gst, isStrip, saleType } = item;
      return {
        ...item,
        disc,
        amount: calculateAmount(mrp, qty, disc, gst, isStrip, saleType),
      };
    });
    setItems(updatedItems);
    setBulkDisc('');
  };

  const applyBulkGST = () => {
    const updatedItems = items.map((item) => {
      const gst = bulkGST;
      const { mrp, qty, disc, isStrip, saleType } = item;
      return {
        ...item,
        gst,
        amount: calculateAmount(mrp, qty, disc, gst, isStrip, saleType),
      };
    });
    setItems(updatedItems);
    setBulkGST('');
  };

  const validateForm = () => {
    const newErrors = {};

    if (!customer) newErrors.customer = 'Customer is required';
    if (!createdBy) newErrors.createdBy = 'Owner is required';
    if (!paymentType) newErrors.paymentType = 'Payment type is required';

    items.forEach((item, index) => {
      if (!item.name || !item.expiry || !item.qty || !item.mrp || !item.disc || !item.gst) {
        newErrors[`item_${index}`] = 'Please fill all required item fields';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getExpiryColor = (expiry) => {
    const [month, year] = expiry.split('/').map(Number);
    const expiryDate = new Date(2000 + year, month - 1, 1);
    const currentDate = new Date(2025, 3, 24);
    const diffMonths =
      (expiryDate.getFullYear() - currentDate.getFullYear()) * 12 +
      (expiryDate.getMonth() - currentDate.getMonth());

    if (diffMonths < 0) {
      return 'text-red-600';
    } else if (diffMonths <= 2) {
      return 'text-orange-600';
    } else {
      return 'text-green-600';
    }
  };

  const totalAmount = items.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);

  const handleSaveSale = () => {
    if (!validateForm()) {
      alert('Please fill all required fields and ensure all items are complete');
      return;
    }

    if (items.some((item) => !item.name || !item.expiry || !item.qty || !item.mrp || !item.disc || !item.gst)) {
      alert('Please complete all required item details before saving');
      return;
    }

    if (paymentType === 'Online') {
      setShowUPIModal(true);
    } else if (paymentType === 'Offline') {
      setShowOfflineModal(true);
    } else {
      alert('Please select a payment type');
    }
  };

  const saveSaleToBackend = async () => {
    const payload = {
      CustomerName: customer,
      CustomerNumber: Phnumber,
      DoctorName: doctor,
      BillDate: billDate,
      PaymentDate: paymentDate,
      TotalAmount: totalAmount.toFixed(2),
      PaidAmount: parseFloat(paidAmount) || 0,
      CreatedBy: createdBy,
      PaymentType: paymentType,
      Status: parseFloat(paidAmount) >= totalAmount ? 'Paid' : 'Due',
      PayAppName: payAppName || null,
      TsNum: tsNum || null,
      SaleItems: items.map((item) => ({
        ItemName: item.name,
        BatchNumber: item.batch,
        Expiry: item.expiry,
        Quantity: parseInt(item.qty) || 0,
        MRP: parseFloat(item.mrp) || 0,
        Discount: parseFloat(item.disc) || 0,
        GST: parseFloat(item.gst) || 0,
        NetAmount: parseFloat(item.amount) || 0,
        MedicineId: item.medicineId,
        IsStrip: item.isStrip,
        StripSize: item.stripSize,
        SaleType: item.isStrip ? (item.saleType || 'Full strip') : null,
        Pack: item.pack,
      })),
    };

    try {
      const data = await createSale(payload);
      const saleID = data.saleID;
      alert('Sale saved successfully!');
      setShowUPIModal(false);
      setShowOfflineModal(false);
      setPayAppName('');
      setTsNum('');
      setPaidAmount('');
      navigate(`/sale-next-step/${saleID}`);
    } catch (error) {
      console.error('Error saving sale:', error);
      alert('Failed to save sale. Please try again.');
    }
  };

  const handleUPISubmit = () => {
    if (!payAppName || !tsNum || !paidAmount) {
      alert('Please fill Payment App Name, Transaction Number, and Paid Amount');
      return;
    }
    if (parseFloat(paidAmount) > totalAmount) {
      alert('Paid amount cannot exceed the total amount');
      return;
    }
    saveSaleToBackend();
  };

  const handleOfflineSubmit = () => {
    if (!payAppName || !paidAmount) {
      alert('Please enter the Payment Mode and Paid Amount');
      return;
    }
    if (parseFloat(paidAmount) > totalAmount) {
      alert('Paid amount cannot exceed the total amount');
      return;
    }
    saveSaleToBackend();
  };

  const isStrip = selectedMedicine && selectedMedicine.pack_size_label.toLowerCase().startsWith('strip');
  const stripSize = isStrip ? parseInt(selectedMedicine?.pack_size_label.match(/\d+/)[0]) : null;
  const isAddButtonDisabled =
    !selectedMedicine ||
    (isStrip && (!saleType || (saleType === 'Loose' && (!looseQty || parseInt(looseQty) <= 0 || parseInt(looseQty) > stripSize)))) ||
    (!isStrip && (!nonStripQty || parseInt(nonStripQty) <= 0));

  return (
    <div className="p-4 bg-[#f1f5f9] min-h-screen font-sans">
      <div className="flex justify-end items-center mb-4 gap-2">
        <div className="flex items-center gap-4 bg-white p-2 rounded shadow border border-gray-200">
          <select
            value={createdBy}
            onChange={(e) => setCreatedBy(e.target.value)}
            className={`border ${errors.createdBy ? 'border-red-500' : 'border-gray-300'} rounded px-2 py-1 text-sm text-gray-700`}
          >
            <option value="">Select Member</option>
            <option value="Sarkar">Owner</option>
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
            <option value="withGST">With GST</option>
            <option value="withoutGST">Without GST</option>
          </select>

          <button className="border border-gray-300 rounded p-2 hover:bg-yellow-700 bg-blue-200">
            <VscSettingsGear />
          </button>
        </div>
      </div>

      <div className="bg-white p-4 shadow rounded-md mb-4 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-2 items-start">
          <div className="relative" ref={customerSuggestionsRef}>
            <label className="text-sm text-gray-700">Patient/Customer Number</label>
            <input
              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
              type="text"
              placeholder="Enter Patient/Customer Number"
              value={Phnumber}
              maxLength={10}
              onChange={handlePhoneNumberChange}
              onFocus={() => customerSuggestions.length > 0 && setShowCustomerSuggestions(true)}
            />
            {isCustomerLoading && (
              <div className="absolute z-10 w-full bg-white shadow-lg rounded-b border border-gray-300 p-2">
                Loading...
              </div>
            )}
            {showCustomerSuggestions && customerSuggestions.length > 0 && (
              <div className="absolute z-10 w-full bg-white shadow-lg rounded-b border border-gray-300 max-h-60 overflow-y-auto">
                {customerSuggestions.map((customer) => (
                  <div
                    key={customer.id}
                    className="p-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100"
                    onClick={() => handleSelectCustomer(customer)}
                  >
                    <div className="font-medium">{customer.name}</div>
                    <div className="text-xs text-gray-500">{customer.mobile}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="text-sm text-gray-700">Patient/Customer Name</label>
            <input
              className={`w-full border ${errors.customer ? 'border-red-500' : 'border-gray-300'} rounded px-2 py-1 text-sm`}
              type="text"
              placeholder="Enter Patient/Customer Name"
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
            />
            {errors.customer && <span className="text-red-500 text-xs">{errors.customer}</span>}
          </div>

          <div>
            <label className="text-sm text-gray-700">Doctor/Prescriber Name</label>
            <input
              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
              type="text"
              placeholder="Enter Doctor/Prescriber Name"
              value={doctor}
              onChange={(e) => setDoctor(e.target.value)}
            />
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
            <label className="text-sm text-gray-700">Payment Date</label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-blue-500"
            />
          </div>
        </div>

        <div className="flex gap-4 items-center mt-2">
          <div className="flex-1 relative" ref={suggestionsRef}>
            <label className="text-sm text-gray-700">Drug/Product Name</label>
            <input
              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
              type="text"
              placeholder="Search medicine (min 3 characters)"
              value={drugName}
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
                    className={`p-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 ${
                      medicine.quantity === null || medicine.quantity === 0
                        ? 'bg-red-100 text-red-700'
                        : 'bg-blue-50 text-blue-700'
                    }`}
                    onClick={() => handleSelectMedicine(medicine)}
                  >
                    <div className="font-medium">{medicine.name}</div>
                    <div className="text-xs">
                      {medicine.manufacturer_name} | {medicine.pack_size_label}
                    </div>
                    <div className="text-xs font-semibold">
                      MRP: ₹{medicine.price} | Stock: {medicine.quantity || 'Out of stock'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="mt-5 flex gap-2 items-center">
            <select
              value={saleType}
              onChange={(e) => setSaleType(e.target.value)}
              className={`border rounded px-2 py-1 text-sm ${
                isStrip ? 'border-gray-300 text-gray-700' : 'border-gray-200 bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
              disabled={!isStrip}
            >
              <option value="">Select Sale Type</option>
              <option value="Full strip">Full strip</option>
              <option value="Loose">Loose</option>
            </select>
            {saleType === 'Loose' && isStrip && (
              <input
                type="number"
                value={looseQty}
                onChange={(e) => setLooseQty(e.target.value)}
                className="w-24 border border-gray-300 rounded px-2 py-1 text-sm"
                placeholder={`1 to ${stripSize}`}
                min="1"
                max={stripSize}
              />
            )}
            {!isStrip && (
              <input
                type="number"
                value={nonStripQty}
                onChange={(e) => setNonStripQty(e.target.value)}
                className="w-24 border border-gray-300 rounded px-2 py-1 text-sm"
                placeholder="Enter quantity"
                min="1"
              />
            )}
            <button
              onClick={handleAddItem}
              className={`px-4 py-1 text-white rounded text-sm ${
                isAddButtonDisabled ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
              }`}
              disabled={isAddButtonDisabled}
            >
              Add to Customer Bill
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 shadow-md rounded-lg border border-gray-200 overflow-auto">
        <table className="min-w-full table-fixed text-sm text-gray-700 border-collapse">
          <thead className="bg-gradient-to-r from-blue-800 to-blue-900 text-white shadow-lg">
            {(showBulkDiscInput || showBulkGSTInput) && (
              <tr className="bg-white text-gray-800 transition duration-300 ease-in-out border-b border-gray-300">
                <th colSpan={5}></th>
                <th className="border-r border-gray-300 px-4 py-2">
                  {showBulkDiscInput && (
                    <input
                      type="number"
                      value={bulkDisc}
                      onChange={(e) => setBulkDisc(e.target.value)}
                      onBlur={applyBulkDiscount}
                      placeholder="Bulk Disc%"
                      className="w-full border border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                    />
                  )}
                </th>
                <th className="border-r border-gray-300 px-4 py-2">
                  {showBulkGSTInput && (
                    <input
                      type="number"
                      value={bulkGST}
                      onChange={(e) => setBulkGST(e.target.value)}
                      onBlur={applyBulkGST}
                      placeholder="Bulk GST%"
                      className="w-full border border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                    />
                  )}
                </th>
                <th colSpan={2}></th>
              </tr>
            )}

            <tr className="border-b border-gray-300 bg-gradient-to-r from-blue-900 to-blue-800 text-white">
              {['Product Name', 'Batch Number', 'Expiry', 'Quantity', 'M.R.P', 'Disc%', 'GST%', 'Total', 'Delete Item'].map(
                (head, i) => (
                  <th
                    key={i}
                    className={`px-4 py-3 text-left font-semibold text-sm tracking-wide uppercase border-l last:border-r border-blue-700
                      ${['Disc%', 'GST%'].includes(head)
                        ? 'cursor-pointer bg-blue-600 hover:bg-blue-500 text-white hover:text-gray-200 transition-colors duration-300'
                        : 'bg-gradient-to-r from-blue-800 to-blue-900'}
                      ${['Product Name', 'Expiry', 'M.R.P', 'Total'].includes(head)
                        ? 'border-2 border-red-500 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 transition duration-300'
                        : ''}`}
                    onClick={() => {
                      if (head === 'Disc%') setShowBulkDiscInput(!showBulkDiscInput);
                      if (head === 'GST%') setShowBulkGSTInput(!showBulkGSTInput);
                    }}
                  >
                    {head}
                  </th>
                )
              )}
            </tr>
          </thead>

          <tbody>
            {items.map((item, index) => (
              <tr
                key={index}
                className={`border-b border-gray-200 transition ${
                  selectedIndex === index ? 'bg-blue-50' : 'hover:bg-blue-100 cursor-pointer'
                }`}
                onClick={() => handleRowClick(index)}
              >
                <td className="border border-gray-300 px-4 py-2">{item.name}</td>
                <td className="border border-gray-300 px-4 py-2">
                  <input
                    type="text"
                    value={item.batch}
                    onChange={(e) => handleItemChange(index, 'batch', e.target.value)}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </td>
                <td className={`border border-gray-300 px-4 py-2 ${getExpiryColor(item.expiry)}`}>{item.expiry}</td>
                <td className="border border-gray-300 px-4 py-2">
                  {item.isQtyFixed ? (
                    <span>{item.qty}</span>
                  ) : (
                    <input
                      type="number"
                      value={item.qty}
                      onChange={(e) => handleItemChange(index, 'qty', e.target.value)}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="1"
                    />
                  )}
                </td>
                <td className="border border-gray-300 px-4 py-2">₹{item.mrp}</td>
                <td className="border border-gray-300 px-4 py-2">
                  <input
                    type="number"
                    value={item.disc}
                    onChange={(e) => handleItemChange(index, 'disc', e.target.value)}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    max="100"
                  />
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  <input
                    type="number"
                    value={item.gst}
                    onChange={(e) => handleItemChange(index, 'gst', e.target.value)}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                </td>
                <td className="border border-gray-300 px-4 py-2">₹{item.amount}</td>
                <td className="border border-gray-300 px-4 py-2 text-center">
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
              </tr>
            ))}
          </tbody>
        </table>

        {items.length === 0 && (
          <div className="text-center py-4 text-gray-500">
            No items added yet. Search for a medicine and click "Add to Customer Bill" to start.
          </div>
        )}
      </div>

      <div className="mt-4 flex justify-between items-center bg-white p-4 rounded shadow border border-gray-200">
        <div className="text-lg font-semibold">Total Amount: ₹{totalAmount.toFixed(2)}</div>
        <button
          onClick={handleSaveSale}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Save Sale
        </button>
      </div>

      {showUPIModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Online Payment Details</h2>
            <div className="mb-4">
              <label className="text-sm text-gray-700">Payment App Name</label>
              <input
                type="text"
                value={payAppName}
                onChange={(e) => setPayAppName(e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                placeholder="e.g., Google Pay, PhonePe"
              />
            </div>
            <div className="mb-4">
              <label className="text-sm text-gray-700">Transaction Number (UTR No.)</label>
              <input
                type="text"
                value={tsNum}
                onChange={(e) => setTsNum(e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                placeholder="Enter UTR Number"
              />
            </div>
            <div className="mb-4">
              <label className="text-sm text-gray-700">Paid Amount</label>
              <input
                type="number"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                placeholder="Enter Paid Amount"
                min="0"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowUPIModal(false);
                  setPayAppName('');
                  setTsNum('');
                  setPaidAmount('');
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleUPISubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {showOfflineModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Offline Payment Details</h2>
            <div className="mb-4">
              <label className="text-sm text-gray-700">Payment Mode</label>
              <select
                value={payAppName}
                onChange={(e) => setPayAppName(e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
              >
                <option value="">Select Payment Mode</option>
                <option value="Cash">Cash</option>
                <option value="Cheque">Cheque</option>
                <option value="Credit/Debit Card">Credit/Debit Card</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="text-sm text-gray-700">Paid Amount</label>
              <input
                type="number"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                placeholder="Enter Paid Amount"
                min="0"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowOfflineModal(false);
                  setPayAppName('');
                  setPaidAmount('');
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleOfflineSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}