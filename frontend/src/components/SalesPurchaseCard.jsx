import React, { useState } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const salesDataByRange = {
  Today: { sales: 3200, purchases: 14912, orders: { sales: 2, purchases: 7 }, date: "1 Mar" },
  "7 days": { sales: 270, purchases: 84120, orders: { sales: 18, purchases: 31 }, date: "Last 7 days" },
  "30 days": { sales: 1280, purchases: 245630, orders: { sales: 112, purchases: 176 }, date: "Last 30 days" },
  "60 days": { sales: 2110, purchases: 422220, orders: { sales: 178, purchases: 302 }, date: "Last 60 days" },
};

const Tabs = ["Today", "7 days", "30 days", "60 days"];

const SalesPurchaseCard = () => {
  const [activeTab, setActiveTab] = useState("Today");
  const data = salesDataByRange[activeTab];

  const chartData = {
    labels: [data.date],
    datasets: [
      {
        label: "Sales",
        data: [data.sales],
        backgroundColor: "#9ACD32", // Yellow
      },
      {
        label: "Purchase",
        data: [data.purchases],
        backgroundColor: "#1D4ED8", // Darker blue
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function (value) {
            return "₹" + value.toLocaleString();
          },
        },
      },
    },
  };

  return (
    <div className="rounded-xl shadow-md p-5 bg-white w-full">
      <div className="flex gap-6 border-b mb-4 text-sm font-medium">
        {Tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2 ${activeTab === tab ? "border-b-2 border-black text-black" : "text-gray-400"}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex justify-between items-center mb-4">
        <div>
          <div className="text-blue-600 font-bold text-2xl">₹{data.sales.toLocaleString()}</div>
          <div className="text-sm text-gray-500">Sales ({data.orders.sales} Orders)</div>
        </div>
        <div>
          <div className="text-green-600 font-bold text-2xl">₹{data.purchases.toLocaleString()}</div>
          <div className="text-sm text-gray-500">Purchase ({data.orders.purchases} Orders)</div>
        </div>
      </div>

      <Bar data={chartData} options={options} />
    </div>
  );
};

export default SalesPurchaseCard;
