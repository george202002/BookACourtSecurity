import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import UserLayout from "../components/UserLayout";
import { submitSupportRequest, type SupportRequest } from "../services/SupportService";
import TokenUtils from "../utils/TokenUtils";
import type { User } from "../dtos/User";

const HelpSupport = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
    subject: "",
    category: "",
    message: "",
  });

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const userInfo = await TokenUtils.getUserFromToken(navigate);
        setUser(userInfo);
      } catch (error) {
        console.error("Error fetching user info:", error);
      }
    };
    fetchUserInfo();
  }, [navigate]);

  const categories = [
    { value: "booking", label: "Θέματα Κράτησης" },
    { value: "payment", label: "Προβλήματα Πληρωμής" },
    { value: "technical", label: "Τεχνική Υποστήριξη" },
    { value: "account", label: "Διαχείριση Λογαριασμού" },
    { value: "court", label: "Πληροφορίες Γηπέδου" },
    { value: "general", label: "Γενική Ερώτηση" },
    { value: "other", label: "Άλλο" },
  ];

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError("Δεν είναι διαθέσιμες οι πληροφορίες χρήστη. Παρακαλώ ανανεώστε τη σελίδα.");
      return;
    }

    if (!formData.subject.trim() || !formData.category || !formData.message.trim()) {
      setError("Παρακαλώ συμπληρώστε όλα τα υποχρεωτικά πεδία.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

        const supportRequest: SupportRequest = {
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        subject: formData.subject.trim(),
        category: formData.category,
        message: formData.message.trim(),
      };

      const response = await submitSupportRequest(supportRequest, navigate);

      if(!response.ok) {
        const errorData = await response.text();
        setError(errorData || "Αποτυχία υποβολής αιτήματος. Παρακαλώ δοκιμάστε αργότερα.");
        return;
      }else {
        setSubmitSuccess(true);
              setFormData({
          subject: "",
          category: "",
          message: "",
        });
      }
    } catch (error) {
      console.error("Error submitting support request:", error);
      setError("Αποτυχία υποβολής αιτήματος. Παρακαλώ δοκιμάστε αργότερα.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSubmitSuccess(false);
    setError(null);
  };

  if (submitSuccess) {
    return (
      <UserLayout>
        <div className="help-support">
          <div className="page-header">
            <h1 className="page-title">Το Αίτημα Υποβλήθηκε!</h1>
            <p className="page-subtitle">
              Ευχαριστούμε που επικοινωνήσατε μαζί μας. Θα σας απαντήσουμε σύντομα.
            </p>
          </div>

          <div className="dashboard-card success-card">
            <div className="card-content">
              <div className="success-icon">✓</div>
              <h3 className="success-title">Το αίτημα υποστήριξης σας υποβλήθηκε</h3>
              <p className="success-message">
                Λάβαμε το μήνυμά σας και θα απαντήσουμε σύντομα.
                Θα λάβετε ένα email επιβεβαίωσης σύντομα.
              </p>
              <div className="success-actions">
                <button 
                  className="btn btn-primary"
                  onClick={resetForm}
                >
                  Υποβολή Άλλου Αιτήματος
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={() => navigate("/dashboard")}
                >
                  Επιστροφή στον Πίνακα Ελέγχου
                </button>
              </div>
            </div>
          </div>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <div className="help-support">
        <div className="page-header">
          <h1 className="page-title">Βοήθεια & Υποστήριξη</h1>
          <p className="page-subtitle">
            Χρειάζεστε βοήθεια; Είμαστε εδώ για να βοηθήσουμε! Συμπληρώστε τη φόρμα παρακάτω και θα σας απαντήσουμε το συντομότερο δυνατό.
          </p>
        </div>

        {/* Quick Help Section */}
        <div className="dashboard-card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Γρήγορη Βοήθεια</h3>
              <p className="card-subtitle">Συνήθεις ερωτήσεις και γρήγορες λύσεις</p>
            </div>
          </div>
          <div className="card-content">
            <div className="quick-help-grid">
              <div className="help-item">
                <h4>Πώς να κάνω κράτηση γηπέδου;</h4>
                <p>Πηγαίνετε στην "Εύρεση Γηπέδων", επιλέξτε το γήπεδο που προτιμάτε, διαλέξτε ωράριο και ολοκληρώστε την κράτηση.</p>
              </div>
              <div className="help-item">
                <h4>Πώς να ακυρώσω μια κράτηση;</h4>
                <p>Επισκεφθείτε τις "Οι Κρατήσεις μου", βρείτε την κράτησή σας και κάντε κλικ στο "Ακύρωση" (διαθέσιμο μέχρι 1 ώρα πριν την έναρξη).</p>
              </div>
              <div className="help-item">
                <h4>Θέματα πληρωμής;</h4>
                <p>Ελέγξτε το τμήμα "Πληρωμές" για το ιστορικό συναλλαγών σας. Επικοινωνήστε μαζί μας εάν παρατηρήσετε αντιφάσεις.</p>
              </div>
              <div className="help-item">
                <h4>Χρειάζεστε ενημέρωση προφίλ;</h4>
                <p>Κάντε κλικ στο όνομά σας στη πάνω δεξιά γωνία ή πηγαίνετε στις "Ρυθμίσεις Προφίλ" για να ενημερώσετε τις πληροφορίες σας.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="dashboard-card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Επικοινωνία με την Υποστήριξη</h3>
              <p className="card-subtitle">
                Εξακολουθείτε να χρειάζεστε βοήθεια; Στείλτε μας ένα λεπτομερές μήνυμα και θα σας βοηθήσουμε
              </p>
            </div>
          </div>
          <div className="card-content">
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="support-form">
              {/* User Info Display */}
              <div className="form-section">
                <h4 className="section-title">Τα Στοιχεία Σας</h4>
                <div className="user-info-display">
                  <div className="info-item">
                    <label>Όνομα:</label>
                    <span>{user ? `${user.firstName} ${user.lastName}` : "Φόρτωση..."}</span>
                  </div>
                  <div className="info-item">
                    <label>Email:</label>
                    <span>{user?.email || "Φόρτωση..."}</span>
                  </div>
                </div>
              </div>

              {/* Subject */}
              <div className="form-group">
                <label htmlFor="subject" className="form-label required">
                  Θεμα
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Σύντομη περιγραφή του θέματός σας..."
                  required
                  maxLength={100}
                />
                <small className="form-help">
                  {formData.subject.length}/100 χαρακτήρες
                </small>
              </div>

              {/* Category */}
              <div className="form-group">
                <label htmlFor="category" className="form-label required">
                  Κατηγορια
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="form-select"
                  required
                >
                  <option value="">Επιλέξτε κατηγορία...</option>
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              

              {/* Message */}
              <div className="form-group">
                <label htmlFor="message" className="form-label required">
                  Μηνυμα
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  className="form-textarea"
                  placeholder="Παρακαλώ περιγράψτε λεπτομερώς το θέμα σας. Συμπεριλάβετε τυχόν μηνύματα σφάλματος, βήματα αναπαραγωγής του προβλήματος ή σχετικές πληροφορίες κράτησης..."
                  required
                  rows={6}
                  maxLength={1000}
                />
                <small className="form-help">
                  {formData.message.length}/1000 χαρακτήρες
                </small>
              </div>

              {/* Submit Button */}
              <div className="form-actions">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? "Υποβολή..." : "Υποβολη Αιτηματος"}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => navigate("/dashboard")}
                >
                  Ακυρωση
                </button>
              </div>
            </form>
          </div>
        </div>

        
      </div>
    </UserLayout>
  );
};

export default HelpSupport;
