import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import TokenUtils from "../utils/TokenUtils";
import type { User } from "../dtos/User";
import MessageModal, { type MessageType } from "../components/MessageModal";
import LoadingSkeleton from "../components/LoadingSkeleton";
import { updateProfile, type UpdateProfileRequest } from "../services/UserService";
import authService from "../services/AuthService";

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

const AccountManagement = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [sendingReset, setSendingReset] = useState(false);

  // Determine which dashboard to return to based on referrer or token
  const getDashboardPath = async () => {
    // Check if user came from admin dashboard or is an admin
    const role = await TokenUtils.getRole(navigate);

    return role === "ADMIN" ? "/admin-dashboard" : "/dashboard";
  };
  const [isEditing, setIsEditing] = useState(false);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Provider checks
  const [hasPasswordProvider, setHasPasswordProvider] = useState(false);
  const [hasGoogleProvider, setHasGoogleProvider] = useState(false);

  // Message modal states
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageType, setMessageType] = useState<MessageType>("success");
  const [messageTitle, setMessageTitle] = useState("");
  const [messageText, setMessageText] = useState("");

  // Load user data from token
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const user = await TokenUtils.getUserFromToken(navigate);
        if (user) {
          setCurrentUser(user);
          setUserProfile({
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone || "",
          });
        }

        // Check auth providers
        setHasPasswordProvider(authService.hasPasswordProvider());
        setHasGoogleProvider(authService.hasGoogleProvider());
      } catch (error) {
        console.error("Error loading user data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [navigate]);

  const validateProfile = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!userProfile.firstName.trim()) {
      newErrors.firstName = "Το όνομα είναι υποχρεωτικό";
    } else if (userProfile.firstName.trim().length < 2) {
      newErrors.firstName = "Το όνομα πρέπει να έχει τουλάχιστον 2 χαρακτήρες";
    }
    if (!userProfile.lastName.trim()) {
      newErrors.lastName = "Το επίθετο είναι υποχρεωτικό";
    } else if (userProfile.lastName.trim().length < 2) {
      newErrors.lastName = "Το επίθετο πρέπει να έχει τουλάχιστον 2 χαρακτήρες";
    }

    if (!userProfile.phone.trim()) {
      newErrors.phone = "Το τηλέφωνο είναι υποχρεωτικό";
    } else if (!/^(\+30|0030)?6\d{9}$/.test(userProfile.phone.replace(/\s/g, ""))) {
      newErrors.phone = "Παρακαλώ εισάγετε έγκυρο ελληνικό κινητό (π.χ. 69xxxxxxxx)";
    }

    if (userProfile.firstName.trim() === currentUser?.firstName &&
        userProfile.lastName.trim() === currentUser?.lastName &&
        userProfile.phone.trim() === (currentUser?.phone || "")) {
          newErrors.general = "Δεν έγιναν αλλαγές στο προφίλ";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProfileSave = async () => {
    if (!validateProfile() || !currentUser) return;

    try {
      setLoading(true);
      setErrors({});

      const fullName = `${userProfile.firstName.trim()} ${userProfile.lastName.trim()}`;
      const updateData: UpdateProfileRequest = {
        fullName,
        phoneNumber: userProfile.phone || "",
      };

      const response = await updateProfile(updateData, navigate);

      if (!response.ok) {
        const errorData = await response.text();
        if(errorData.includes("Phone already exists")) {
          setErrors({ phone: "Αυτός ο αριθμός τηλεφώνου είναι ήδη σε χρήση." });
        } else {
          setErrors({ generalProfile: "Αποτυχία ενημέρωσης προφίλ." });
        }
      } else {
        setIsEditing(false);
        setMessageType("success");
        setMessageTitle("Επιτυχία");
        setMessageText("Το προφίλ ενημερώθηκε επιτυχώς!");
        setShowMessageModal(true);
        // Update the current user data to reflect changes
        const updatedUser = {
          ...currentUser,
          firstName: userProfile.firstName,
          lastName: userProfile.lastName,
          fullName,
          phone: userProfile.phone,
          phoneNumber: userProfile.phone,
        };
        setCurrentUser(updatedUser);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setErrors({ general: "Αποτυχία ενημέρωσης προφίλ. Παρακαλώ δοκιμάστε ξανά." });
    } finally {
      setLoading(false);
    }
  };

  const handleSendPasswordReset = async () => {
    if (!currentUser?.email) return;

    try {
      setSendingReset(true);
      await authService.sendPasswordReset(currentUser.email);
      setMessageType("success");
      setMessageTitle("Email Απεστάλη");
      setMessageText("Ένας σύνδεσμος επαναφοράς κωδικού έχει σταλεί στο email σας.");
      setShowMessageModal(true);
    } catch (error) {
      console.error("Error sending password reset:", error);
      setMessageType("error");
      setMessageTitle("Σφάλμα");
      setMessageText("Αποτυχία αποστολής email επαναφοράς. Παρακαλώ δοκιμάστε ξανά.");
      setShowMessageModal(true);
    } finally {
      setSendingReset(false);
    }
  };

  const tabs = [
    { id: "profile", label: "Προφιλ" },
    { id: "security", label: "Ασφαλεια" },
  ];

  if (loading && !currentUser) {
    return (
      <div className="account-management-page">
        <div className="account-management-container">
          <div className="account-header">
            <div className="header-content">
              <h1 className="page-title">Διαχείριση Λογαριασμού</h1>
              <p className="page-subtitle">Διαχειριστείτε το προφίλ και τις ρυθμίσεις ασφαλείας σας</p>
            </div>
          </div>
          <LoadingSkeleton variant="card" count={2} />
        </div>
      </div>
    );
  }

  return (
    <div className="account-management-page">
      <div className="account-management-container">
        <div className="account-header">
          <div className="header-content">
            <div className="mobile-back-nav">
              <button
                className="mobile-back-button"
                onClick={async () => navigate(await getDashboardPath())}
                aria-label="Back to dashboard"
              >
                <span className="back-arrow">←</span>
                <span className="back-text">Πίνακας Ελέγχου</span>
              </button>
            </div>
            <h1 className="page-title">Διαχείριση Λογαριασμού</h1>
            <p className="page-subtitle">
              Διαχειριστείτε το προφίλ και τις ρυθμίσεις ασφαλείας σας
            </p>
          </div>
          <button
            className="btn btn-secondary desktop-back-button"
            onClick={async () => navigate(await getDashboardPath())}
          >
            Επιστροφή στην Αρχική
          </button>
        </div>

        <div className="account-content">
          {/* Tabs Navigation */}
          <div className="tabs-nav">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`tab-button ${activeTab === tab.id ? "active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="tab-label">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Contents */}
          <div className="tab-content">
            {/* Profile Tab */}
            {activeTab === "profile" && (
              <div className="profile-section">
                <div className="section-header">
                  <h2 className="section-title">Στοιχεία Προφίλ</h2>
                  <button
                    className={`btn ${isEditing ? "btn-primary" : "btn-secondary"}`}
                    onClick={() =>
                      isEditing ? handleProfileSave() : setIsEditing(true)
                    }
                  >
                    {isEditing ? "Αποθηκευση Αλλαγων" : "Επεξεργασια Προφιλ"}
                  </button>
                </div>

                <div className="profile-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Ονομα</label>
                      <input
                        type="text"
                        className={`form-input ${errors.firstName ? "error" : ""}`}
                        value={userProfile.firstName}
                        onChange={(e) =>
                          setUserProfile({
                            ...userProfile,
                            firstName: e.target.value,
                          })
                        }
                        disabled={!isEditing}
                      />
                      {errors.firstName && (
                        <span className="error-message">
                          {errors.firstName}
                        </span>
                      )}
                    </div>
                    <div className="form-group">
                      <label className="form-label">Επωνυμο</label>
                      <input
                        type="text"
                        className={`form-input ${errors.lastName ? "error" : ""}`}
                        value={userProfile.lastName}
                        onChange={(e) =>
                          setUserProfile({
                            ...userProfile,
                            lastName: e.target.value,
                          })
                        }
                        disabled={!isEditing}
                      />
                      {errors.lastName && (
                        <span className="error-message">{errors.lastName}</span>
                      )}
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Διευθυνση Email</label>
                      <input
                        type="email"
                        className="form-input"
                        value={userProfile.email}
                        disabled={true}
                        title="Το email δεν μπορεί να αλλάξει"
                      />
                      <span className="form-hint">Το email διαχειρίζεται από το Firebase και δεν μπορεί να αλλάξει</span>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Τηλεφωνο</label>
                      <input
                        type="tel"
                        className={`form-input ${errors.phone ? "error" : ""}`}
                        value={userProfile.phone}
                        onChange={(e) =>
                          setUserProfile({
                            ...userProfile,
                            phone: e.target.value,
                          })
                        }
                        disabled={!isEditing}
                      />
                      {errors.phone && (
                        <span className="error-message">{errors.phone}</span>
                      )}
                    </div>
                  </div>
                  {errors.generalProfile && (
                    <div className="error-message">
                      {errors.generalProfile}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === "security" && (
              <div className="security-section">
                <div className="section-header">
                  <h2 className="section-title">Ρυθμίσεις Ασφαλείας</h2>
                </div>

                {/* Connected Providers Info */}
                <div className="security-card">
                  <h3 className="card-title">Μέθοδοι Σύνδεσης</h3>
                  <div className="providers-list">
                    {hasPasswordProvider && (
                      <div className="provider-item">
                        <span className="provider-icon">✉️</span>
                        <span className="provider-name">Email & Κωδικός</span>
                        <span className="provider-status connected">Συνδεδεμένο</span>
                      </div>
                    )}
                    {hasGoogleProvider && (
                      <div className="provider-item">
                        <svg className="provider-icon google-icon" viewBox="0 0 24 24" width="20" height="20">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        <span className="provider-name">Google</span>
                        <span className="provider-status connected">Συνδεδεμένο</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Password Change - Only show if user has password provider */}
                {hasPasswordProvider ? (
                  <div className="security-card">
                    <h3 className="card-title">Αλλαγή Κωδικού Πρόσβασης</h3>
                    <p className="card-description">
                      Για να αλλάξετε τον κωδικό πρόσβασής σας, θα σας στείλουμε έναν σύνδεσμο επαναφοράς στο email σας.
                      Ακολουθήστε τις οδηγίες στο email για να ορίσετε νέο κωδικό.
                    </p>
                    <div className="form-group">
                      <label className="form-label">Email Λογαριασμού</label>
                      <input
                        type="email"
                        className="form-input"
                        value={currentUser?.email || ""}
                        disabled={true}
                      />
                    </div>
                    <button
                      className={`btn btn-primary ${sendingReset ? "loading" : ""}`}
                      onClick={handleSendPasswordReset}
                      disabled={sendingReset}
                    >
                      {sendingReset ? "Αποστολή..." : "Αποστολή Συνδέσμου Επαναφοράς"}
                    </button>
                  </div>
                ) : (
                  <div className="security-card">
                    <h3 className="card-title">Κωδικός Πρόσβασης</h3>
                    <p className="card-description info">
                      Ο λογαριασμός σας είναι συνδεδεμένος μόνο με Google.
                      Δεν υπάρχει κωδικός πρόσβασης για αλλαγή.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Message Modal */}
      <MessageModal
        isOpen={showMessageModal}
        type={messageType}
        title={messageTitle}
        message={messageText}
        onClose={() => setShowMessageModal(false)}
        confirmText="Εντάξει"
      />
    </div>
  );
};

export default AccountManagement;
