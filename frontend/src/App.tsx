import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import UserDashboard from "./pages/UserDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ManageCourts from "./pages/ManageCourts";
import ManageBookings from "./pages/ManageBookings";
import FindCourts from "./pages/FindCourts";
import FindBookings from "./pages/FindBookings";
import MyBookings from "./pages/MyBookings";
import Payments from "./pages/Payments";
import AccountManagement from "./pages/AccountManagement";
import HelpSupport from "./pages/HelpSupport";
import ProtectedRoute from "./components/ProtectedRoute";
import UserDashboardHome from "./pages/UserDashboardHome";
import AdminDashboardHome from "./pages/AdminDashboardHome";
import AdminHelpSupport from "./pages/AdminHelpSupport";
import LandingPage from "./pages/LandingPage";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCancel from "./pages/PaymentCancel";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <UserDashboard />
            </ProtectedRoute>
          }
        >
          {/* Nested routes under /dashboard */}
          <Route index element={<UserDashboardHome />} />
          <Route path="find-courts" element={<FindCourts />} />
                    <Route path="find-bookings" element={<FindBookings />} />
          <Route path="my-bookings" element={<MyBookings />} />
          <Route path="payments" element={<Payments />} />
          <Route path="help" element={<HelpSupport />} />
        </Route>
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute adminOnly>
              <AdminDashboard />
            </ProtectedRoute>
          }
        >
          {/* Nested routes under /admin-dashboard */}
                    <Route index element={<AdminDashboardHome />} />
          <Route path="manage-courts" element={<ManageCourts />} />
          <Route path="manage-bookings" element={<ManageBookings />} />
          <Route path="help" element={<AdminHelpSupport />} />
        </Route>
        <Route path="/account-management" element={<AccountManagement />} />
        <Route
          path="/payment-success"
          element={
            <ProtectedRoute>
              <PaymentSuccess />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payment-cancel"
          element={
            <ProtectedRoute>
              <PaymentCancel />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
