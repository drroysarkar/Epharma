import React, { useState } from 'react';
import { Document as PDFDocument, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';
import { Document as DocxDocument, Packer, Paragraph, Table, TableRow, TableCell, WidthType } from 'docx';
import { saveAs } from 'file-saver';

const InvoicePDF = ({ invoiceData, items }) => {
  const styles = StyleSheet.create({
    page: { padding: 30 },
    header: { fontSize: 24, marginBottom: 20, textAlign: 'center' },
    section: { marginBottom: 10 },
    text: { fontSize: 12, marginBottom: 5 },
    table: { display: 'flex', flexDirection: 'column', marginTop: 10 },
    tableRow: { flexDirection: 'row', borderBottom: '1px solid #000' },
    tableCell: { flex: 1, padding: 5, fontSize: 10 },
    total: { fontSize: 14, marginTop: 10, textAlign: 'right' }
  });

  return (
    <PDFDocument>
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>Sales Invoice</Text>
        <View style={styles.section}>
          <Text style={styles.text}>Business: {invoiceData.businessName}</Text>
          <Text style={styles.text}>Customer: {invoiceData.customerName}</Text>
          <Text style={styles.text}>Invoice No: {invoiceData.invoiceNo}</Text>
          <Text style={styles.text}>Date: {invoiceData.date}</Text>
        </View>
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>Item</Text>
            <Text style={styles.tableCell}>Quantity</Text>
            <Text style={styles.tableCell}>Price</Text>
            <Text style={styles.tableCell}>Total</Text>
          </View>
          {items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.tableCell}>{item.description}</Text>
              <Text style={styles.tableCell}>{item.quantity}</Text>
              <Text style={styles.tableCell}>{item.price}</Text>
              <Text style={styles.tableCell}>{item.quantity * item.price}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.total}>
          Total: {items.reduce((sum, item) => sum + item.quantity * item.price, 0)}
        </Text>
      </Page>
    </PDFDocument>
  );
};

const InvoicePages = () => {
  const [invoiceData, setInvoiceData] = useState({
    businessName: '',
    customerName: '',
    invoiceNo: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [items, setItems] = useState([{ description: '', quantity: 1, price: 0 }]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInvoiceData({ ...invoiceData, [name]: value });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, price: 0 }]);
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const generatePDF = async () => {
    const blob = await pdf(<InvoicePDF invoiceData={invoiceData} items={items} />).toBlob();
    saveAs(blob, 'invoice.pdf');
  };

  const generateWord = () => {
    const doc = new DocxDocument({
      sections: [{
        children: [
          new Paragraph({ text: 'Sales Invoice', heading: 'Heading1' }),
          new Paragraph(`Business: ${invoiceData.businessName}`),
          new Paragraph(`Customer: ${invoiceData.customerName}`),
          new Paragraph(`Invoice No: ${invoiceData.invoiceNo}`),
          new Paragraph(`Date: ${invoiceData.date}`),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph('Item')] }),
                  new TableCell({ children: [new Paragraph('Quantity')] }),
                  new TableCell({ children: [new Paragraph('Price')] }),
                  new TableCell({ children: [new Paragraph('Total')] })
                ]
              }),
              ...items.map(item => new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph(item.description)] }),
                  new TableCell({ children: [new Paragraph(item.quantity.toString())] }),
                  new TableCell({ children: [new Paragraph(item.price.toString())] }),
                  new TableCell({ children: [new Paragraph((item.quantity * item.price).toString())] })
                ]
              })),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph('')] }),
                  new TableCell({ children: [new Paragraph('')] }),
                  new TableCell({ children: [new Paragraph('Total:')] }),
                  new TableCell({ children: [new Paragraph(
                    items.reduce((sum, item) => sum + item.quantity * item.price, 0).toString()
                  )] })
                ]
              })
            ]
          })
        ]
      }]
    });

    Packer.toBlob(doc).then(blob => {
      saveAs(blob, 'invoice.docx');
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold text-center mb-6">Sales Invoice Generator</h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium">Business Name</label>
            <input
              type="text"
              name="businessName"
              value={invoiceData.businessName}
              onChange={handleInputChange}
              className="mt-1 p-2 w-full border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Customer Name</label>
            <input
              type="text"
              name="customerName"
              value={invoiceData.customerName}
              onChange={handleInputChange}
              className="mt-1 p-2 w-full border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Invoice No</label>
            <input
              type="text"
              name="invoiceNo"
              value={invoiceData.invoiceNo}
              onChange={handleInputChange}
              className="mt-1 p-2 w-full border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Date</label>
            <input
              type="date"
              name="date"
              value={invoiceData.date}
              onChange={handleInputChange}
              className="mt-1 p-2 w-full border rounded"
            />
          </div>
        </div>

        <h2 className="text-xl font-semibold mb-4">Items</h2>
        {items.map((item, index) => (
          <div key={index} className="grid grid-cols-4 gap-4 mb-4 items-center">
            <input
              type="text"
              placeholder="Item Description"
              value={item.description}
              onChange={(e) => handleItemChange(index, 'description', e.target.value)}
              className="p-2 border rounded"
            />
            <input
              type="number"
              placeholder="Quantity"
              value={item.quantity}
              onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))}
              className="p-2 border rounded"
            />
            <input
              type="number"
              placeholder="Price"
              value={item.price}
              onChange={(e) => handleItemChange(index, 'price', parseFloat(e.target.value))}
              className="p-2 border rounded"
            />
            <button
              onClick={() => removeItem(index)}
              className="p-2 bg-red-500 text-white rounded"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          onClick={addItem}
          className="p-2 bg-blue-500 text-white rounded mb-6"
        >
          Add Item
        </button>

        <div className="text-right">
          <p className="text-lg font-semibold">
            Total: {items.reduce((sum, item) => sum + item.quantity * item.price, 0)}
          </p>
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <button
            onClick={generatePDF}
            className="p-2 bg-green-500 text-white rounded"
          >
            Generate PDF
          </button>
          <button
            onClick={generateWord}
            className="p-2 bg-purple-500 text-white rounded"
          >
            Generate Word
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoicePages;
