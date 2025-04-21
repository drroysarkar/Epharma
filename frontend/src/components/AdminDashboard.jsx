import React from "react";
import SalesPurchaseCard from "./SalesPurchaseCard";
const colors = [
  "bg-red-500", "bg-blue-500", "bg-green-500",
  "bg-yellow-500", "bg-purple-500", "bg-pink-500",
  "bg-indigo-500", "bg-teal-500"
];

const dummyData = {
  sales: 32,
  purchases: 14912,
  orders: { sales: 2, purchases: 7 },
  expiringItems: [
    { name: "Pantosec-D Tablet", company: "CIPLA", qty: 4990, expiry: "04/23" },
    { name: "Randidom QT Tablet", company: "MANKO", qty: 3110, expiry: "04/23" },
    { name: "Cyproheptadine 4mg Tablet", company: "DANIS", qty: 1980, expiry: "04/23" },
    { name: "Paracetamol Tablet", company: "SUPRE", qty: 1825, expiry: "05/23" },
    { name: "Lc Gen M Tablet", company: "TABLET", qty: 1500, expiry: "04/23" },
  ],
  salesMargin: {
    item: "Dolofen Suspension",
    pack: "50 Ml",
    stock: 1,
    margin: "8.35%",
  },
  needToCollect: [
    { name: "Evital Support", phone: "9033006262", amount: -9217 },
    { name: "Rajiv Khara", phone: "9978073751", amount: -7233 },
    { name: "Vaibhav Jain", phone: "9033071702", amount: -7229 },
    { name: "Evital Support 2", phone: "9033005960", amount: -6095 },
    { name: "Tanu Joshi", phone: "N/A", amount: -5709 },
  ],
  needToPay: [
    { name: "K. S. Pharma", Gstin: "ABC12XC54Z", amount: 1516443 },
    { name: "K. B. Shah & Company", Gstin: "ABC12XC54Z", amount: 5619864 },
  ],
  stock: {
    current: { ptr: 9892080, lp: 10478920, mrp: 16086601 },
    expired: { ptr: 2913531, lp: 3056216, mrp: 4836622 },
  },
};

const getColorByIndex = index => colors[index % colors.length];

const Card = ({ title, children }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 w-full transition hover:shadow-md">
    <h3 className="text-lg font-semibold text-gray-800 mb-3">{title}</h3>
    <div className="text-gray-700">{children}</div>
  </div>
);

const Avatar = ({ name, index }) => {
  const initial = name.charAt(0).toUpperCase();
  return (
    <div className={`w-8 h-8 flex items-center justify-center rounded-full text-white font-bold text-sm ${getColorByIndex(index)}`}>
      {initial}
    </div>
  );
};

const AdminDashboard = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

      <SalesPurchaseCard />

        {/* Sales Margin */}
        <Card title="Sales Margin">
          <div className="flex justify-between text-sm">
            <span>{dummyData.salesMargin.item} ({dummyData.salesMargin.pack})</span>
            <span className="font-bold text-green-600">{dummyData.salesMargin.margin}</span>
          </div>
          <div className="mt-1 text-sm">Stock: {dummyData.salesMargin.stock}</div>
        </Card>

        {/* Expiring Items */}
        <Card title="Expiring Items">
          <ul className="divide-y divide-gray-200 text-sm">
            {dummyData.expiringItems.map((item, i) => (
              <li key={i} className="flex justify-between py-2">
                <div>
                  <div className="font-medium">{item.name}</div>
                  <div className="text-xs text-gray-500">{item.company} | Qty: {item.qty}</div>
                </div>
                <div className="text-red-500 font-semibold">{item.expiry}</div>
              </li>
            ))}
          </ul>
        </Card>

        {/* Need to Collect */}
<Card>
  <div className="flex justify-between items-center mb-2">
    <h2 className="text-lg font-semibold">Need to Collect</h2>
    <span className="text-xl font-bold text-red-600">
      - ₹{Math.abs(dummyData.needToCollect.reduce((sum, i) => sum + i.amount, 0)).toLocaleString()}
    </span>
  </div>

  <div className="flex justify-between text-xs font-medium text-gray-500 mb-1 px-1">
    <span>Customer</span>
    <span>Amount Due</span>
  </div>

  <ul className="divide-y divide-gray-200 text-sm">
    {dummyData.needToCollect.map((c, i) => (
      <li key={i} className="py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Avatar name={c.name} index={i} />
          <div>
            <div className="font-medium">{c.name}</div>
            <div className="text-xs text-gray-500">{c.phone}</div>
          </div>
        </div>
        <div className="text-red-500 font-semibold">
        - ₹{Math.abs(c.amount).toLocaleString()}
        </div>
      </li>
    ))}
  </ul>
</Card>

{/* Need to Pay */}
<Card>
  <div className="flex justify-between items-center mb-2">
    <h2 className="text-lg font-semibold">Need to Pay</h2>
    <span className="text-xl font-bold text-green-600">
    - ₹{dummyData.needToPay.reduce((sum, i) => sum + i.amount, 0).toLocaleString()}
    </span>
  </div>

  <div className="flex justify-between text-xs font-medium text-gray-500 mb-1 px-1">
    <span>Distributor</span>
    <span>Amount</span>
  </div>

  <ul className="divide-y divide-gray-200 text-sm">
    {dummyData.needToPay.map((d, i) => (
      <li key={i} className="py-2 flex justify-between">
        <div>
            <div className="font-medium text-blue-600">{d.name}</div>
            <div className="text-xs text-black">{d.Gstin}</div>
          </div>
        <span className="font-semibold">- ₹{d.amount.toLocaleString()}</span>
      </li>
    ))}
  </ul>
</Card>


        {/* Stock Overview */}
        <Card title="Stock Overview">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-700">
                  <th className="px-4 py-2 font-semibold text-center">Type</th>
                  <th className="px-4 py-2 font-semibold text-center">PTR</th>
                  <th className="px-4 py-2 font-semibold text-center">LP</th>
                  <th className="px-4 py-2 font-semibold text-center">MRP</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-white">
                  <td className="px-4 py-2 font-medium text-center">Current</td>
                  <td className="px-4 py-2 text-center">₹{dummyData.stock.current.ptr.toLocaleString()}</td>
                  <td className="px-4 py-2 text-center">₹{dummyData.stock.current.lp.toLocaleString()}</td>
                  <td className="px-4 py-2 text-center">₹{dummyData.stock.current.mrp.toLocaleString()}</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-4 py-2 font-medium text-center">Expired</td>
                  <td className="px-4 py-2 text-center">₹{dummyData.stock.expired.ptr.toLocaleString()}</td>
                  <td className="px-4 py-2 text-center">₹{dummyData.stock.expired.lp.toLocaleString()}</td>
                  <td className="px-4 py-2 text-center">₹{dummyData.stock.expired.mrp.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        {/* Staff Overview */}
        <Card title="Staff Overview">
          <div className="flex justify-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-400 to-green-400 flex items-center justify-center">
              <span className="text-white text-xl font-bold">%</span>
            </div>
          </div>
          <p className="text-center text-sm mt-2 text-gray-600">Sales vs Purchase</p>
        </Card>

        {/* Upcoming PDC */}
        <Card title="Upcoming PDC">
          <p className="text-center text-gray-500">No PDC issued</p>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
