import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import './InvoicePage.css';

const InvoicePage = () => {
  const [invoice, setInvoice] = useState({
    invoiceNumber: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: '',
    from: {
      name: '',
      address: '',
      phone: '',
      email: '',
    },
    to: {
      name: '',
      address: '',
      phone: '',
      email: '',
    },
    items: [
      {
        id: 1,
        description: '',
        quantity: 1,
        rate: 0,
        amount: 0,
      },
    ],
    taxRate: 0,
    discount: 0,
    notes: '',
  });

  const [logoUrl, setLogoUrl] = useState('');
  const [signatureUrl, setSignatureUrl] = useState('');
  const invoiceRef = useRef();

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const decoded = jwtDecode(token);
        const userId = decoded.userId;

        const res = await axios.get(`http://localhost:5010/api/pharmacy/profile/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = res.data;
        if (res.status === 200 && data.profile) {
          const logoPath = data.profile.companyLogoPath
            ? `http://localhost:5010/${data.profile.companyLogoPath}`
            : '';
          const signaturePath = data.profile.signaturePath
            ? `http://localhost:5010/${data.profile.signaturePath}`
            : '';

          setLogoUrl(logoPath);
          setSignatureUrl(signaturePath);
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      }
    };

    fetchProfile();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (['taxRate', 'discount'].includes(name)) {
      setInvoice(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
      setInvoice(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFromChange = (e) => {
    const { name, value } = e.target;
    setInvoice(prev => ({
      ...prev,
      from: { ...prev.from, [name]: value },
    }));
  };

  const handleToChange = (e) => {
    const { name, value } = e.target;
    setInvoice(prev => ({
      ...prev,
      to: { ...prev.to, [name]: value },
    }));
  };

  const handleItemChange = (id, e) => {
    const { name, value } = e.target;
    setInvoice(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.id === id
          ? {
            ...item,
            [name]: ['quantity', 'rate'].includes(name) ? parseFloat(value) || 0 : value,
            amount:
              (name === 'quantity' ? parseFloat(value) || 0 : item.quantity) *
              (name === 'rate' ? parseFloat(value) || 0 : item.rate),
          }
          : item
      ),
    }));
  };

  const addItem = () => {
    setInvoice(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: Math.max(0, ...prev.items.map(i => i.id)) + 1,
          description: '',
          quantity: 1,
          rate: 0,
          amount: 0,
        },
      ],
    }));
  };

  const removeItem = (id) => {
    if (invoice.items.length > 1) {
      setInvoice(prev => ({
        ...prev,
        items: prev.items.filter(item => item.id !== id),
      }));
    }
  };

  const subtotal = invoice.items.reduce((sum, item) => sum + (item.amount || 0), 0);
  const tax = subtotal * ((invoice.taxRate || 0) / 100);
  const discount = Number(invoice.discount || 0);
  const total = subtotal + tax - discount;

  const printInvoice = () => {
    window.print();
  };

  return (
    <div className="invoice-container">
      <div className="invoice-header">
        <h1 className="text-bold">Sales Invoice</h1>
        <div className="invoice-actions">
          <button onClick={printInvoice}>Print</button>
        </div>
      </div>

      <div className="invoice-form" ref={invoiceRef}>
        <div className="top-row" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div className="invoice-info">
            <div>
              <label>Invoice Number</label>
              <input
                type="text"
                name="invoiceNumber"
                value={invoice.invoiceNumber}
                onChange={handleInputChange}
                style={{ backgroundColor: '#FFFFE0' }}
              />
            </div>
            <div>
              <label>Date</label>
              <input
                type="date"
                name="date"
                value={invoice.date}
                onChange={handleInputChange}
                style={{ backgroundColor: '#FFFFE0' }}
              />
            </div>
            <div>
              <label>Due Date</label>
              <input
                type="date"
                name="dueDate"
                value={invoice.dueDate}
                onChange={handleInputChange}
                style={{ backgroundColor: '#FFFFE0' }}
              />
            </div>
          </div>

          <div className="logo-box" style={{ width: '150px', textAlign: 'right' }}>
            {logoUrl && <img src={logoUrl} alt="Company Logo" style={{ width: '100%', maxHeight: '100px' }} />}
            <h3>Company Logo</h3>
          </div>
        </div>

        <div className="address-section">
          <div className="to-address">
            <h3 className="font-semibold">Customer Details</h3>
            <div className="flex gap-4">
              <input
                type="text"
                name="name"
                placeholder="Name"
                value={invoice.to.name}
                onChange={handleToChange}
                className="p-2 border rounded w-1/2"
                style={{ backgroundColor: '#FFFFE0' }}
              />
              <input
                type="text"
                name="phone"
                placeholder="Phone"
                value={invoice.to.phone}
                onChange={handleToChange}
                className="p-2 border rounded w-1/2"
                style={{ backgroundColor: '#FFFFE0' }}
              />
            </div>
          </div>
        </div>

        <div className="items-section">
          <h3>Items</h3>
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Quantity</th>
                <th>Rate</th>
                <th>Amount</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map(item => (
                <tr key={item.id}>
                  <td>
                    <input
                      type="text"
                      name="description"
                      value={item.description}
                      onChange={(e) => handleItemChange(item.id, e)}
                      style={{ backgroundColor: '#FFFFE0' }}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      name="quantity"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(item.id, e)}
                      style={{ backgroundColor: '#FFFFE0' }}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      name="rate"
                      min="0"
                      step="0.01"
                      value={item.rate}
                      onChange={(e) => handleItemChange(item.id, e)}
                      style={{ backgroundColor: '#FFFFE0' }}
                    />
                  </td>
                  <td>{item.amount.toFixed(2)}</td>
                  <td>
                    <button onClick={() => removeItem(item.id)}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={addItem}>Add Item</button>
        </div>

        <div className="totals-section">
          <div>
            <label>Tax Rate (%)</label>
            <input
              type="number"
              name="taxRate"
              min="0"
              max="100"
              value={invoice.taxRate}
              onChange={handleInputChange}
              style={{ backgroundColor: '#FFFFE0' }}
            />
          </div>
          <div>
            <label>Discount</label>
            <input
              type="number"
              name="discount"
              min="0"
              step="0.01"
              value={invoice.discount}
              onChange={handleInputChange}
              style={{ backgroundColor: '#FFFFE0' }}
            />
          </div>
        </div>

        <div className="summary-section">
          <div>
            <p>Subtotal: {subtotal.toFixed(2)}</p>
            <p>Tax: {tax.toFixed(2)}</p>
            <p>Discount: {discount.toFixed(2)}</p>
            <p className="total">Total: {total.toFixed(2)}</p>
          </div>
        </div>

        <div className="notes-signature-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '20px' }}>
  <div className="notes-section" style={{ flex: '1', marginRight: '20px' }}>
    <h3>Notes</h3>
    <textarea
      name="notes"
      value={invoice.notes}
      onChange={handleInputChange}
      placeholder="Additional notes..."
      style={{ backgroundColor: '#FFFFE0', width: '100%', height: '100px', resize: 'vertical' }}
    />
  </div>

  <div className="signature-box" style={{ textAlign: 'right', minWidth: '100px' }}>
    {signatureUrl && <img src={signatureUrl} alt="Signature" style={{ height: '80px' , marginTop: '35px' }} />}
    <h3>Signature</h3>

  </div>
</div>

      </div>
    </div>
  );
};

export default InvoicePage;
