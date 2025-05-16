import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AdminLayout from './components/AdminLayout';
import AdminDashboard from './components/AdminDashboard';
import PurchasePage from './pages/PurchasePage';
import PurchaseNextStep from './pages/PurchaseNextStep';
import PurchaseList from './pages/PurchaseList';
import PurchaseReturn from './pages/PurchaseReturn';
import Profile from "./pages/Profile";
import LoginPage from './pages/LoginPage';
import SalesPage from './pages/SalesPage';
import SaleList from './pages/SaleList';
import SaleReturn from './pages/SaleReturn';
import SalesNextStep from './pages/SalesNextStep';
import ShortBook from './pages/ShortBook';
import PurchaseOrder from './pages/PurchaseOrder';
import OrderAssistant from './components/OrderAssistant';
import PaymentDetails from './pages/PaymentInDetails';
import PaymentOut from './pages/PaymentOut';
import Distributors from './pages/Distributors';
import Inventory from './pages/Inventory';


function App() {
  return (
    <Router>
      <Routes>
<Route path="/login" element={<LoginPage />} />
        <Route element={<AdminLayout />}>
          <Route path="/" element={<AdminDashboard />} />
          <Route path="/purchase/bills" element={<PurchaseList />} />
          <Route path="/purchase/new" element={<PurchasePage />} />
          <Route path="/purchase-next-step/:purchaseID" element={<PurchaseNextStep />} />
          <Route path="/purchase/return" element={<PurchaseReturn />} />
          <Route path="/sale/new" element={<SalesPage/>} />
          <Route path="/sale-next-step/:saleID" element={<SalesNextStep/>} />
          <Route path="/sale/invoices" element={<SaleList/>} />
          <Route path="/sale/payment-in" element={<PaymentDetails/>} />
          <Route path="/purchase/payment-out" element={<PaymentOut/>} />
          <Route path="/sale/return" element={<SaleReturn/>} />
          <Route path="/distributors" element={<Distributors/>} />
          <Route path="/inventory" element={<Inventory/>} />
          <Route path="/purchase/shortbook" element={<ShortBook/>} />
          <Route path="/purchase/order" element={<PurchaseOrder />} />
          <Route path="/orderassistant" element={<OrderAssistant />} />
          <Route path="/purchase-orders/:purchaseOrderID" element={<PurchaseOrder />} />
<Route path="/profile" element={<Profile />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
