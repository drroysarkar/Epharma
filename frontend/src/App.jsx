import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AdminLayout from './components/AdminLayout';
import AdminDashboard from './components/AdminDashboard';
import PurchasePage from './pages/PurchasePage';
import PurchaseNextStep from './pages/PurchaseNextStep';
import PurchaseList from './pages/PurchaseList';
import PurchaseReturn from './pages/PurchaseReturn';
import InvoicePage from './pages/InvoicePage';
import InvoicePdf from './pages/InvoicePDF';
import InvoicePages from './pages/InvoicePDF';

function App() {
  return (
    <Router>
      <Routes>
        <Route element={<AdminLayout />}>
          <Route path="/" element={<AdminDashboard />} />
          <Route path="/purchase/bills" element={<PurchaseList />} />
          <Route path="/purchase/new" element={<PurchasePage />} />
          <Route path="/purchase-next-step/:purchaseID" element={<PurchaseNextStep />} />
          <Route path="/purchase/return" element={<PurchaseReturn />} />
          <Route path="/invoice" element={<InvoicePages/>} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
