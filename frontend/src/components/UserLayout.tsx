import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import authService from "../services/AuthService";
import type { User } from "../dtos/User";

interface UserLayoutProps {
  children: React.ReactNode;
}

const UserLayout: React.FC<UserLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userInfo, setUserInfo] = useState<User | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const user = authService.getStoredUser();
    setUserInfo(user);
  }, []);

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
    navigate("/");
  };

  const isActive = (path: string) => {
    if (path === "/dashboard" && location.pathname === "/dashboard") {
      return true;
    }
    return location.pathname === path;
  };

  // Extract first name from fullName
  const getFirstName = () => {
    if (!userInfo?.fullName) return "Παίκτη";
    return userInfo.fullName.split(" ")[0];
  };

  const getInitials = () => {
    if (!userInfo?.fullName) return "U";
    const parts = userInfo.fullName.split(" ");
    return parts[0]?.[0] || "U";
  };

  return (
    <div className="d-flex min-vh-100 bg-light">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="mobile-menu-overlay show"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Enhanced Sidebar */}
      <aside
        className={`d-flex flex-column bg-white shadow-sm position-fixed h-100 ${isMobileMenuOpen ? "translate-0" : ""}`}
        style={{
          width: "280px",
          zIndex: 1000,
          transform: isMobileMenuOpen ? "translateX(0)" : undefined,
          transition: "transform 0.3s ease",
        }}
      >
        {/* Sidebar Header with gradient - uses custom class */}
        <div className="sidebar-header text-white p-4 position-relative">
          <div className="d-flex align-items-center gap-3 position-relative" style={{ zIndex: 1 }}>
            <div
              className="logo-icon-backdrop d-flex align-items-center justify-content-center rounded-3 fw-bold fs-4"
              style={{ width: "48px", height: "48px" }}
            >
              B
            </div>
            <div className="fs-5 fw-bold">
              <span style={{ color: "#fff" }}>BookA</span>
              <span style={{ opacity: 0.9 }}>Court</span>
            </div>
          </div>
          <div className="mt-3 small opacity-90 position-relative" style={{ zIndex: 1 }}>
            Καλώς ήρθατε, {getFirstName()}!
          </div>
        </div>

        <nav className="flex-grow-1 overflow-auto p-3">
          <button
            className={`nav-item-custom btn w-100 text-start mb-1 py-2 px-3 rounded-2 ${isActive("/dashboard") ? "btn-primary" : "btn-light"}`}
            onClick={() => navigate("/dashboard")}
          >
            Αρχική
          </button>

          <div className="mt-4">
            <div className="small fw-semibold text-secondary text-uppercase mb-2 px-2">Ας Παιξουμε!</div>
            <button
              className={`nav-item-custom btn w-100 text-start mb-1 py-2 px-3 rounded-2 ${isActive("/dashboard/find-courts") ? "btn-primary" : "btn-light"}`}
              onClick={() => navigate("/dashboard/find-courts")}
            >
              Αναζήτηση Γηπέδων
            </button>
            <button
              className={`nav-item-custom btn w-100 text-start mb-1 py-2 px-3 rounded-2 ${isActive("/dashboard/find-bookings") ? "btn-primary" : "btn-light"}`}
              onClick={() => navigate("/dashboard/find-bookings")}
            >
              Αναζήτηση Κρατήσεων
            </button>
          </div>

          <div className="mt-4">
            <div className="small fw-semibold text-secondary text-uppercase mb-2 px-2">Τα Πραγματα μου</div>
            <button
              className={`nav-item-custom btn w-100 text-start mb-1 py-2 px-3 rounded-2 ${isActive("/dashboard/my-bookings") ? "btn-primary" : "btn-light"}`}
              onClick={() => navigate("/dashboard/my-bookings")}
            >
              Οι Κρατήσεις μου
            </button>
            <button
              className={`nav-item-custom btn w-100 text-start mb-1 py-2 px-3 rounded-2 ${isActive("/dashboard/payments") ? "btn-primary" : "btn-light"}`}
              onClick={() => navigate("/dashboard/payments")}
            >
              Πληρωμές
            </button>
          </div>

          <div className="mt-4">
            <div className="small fw-semibold text-secondary text-uppercase mb-2 px-2">Λογαριασμος</div>
            <button
              className={`nav-item-custom btn w-100 text-start mb-1 py-2 px-3 rounded-2 ${isActive("/account-management") ? "btn-primary" : "btn-light"}`}
              onClick={() => navigate("/account-management")}
            >
              Ρυθμίσεις Προφίλ
            </button>
            <button
              className={`nav-item-custom btn w-100 text-start mb-1 py-2 px-3 rounded-2 ${isActive("/dashboard/help") ? "btn-primary" : "btn-light"}`}
              onClick={() => navigate("/dashboard/help")}
            >
              Βοήθεια & Υποστήριξη
            </button>
          </div>

          <hr className="my-4" />

          <button
            className="btn btn-outline-danger w-100 text-start py-2 px-3 rounded-2"
            onClick={handleLogout}
          >
            Αποσύνδεση
          </button>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-grow-1" style={{ marginLeft: "280px" }}>
        {/* Top Bar with Friendly Design */}
        <header className="bg-white shadow-sm px-4 py-3 d-flex justify-content-between align-items-center sticky-top">
          {/* Mobile Menu Button */}
          <button
            className="btn btn-light d-lg-none p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <span className={`hamburger ${isMobileMenuOpen ? "open" : ""}`}>
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>

          <div className="d-none d-lg-block">
            <div className="text-secondary">
              {new Date().toLocaleDateString("el-GR", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </div>
          </div>

          <div
            className="d-flex align-items-center gap-3"
            onClick={() => navigate("/account-management")}
            style={{ cursor: "pointer" }}
            title="Προβολή Προφίλ"
          >
            <div className="text-end d-none d-md-block">
              <div className="fw-semibold">{userInfo?.fullName || "Player"}</div>
              <div className="small text-secondary">Μέλος</div>
            </div>
            <div
              className="user-avatar-gradient d-flex align-items-center justify-content-center text-white rounded-circle fw-bold"
              style={{ width: "44px", height: "44px" }}
            >
              {getInitials()}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-4">{children}</div>
      </main>

      {/* Responsive Styles */}
      <style>{`
        @media (max-width: 991.98px) {
          aside {
            transform: translateX(-100%);
          }
          aside.translate-0 {
            transform: translateX(0) !important;
          }
          main {
            margin-left: 0 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default UserLayout;
