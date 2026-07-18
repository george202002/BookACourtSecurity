import { useState, useEffect, useRef } from "react";
import Login from "../components/Login";
import Register from "../components/Register";
import ForgotPassword from "../components/ForgotPassword";

const LandingPage = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [visibleSteps, setVisibleSteps] = useState<number[]>([]);
  const stepsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);

      // Check which steps are visible
      const newVisibleSteps: number[] = [];
      stepsRef.current.forEach((step, index) => {
        if (step) {
          const rect = step.getBoundingClientRect();
          const windowHeight = window.innerHeight;
          if (rect.top < windowHeight * 0.9 && rect.bottom > 0) {
            newVisibleSteps.push(index);
          }
        }
      });
      setVisibleSteps(newVisibleSteps);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const closeAllDialogs = () => {
    setShowLogin(false);
    setShowRegister(false);
    setShowForgotPassword(false);
  };

  const switchToLogin = () => {
    setShowRegister(false);
    setShowForgotPassword(false);
    setShowLogin(true);
  };

  const switchToRegister = () => {
    setShowLogin(false);
    setShowForgotPassword(false);
    setShowRegister(true);
  };

  const switchToForgotPassword = () => {
    setShowLogin(false);
    setShowRegister(false);
    setShowForgotPassword(true);
  };

  return (
    <div className="modern-landing">
      {/* Modern Header */}
      <header className="modern-header">
        <div className="header-container">
          <div className="header-logo">
            <div className="header-logo-text">
              <span className="logo-highlight">BookA</span>Court
            </div>
          </div>

          <nav className="header-navigation">
            <a href="#features" className="nav-link">Χαρακτηριστικά</a>
            <a href="#how-it-works" className="nav-link">Πώς Λειτουργεί</a>
            <a href="#contact" className="nav-link">Επικοινωνία</a>
          </nav>

          <div className="header-auth">
            <button
              className="auth-btn auth-btn-secondary"
              onClick={() => setShowLogin(true)}
            >
              Σύνδεση
            </button>
            <button
              className="auth-btn auth-btn-primary"
              onClick={() => setShowRegister(true)}
            >
              Ξεκινήστε
            </button>
          </div>
        </div>
      </header>

      <Login
        isOpen={showLogin}
        onClose={closeAllDialogs}
        onSwitchToRegister={switchToRegister}
        onSwitchToForgotPassword={switchToForgotPassword}
      />

      <Register
        isOpen={showRegister}
        onClose={closeAllDialogs}
        onSwitchToLogin={switchToLogin}
      />

      <ForgotPassword
        isOpen={showForgotPassword}
        onClose={closeAllDialogs}
        onSwitchToLogin={switchToLogin}
      />

      {/* Hero Section with Parallax */}
      <section className="hero-section">
        <div className="hero-background">
          <div className="floating-courts">
            <div className="court-icon court-1" style={{ transform: `translateY(${scrollY * 0.3}px)` }}>
              🎾
            </div>
            <div className="court-icon court-2" style={{ transform: `translateY(${scrollY * 0.2}px)` }}>
              🏀
            </div>
            <div className="court-icon court-3" style={{ transform: `translateY(${scrollY * 0.4}px)` }}>
              ⚽
            </div>
            <div className="court-icon court-4" style={{ transform: `translateY(${scrollY * 0.25}px)` }}>
              🏐
            </div>
          </div>
          {/* Animated Sport Actions */}
          <div className="sport-animation tennis-serve-animation" style={{ transform: `translateY(${scrollY * 0.15}px)` }}>
            <div className="tennis-racket"></div>
            <div className="tennis-ball"></div>
          </div>

          <div className="sport-animation football-goal-animation" style={{ transform: `translateY(${scrollY * 0.25}px)` }}>
            <div className="football-net"></div>
            <div className="football-ball"></div>
          </div>

          <div className="sport-animation basketball-hoop-animation" style={{ transform: `translateY(${scrollY * 0.35}px)` }}>
            <div className="basketball-hoop"></div>
            <div className="basketball-ball"></div>
          </div>
        </div>
        
        <div className="hero-content">

          
          <h1 className="hero-title">
            Κάντε κράτηση, Παίξτε, <span className="title-highlight">Βρείτε συμπαίκτες</span>
          </h1>
          
          <p className="hero-subtitle">
            Βρείτε το ιδανικό γήπεδο για τένις, πάντελ, μπάσκετ ή ποδόσφαιρο.
            Συμμετέχετε σε συναρπαστικούς αγώνες ή διαχειριστείτε τις αθλητικές σας εγκαταστάσεις με ευκολία.
          </p>
          
          <div className="hero-actions">
            <button
              className="hero-btn hero-btn-primary"
              onClick={() => setShowRegister(true)}
            >
              <span>Ξεκινήστε να Παίζετε</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

          </div>


        </div>
      </section>

      {/* Animated Features Section */}
      <section className="features-section" id="features">
        <div className="features-container">
          <div className="section-header">
            <h2 className="section-title">Όλα όσα Χρειάζεστε για να Παίξετε</h2>
            <p className="section-subtitle">
              Είτε είστε παίκτης που ψάχνει για γήπεδα είτε ιδιοκτήτης επιχείρησης που διαχειρίζεται εγκαταστάσεις,
              σας καλύπτουμε.
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <img src="/images/landing/feature-booking.svg" alt="Easy booking" />
              </div>
              <h3 className="feature-title">Άμεση Κράτηση</h3>
              <p className="feature-description">
                Κάντε κράτηση γηπέδων άμεσα με διαθεσιμότητα σε πραγματικό χρόνο. Τέλος τα τηλεφωνήματα και η αναμονή.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <img src="/images/landing/feature-join.svg" alt="Join matches" />
              </div>
              <h3 className="feature-title">Συμμετοχή σε Αγώνες</h3>
              <p className="feature-description">
                Βρείτε παίκτες για τα παιχνίδια σας ή συμμετέχετε σε υπάρχοντες αγώνες στην περιοχή σας.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <img src="/images/landing/feature-manage.svg" alt="Manage facilities" />
              </div>
              <h3 className="feature-title">Διαχείριση Εγκαταστάσεων</h3>
              <p className="feature-description">
                Πλήρης σουίτα διαχείρισης και δημιουργίας γηπέδων και κρατήσεων για ιδιοκτήτες.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <img src="/images/landing/feature-payment.svg" alt="Secure payments" />
              </div>
              <h3 className="feature-title">Ασφαλείς Πληρωμές</h3>
              <p className="feature-description">
                Ασφαλής επεξεργασία πληρωμών με πολλαπλές επιλογές πληρωμής.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works" id="how-it-works">
        <div className="how-container">
          <h2 className="section-title">Πώς Λειτουργεί</h2>
          
          <div className="steps-grid">
            <div
              className={`step-item ${visibleSteps.includes(0) ? 'animate-in' : ''}`}
              ref={(el) => { stepsRef.current[0] = el; }}
            >
              <div className="step-number">01</div>
              <div className="step-content">
                <h3>Βρείτε Γήπεδα</h3>
                <p>Περιηγηθείτε στα διαθέσιμα γήπεδα της περιοχής σας με λεπτομερείς πληροφορίες.</p>
                <img src="/images/landing/step-find.png" alt="Find courts" className="step-image" />
              </div>
            </div>

            <div
              className={`step-item ${visibleSteps.includes(1) ? 'animate-in' : ''}`}
              ref={(el) => { stepsRef.current[1] = el; }}
            >
              <div className="step-number">02</div>
              <div className="step-content">
                <h3>Κράτηση & Πληρωμή</h3>
                <p>Επιλέξτε την προτιμώμενη ώρα και πληρώστε ασφαλώς online.</p>
                <img src="/images/landing/step-book.png" alt="Book courts" className="step-image" />
              </div>
            </div>

            <div
              className={`step-item ${visibleSteps.includes(2) ? 'animate-in' : ''}`}
              ref={(el) => { stepsRef.current[2] = el; }}
            >
              <div className="step-number">03</div>
              <div className="step-content">
                <h3>Παίξτε & Διασκεδάστε</h3>
                <p>Ελάτε στο γήπεδο και παίξτε είτε με την παρέα σας είτε με άλλους παίκτες.</p>
                <img src="/images/landing/step-play.png" alt="Play and enjoy" className="step-image" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sports Types Showcase */}
      <section className="sports-showcase">
        <div className="sports-container">
          <h2 className="section-title">Παίξτε τα Αγαπημένα σας Αθλήματα</h2>
          
          <div className="sports-grid">
            <div className="sport-card tennis">
              <img src="/images/landing/sport-tennis.png" alt="Tennis courts" />
              <div className="sport-overlay">
                <h3>Τένις</h3>
                <p>Premium γήπεδα τένις σε επαγγελματικές εγκαταστάσεις</p>
              </div>
            </div>

            <div className="sport-card padel">
              <img src="/images/landing/sport-padel.png" alt="Padel courts" />
              <div className="sport-overlay">
                <h3>Πάντελ</h3>
                <p>Μοντέρνα γήπεδα πάντελ</p>
              </div>
            </div>

            <div className="sport-card basketball">
              <img src="/images/landing/sport-basketball.png" alt="Basketball courts" />
              <div className="sport-overlay">
                <h3>Μπάσκετ</h3>
                <p>Εσωτερικά και εξωτερικά γήπεδα μπάσκετ</p>
              </div>
            </div>

            <div className="sport-card football">
              <img src="/images/landing/sport-football.png" alt="Football fields" />
              <div className="sport-overlay">
                <h3>Ποδόσφαιρο</h3>
                <p>Γήπεδα ποδοσφαίρου πλήρους μεγέθους και 5x5</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-container">
          <div className="cta-content">
            <h2 className="cta-title">Έτοιμοι να Ξεκινήσετε να Παίζετε;</h2>
            <p className="cta-subtitle">
              Γίνετε μέλος μαζί με χιλιάδες άλλους παίκτες που έχουν βρει τα ιδανικά τους γήπεδα με το BookACourt
            </p>
            <div className="cta-actions">
              <button
                className="cta-btn cta-btn-primary"
                onClick={() => setShowRegister(true)}
              >
                Ξεκινήστε Δωρεάν
              </button>
              <a href="mailto:support@bookacourt.local" className="cta-btn cta-btn-secondary">
                Μάθετε Περισσότερα
              </a>
            </div>
          </div>
          <div className="cta-visual">
            <img src="/images/landing/cta-players.png" alt="Happy players" />
          </div>
        </div>
      </section>

      {/* Modern Footer */}
      <footer className="modern-footer" id="contact">
        <div className="footer-container">
          <div className="footer-content">
            <div className="footer-brand">
              <div className="footer-logo">
                <div className="footer-logo-text">
                  <span className="logo-highlight">BookA</span>Court
                </div>
              </div>
              <p className="footer-description">
                Η απόλυτη πλατφόρμα για κρατήσεις γηπέδων και διαχείριση αθλητικών εγκαταστάσεων.
                Συνδεθείτε, παίξτε και διαχειριστείτε με ευκολία.
              </p>
            </div>
          </div>

          <div className="footer-bottom">
            <div className="footer-legal">
              <p>&copy; 2025 BookACourt. All rights reserved.</p>
              <div className="legal-links">
                <a href="#" className="legal-link">Privacy Policy</a>
                <a href="#" className="legal-link">Terms of Service</a>
              </div>
            </div>
            <div className="footer-attribution">
              <p>Developed and maintained by <a href="https://www.linkedin.com/in/george-apostolou-333106194" target="_blank" rel="noopener noreferrer" className="attribution-link">George Apostolou</a></p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
