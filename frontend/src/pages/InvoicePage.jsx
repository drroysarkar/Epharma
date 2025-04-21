import React, { useState, useRef } from 'react';
import { saveAs } from 'file-saver';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import './InvoicePage.css';

const InvoicePage = () => {
  // Form state
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

  const invoiceRef = useRef();

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInvoice((prev) => ({ ...prev, [name]: value }));
  };

  const handleFromChange = (e) => {
    const { name, value } = e.target;
    setInvoice((prev) => ({
      ...prev,
      from: { ...prev.from, [name]: value },
    }));
  };

  const handleToChange = (e) => {
    const { name, value } = e.target;
    setInvoice((prev) => ({
      ...prev,
      to: { ...prev.to, [name]: value },
    }));
  };

  const handleItemChange = (id, e) => {
    const { name, value } = e.target;
    setInvoice((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === id
          ? {
              ...item,
              [name]: name === 'quantity' || name === 'rate' ? parseFloat(value) || 0 : value,
              amount:
                (name === 'quantity' || name === 'rate'
                  ? (name === 'quantity'
                      ? parseFloat(value) || 0
                      : item.quantity) *
                    (name === 'rate'
                      ? parseFloat(value) || 0
                      : item.rate)
                  : item.quantity * item.rate),
            }
          : item
      ),
    }));
  };

  // Add new item
  const addItem = () => {
    setInvoice((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: prev.items.length > 0 ? Math.max(...prev.items.map((i) => i.id)) + 1 : 1,
          description: '',
          quantity: 1,
          rate: 0,
          amount: 0,
        },
      ],
    }));
  };

  // Remove item
  const removeItem = (id) => {
    if (invoice.items.length > 1) {
      setInvoice((prev) => ({
        ...prev,
        items: prev.items.filter((item) => item.id !== id),
      }));
    }
  };

  // Calculate subtotal
  const subtotal = invoice.items.reduce((sum, item) => sum + item.amount, 0);

  // Calculate tax
  const tax = subtotal * (invoice.taxRate / 100);

  // Calculate total
  const total = subtotal + tax - invoice.discount;

  // Generate PDF
  const generatePDF = async () => {
    try {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([600, 800]);

      const { width, height } = page.getSize();
      const margin = 50;
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

      // Draw header
      page.drawText('INVOICE', {
        x: margin,
        y: height - margin - 30,
        size: 24,
        font,
        color: rgb(0, 0, 0),
      });

      // Draw invoice info
      page.drawText(`Invoice #: ${invoice.invoiceNumber}`, {
        x: width - margin - 150,
        y: height - margin - 30,
        size: 12,
        font,
      });
      page.drawText(`Date: ${invoice.date}`, {
        x: width - margin - 150,
        y: height - margin - 45,
        size: 12,
        font,
      });

      // Draw from and to addresses
      page.drawText('From:', {
        x: margin,
        y: height - margin - 100,
        size: 14,
        font,
      });
      page.drawText(
        `${invoice.from.name}\n${invoice.from.address}\nPhone: ${invoice.from.phone}\nEmail: ${invoice.from.email}`,
        {
          x: margin,
          y: height - margin - 120,
          size: 12,
          font,
          lineHeight: 15,
        }
      );

      page.drawText('To:', {
        x: width / 2,
        y: height - margin - 100,
        size: 14,
        font,
      });
      page.drawText(
        `${invoice.to.name}\n${invoice.to.address}\nPhone: ${invoice.to.phone}\nEmail: ${invoice.to.email}`,
        {
          x: width / 2,
          y: height - margin - 120,
          size: 12,
          font,
          lineHeight: 15,
        }
      );

      // Draw items table header
      page.drawText('Description', {
        x: margin,
        y: height - margin - 200,
        size: 12,
        font,
        color: rgb(0, 0, 0),
      });
      page.drawText('Qty', {
        x: width - margin - 300,
        y: height - margin - 200,
        size: 12,
        font,
        color: rgb(0, 0, 0),
      });
      page.drawText('Rate', {
        x: width - margin - 200,
        y: height - margin - 200,
        size: 12,
        font,
        color: rgb(0, 0, 0),
      });
      page.drawText('Amount', {
        x: width - margin - 100,
        y: height - margin - 200,
        size: 12,
        font,
        color: rgb(0, 0, 0),
      });

      // Draw items
      let y = height - margin - 220;
      invoice.items.forEach((item) => {
        page.drawText(item.description, {
          x: margin,
          y,
          size: 10,
          font,
        });
        page.drawText(item.quantity.toString(), {
          x: width - margin - 300,
          y,
          size: 10,
          font,
        });
        page.drawText(item.rate.toFixed(2), {
          x: width - margin - 200,
          y,
          size: 10,
          font,
        });
        page.drawText(item.amount.toFixed(2), {
          x: width - margin - 100,
          y,
          size: 10,
          font,
        });
        y -= 20;
      });

      // Draw totals
      y -= 40;
      page.drawText(`Subtotal: ${subtotal.toFixed(2)}`, {
        x: width - margin - 100,
        y,
        size: 12,
        font,
      });
      y -= 20;
      page.drawText(`Tax (${invoice.taxRate}%): ${tax.toFixed(2)}`, {
        x: width - margin - 100,
        y,
        size: 12,
        font,
      });
      y -= 20;
      page.drawText(`Discount: ${invoice.discount.toFixed(2)}`, {
        x: width - margin - 100,
        y,
        size: 12,
        font,
      });
      y -= 20;
      page.drawText(`Total: ${total.toFixed(2)}`, {
        x: width - margin - 100,
        y,
        size: 14,
        font,
        color: rgb(0, 0, 0),
      });

      // Draw notes
      y -= 40;
      page.drawText('Notes:', {
        x: margin,
        y,
        size: 12,
        font,
      });
      y -= 20;
      page.drawText(invoice.notes, {
        x: margin,
        y,
        size: 10,
        font,
        maxWidth: width - margin * 2,
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      saveAs(blob, `invoice_${invoice.invoiceNumber}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  // Generate Word document
  const generateWord = async () => {
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: 'INVOICE',
                  bold: true,
                  size: 28,
                }),
              ],
              spacing: { after: 200 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Invoice #: ${invoice.invoiceNumber}`,
                  bold: true,
                }),
                new TextRun({
                  text: '\t\t\t',
                }),
                new TextRun({
                  text: `Date: ${invoice.date}`,
                  bold: true,
                }),
              ],
            }),
            new Paragraph({
              text: '',
              spacing: { after: 200 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: 'From:',
                  bold: true,
                }),
              ],
            }),
            new Paragraph({
              text: `${invoice.from.name}\n${invoice.from.address}\nPhone: ${invoice.from.phone}\nEmail: ${invoice.from.email}`,
            }),
            new Paragraph({
              text: '',
              spacing: { after: 200 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: 'To:',
                  bold: true,
                }),
              ],
            }),
            new Paragraph({
              text: `${invoice.to.name}\n${invoice.to.address}\nPhone: ${invoice.to.phone}\nEmail: ${invoice.to.email}`,
            }),
            new Paragraph({
              text: '',
              spacing: { after: 200 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: 'Description',
                  bold: true,
                }),
                new TextRun({
                  text: '\t\t\t\t\t\t\t\t\t\t',
                }),
                new TextRun({
                  text: 'Qty',
                  bold: true,
                }),
                new TextRun({
                  text: '\t\t\t\t\t\t',
                }),
                new TextRun({
                  text: 'Rate',
                  bold: true,
                }),
                new TextRun({
                  text: '\t\t\t\t\t\t',
                }),
                new TextRun({
                  text: 'Amount',
                  bold: true,
                }),
              ],
            }),
            ...invoice.items.flatMap((item) => [
              new Paragraph({
                children: [
                  new TextRun({
                    text: item.description,
                  }),
                  new TextRun({
                    text: '\t\t\t\t\t\t\t\t\t\t',
                  }),
                  new TextRun({
                    text: item.quantity.toString(),
                  }),
                  new TextRun({
                    text: '\t\t\t\t\t\t',
                  }),
                  new TextRun({
                    text: item.rate.toFixed(2),
                  }),
                  new TextRun({
                    text: '\t\t\t\t\t\t',
                  }),
                  new TextRun({
                    text: item.amount.toFixed(2),
                  }),
                ],
              }),
            ]),
            new Paragraph({
              text: '',
              spacing: { after: 200 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Subtotal: ${subtotal.toFixed(2)}`,
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Tax (${invoice.taxRate}%): ${tax.toFixed(2)}`,
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Discount: ${invoice.discount.toFixed(2)}`,
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Total: ${total.toFixed(2)}`,
                  bold: true,
                }),
              ],
            }),
            new Paragraph({
              text: '',
              spacing: { after: 200 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: 'Notes:',
                  bold: true,
                }),
              ],
            }),
            new Paragraph({
              text: invoice.notes,
            }),
          ],
        },
      ],
    });

    Packer.toBlob(doc).then((blob) => {
      saveAs(blob, `invoice_${invoice.invoiceNumber}.docx`);
    });
  };

  // Print invoice
  const printInvoice = () => {
    window.print();
  };

  return (
    <div className="invoice-container">
      <div className="invoice-header">
        <h1>Sales Invoice</h1>
        <div className="invoice-actions">
          <button onClick={generatePDF}>Download PDF</button>
          <button onClick={generateWord}>Download Word</button>
          <button onClick={printInvoice}>Print</button>
        </div>
      </div>

      <div className="invoice-form" ref={invoiceRef}>
        <div className="invoice-info">
          <div>
            <label>Invoice Number</label>
            <input
              type="text"
              name="invoiceNumber"
              value={invoice.invoiceNumber}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <label>Date</label>
            <input
              type="date"
              name="date"
              value={invoice.date}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <label>Due Date</label>
            <input
              type="date"
              name="dueDate"
              value={invoice.dueDate}
              onChange={handleInputChange}
            />
          </div>
        </div>

        <div className="address-section">
          <div className="from-address">
            <h3>From</h3>
            <input
              type="text"
              name="name"
              placeholder="Name"
              value={invoice.from.name}
              onChange={handleFromChange}
            />
            <textarea
              name="address"
              placeholder="Address"
              value={invoice.from.address}
              onChange={handleFromChange}
            />
            <input
              type="text"
              name="phone"
              placeholder="Phone"
              value={invoice.from.phone}
              onChange={handleFromChange}
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={invoice.from.email}
              onChange={handleFromChange}
            />
          </div>

          <div className="to-address">
            <h3>To</h3>
            <input
              type="text"
              name="name"
              placeholder="Name"
              value={invoice.to.name}
              onChange={handleToChange}
            />
            <textarea
              name="address"
              placeholder="Address"
              value={invoice.to.address}
              onChange={handleToChange}
            />
            <input
              type="text"
              name="phone"
              placeholder="Phone"
              value={invoice.to.phone}
              onChange={handleToChange}
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={invoice.to.email}
              onChange={handleToChange}
            />
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
              {invoice.items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <input
                      type="text"
                      name="description"
                      value={item.description}
                      onChange={(e) => handleItemChange(item.id, e)}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      name="quantity"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(item.id, e)}
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
            />
          </div>
        </div>

        <div className="summary-section">
          <div>
            <p>Subtotal: {subtotal.toFixed(2)}</p>
            <p>Tax: {tax.toFixed(2)}</p>
            <p>Discount: {invoice.discount.toFixed(2)}</p>
            <p className="total">Total: {total.toFixed(2)}</p>
          </div>
        </div>

        <div className="notes-section">
          <h3>Notes</h3>
          <textarea
            name="notes"
            value={invoice.notes}
            onChange={handleInputChange}
            placeholder="Additional notes..."
          />
        </div>
      </div>
    </div>
  );
};

export default InvoicePage;