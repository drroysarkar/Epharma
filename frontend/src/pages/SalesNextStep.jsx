import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import Barcode from 'react-barcode';
import { fetchSaleByIdForInvoice, fetchPharmacyProfile, saveSalePDF } from '../services/saleService'; // Import API service functions

export default function SalesNextStep() {
  const { saleID } = useParams();
  const [saleData, setSaleData] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch sale data
        const saleData = await fetchSaleByIdForInvoice(saleID);
        setSaleData(saleData);

        // Fetch profile data
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');
        if (!token || !userId) {
          throw new Error('User not authenticated');
        }

        const profileData = await fetchPharmacyProfile(userId, token);
        setProfileData(profileData);
      } catch (err) {
        setError(err.message || 'Error fetching data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [saleID]);

  const handlePrint = () => {
    window.print();
  };

  const handleSaveAndExit = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      if (!token || !userId) {
        throw new Error('User not authenticated');
      }
      await saveSalePDF(saleID, { userId }, token);
      navigate('/sale/invoices');
    } catch (err) {
      console.error('Error saving PDF:', err);
      setError(err.message || 'Failed to save PDF');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  if (!saleData || !saleData.saleDetails) return <div>No sale data found</div>;

  const { saleDetails, saleItems } = saleData;
  const { CustomerName, BillNumber, BillDate, TotalAmount, PaymentType, BillPath } = saleDetails;

  const {
    pharmacyName = 'TARUN MEDICOS',
    mobile = '0522-1234567, Mob: 1234567890',
    address = '1st Floor, Family Medical Store, U.P. Sanjay Nagar',
    address2 = 'Lucknow-Imp/Wholesale, U.P. Sanjay Nagar',
    city = 'Lucknow',
    state = 'U.P.',
    pincode = '226016',
  } = profileData || {};

  const invoiceDownloadUrl = `http://localhost:5010/${BillPath || ''}`; // Use BillPath from saleDetails

  const qrData = JSON.stringify({
    billNumber: BillNumber,
    customerName: CustomerName,
    billDate: BillDate,
    invoiceDownloadUrl: invoiceDownloadUrl,
  });

  return (
    <div className="p-4 bg-gray-100 min-h-screen font-sans relative">
      <style>
        {`
          @media print {
            @page {
              size: A4;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
            }
            body * {
              visibility: hidden;
            }
            #invoice, #invoice * {
              visibility: visible;
            }
            #invoice {
              position: absolute;
              left: 0;
              top: 0;
              width: 210mm;
              height: 297mm;
              margin: 0;
              padding: 10mm;
              box-sizing: border-box;
              font-size: 10pt;
              background: white;
            }
            .print-button {
              display: none;
            }
            .bg-gray-100, .shadow-md, .border-gray-300 {
              background: none !important;
              box-shadow: none !important;
              border: none !important;
            }
            .qr-code {
              width: 80px !important;
              height: 80px !important;
              image-rendering: pixelated;
            }
            .loader-overlay {
              display: none !important;
            }
          }
        `}
      </style>
      {saving && (
        <div className="loader-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-white text-lg font-semibold">Saving Invoice...</p>
          </div>
        </div>
      )}
      <div id="invoice" className="max-w-3xl mx-auto bg-white p-4 shadow-md border border-gray-300">
        <div className="text-center py-4">
          <h2 className="text-3xl font-bold font-serif tracking-wide">TAX INVOICE</h2>
        </div>

        <div className="flex justify-between items-start pb-2 text-xs border-b">
          <div className="flex flex-col w-1/3">
            <h1 className="text-3xl font-bold">{pharmacyName}</h1>
            <p className="mt-6">
              {address}
              {address2 ? `, ${address2}` : ''}
            </p>
            <p>
              {city}, {state} {pincode}
            </p>
            <p>Phone: {mobile}</p>
            <p>GSTIN: 09AAECT1234F1Z6</p>
            <p>DL No: UP3212024, UP3212025</p>
          </div>
          <div className="flex justify-center items-start w-1/3">
            <QRCodeCanvas value={qrData} size={80} level="H" className="qr-code mt-5 ml-4" />
          </div>
          <div className="flex flex-col text-right w-1/3">
            <div>
              {BillNumber && (
                <Barcode
                  value={BillNumber}
                  format="CODE128"
                  width={1.5}
                  height={40}
                  displayValue={false}
                  className="ml-auto mb-4"
                />
              )}
            </div>
            <p>
              <strong>INV NO:</strong> {BillNumber}
            </p>
            <p>
              <strong>DATE:</strong>{' '}
              {new Date(BillDate).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </p>
            <p>
              <strong>ROUTE:</strong> {state}
            </p>
            <p>
              <strong>PAN NO:</strong> AAECT1234F
            </p>
          </div>
        </div>
        <div className="mt-2 pt-1 text-xs">
          <p>
            <strong>CUSTOMER NAME:</strong> {CustomerName}
          </p>
        </div>
        <div className="mt-2">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b">
                <th className="border px-1 py-0.5 text-left">HSN Code</th>
                <th className="border px-1 py-0.5 text-left">Item Description</th>
                <th className="border px-1 py-0.5 text-center">Batch No</th>
                <th className="border px-1 py-0.5 text-center">Exp Date</th>
                <th className="border px-1 py-0.5 text-center">Qty</th>
                <th className="border px-1 py-0.5 text-right">Rate</th>
                <th className="border px-1 py-0.5 text-right">Disc%</th>
                <th className="border px-1 py-0.5 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {saleItems && saleItems.length > 0 ? (
                saleItems.map((item, index) => (
                  <tr key={index} className="border-b">
                    <td className="border px-1 py-0.5">30049099</td>
                    <td className="border px-1 py-0.5">{item.ItemName}</td>
                    <td className="border px-1 py-0.5 text-center">{item.Batch}</td>
                    <td className="border px-1 py-0.5 text-center">{item.Expiry}</td>
                    <td className="border px-1 py-0.5 text-center">
                      {item.Quantity}
                      {item.Is_Loose ? '(L)' : ''}
                    </td>
                    <td className="border px-1 py-0.5 text-right">{item.MRP}</td>
                    <td className="border px-1 py-0.5 text-right">{item.Discount}</td>
                    <td className="border px-1 py-0.5 text-right">{item.NetAmount}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="border px-1 py-0.5 text-center text-gray-500">
                    No items found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-2 text-xs">
          <div className="flex justify-between border-t pt-1">
            <div>
              <p>
                <strong>Total Items:</strong> {saleItems ? saleItems.length : 0}
              </p>
              <p>
                <strong>Payment Mode:</strong> {PaymentType}
              </p>
            </div>
            <div className="text-right">
              <p>
                <strong>Net Amount:</strong> ₹{TotalAmount}
              </p>
              <p>
                <strong>SGST 9%:</strong> ₹0.00
              </p>
              <p>
                <strong>CGST 9%:</strong> ₹0.00
              </p>
              <p>
                <strong>Grand Total:</strong> ₹{TotalAmount}
              </p>
            </div>
          </div>
        </div>
        <div className="mt-2 text-xs border-t pt-1">
          <p>
            <strong>Terms & Conditions:</strong> Goods once sold will not be taken back or exchanged.
          </p>
          <p className="text-center mt-1">Thank you for your business!</p>
        </div>
        <div className="mt-4 text-center print-button flex justify-center gap-4">
          <button
            onClick={handlePrint}
            className="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
          >
            Print Bill
          </button>
          <button
            onClick={handleSaveAndExit}
            className="px-4 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save and Exit'}
          </button>
        </div>
      </div>
    </div>
  );
}