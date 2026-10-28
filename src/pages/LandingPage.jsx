
import {
  ArrowRight,
  Gamepad2,
  BarChart3,
  Zap,
  ShieldCheck,
  Users,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import LatestResults from "../components/landing/LatestResults";
import { sendContactMessage } from "../services/userService";
import getErrorMessage from "../utils/getErrorMessage";
import "../styles/landing-page.css";

const games = [
  {
    title: "Single Digit",
    description: "Explore single digit games",
    number: "1",
    type: "single",
    path: "/user/single-digit",
  },
  {
    title: "Jodi Digit",
    description: "Explore jodi digit games",
    number: "72",
    type: "jodi",
    path: "/user/jodi-digit",
  },
  {
    title: "Single Pana",
    description: "Explore single pana games",
    number: "123",
    type: "single-pana",
    path: "/user/single-pana",
  },
  {
    title: "Double Pana",
    description: "Explore double pana games",
    number: "456",
    type: "double-pana",
    path: "/user/double-pana",
  },
  {
    title: "Triple Pana",
    description: "Explore triple pana games",
    number: "347",
    type: "triple",
    path: "/user/triple-pana",
  },
  {
    title: "Half Sangam",
    description: "Explore half sangam games",
    number: "∞",
    type: "half-sangam",
    path: "/user/half-sangam",
  },
  {
    title: "Full Sangam",
    description: "Explore full sangam games",
    number: "∞",
    type: "full-sangam",
    path: "/user/full-sangam",
  },
];


export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);





    const [contactSending, setContactSending] = useState(false);
  const [contactStatus, setContactStatus] = useState(null);

  async function handleContactSubmit(event) {
    event.preventDefault();

    // await nantar event.currentTarget null hoto, mhanun aadhich ghet
    const form = event.currentTarget;
    const formData = new FormData(form);

    const name = formData.get("name").trim();
    const email = formData.get("email").trim();
    const phone = formData.get("phone").trim();
    const subject = formData.get("subject");
    const message = formData.get("message").trim();

    // Backend Contact madhe fakt name, phone, message ahet,
    // mhanun subject ani email message madhech jodto.
    const fullMessage = `[${subject}] ${message}\nEmail: ${email}`;

    // Contact.message column default 255 characters cha ahe
    if (fullMessage.length > 255) {
      setContactStatus({
        type: "error",
        message: "Message is too long. Please shorten it.",
      });
      return;
    }

    setContactSending(true);
    setContactStatus(null);

    try {
      await sendContactMessage({ name, phone, message: fullMessage });
      form.reset();
      setContactStatus({
        type: "success",
        message: "Message sent successfully! Our admin team will contact you.",
      });
    } catch (err) {
      setContactStatus({
        type: "error",
        message: getErrorMessage(err, "Failed to send message. Please try again."),
      });
    } finally {
      setContactSending(false);
    }
  }

  return (
    <div className="landing-page">
      <header className="landing-header">
        <a className="brand" href="/" aria-label="AK Game home">
          <span className="brand-mark">A</span>
          <span>AK_<strong>GAME</strong></span>
        </a>

        <button
          className="mobile-menu"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation"
        >
          {menuOpen ? <X /> : <Menu />}
        </button>

        <nav className={menuOpen ? "nav-links nav-open" : "nav-links"}>
          <a className="active" href="#home" onClick={() => setMenuOpen(false)}>
            Home
          </a>
          <a href="#games" onClick={() => setMenuOpen(false)}>Games</a>
          <a href="#results" onClick={() => setMenuOpen(false)}>Results</a>
          <a href="#how-to-play" onClick={() => setMenuOpen(false)}>
            How to Play
          </a>


<a href="#contact" onClick={() => setMenuOpen(false)}>
  Contacts
</a>

        </nav>

       
<div className="header-actions">
  <a className="btn btn-outline" href="/login">
    User Login
  </a>

  <a className="btn btn-outline" href="/admin/login">
    Admin Login
  </a>

  <a className="btn btn-primary" href="/signup">
    Sign Up
  </a>
</div>

      </header>

      <main>
        <section className="hero" id="home">
          <div className="hero-copy">
            <span className="eyebrow">
              <Zap size={16} /> WELCOME TO AK_GAME
            </span>

            <h1>
              Your Game.
              <span>Your Moment.</span>
            </h1>

            <p>
              Explore the AK_Game experience in one place.
              Discover game categories and browse available results.
            </p>

            <div className="hero-actions">
              <a className="btn btn-primary btn-large" href="#games">
                <Gamepad2 size={20} />
                Explore Games
                <ArrowRight size={18} />
              </a>

              <a className="btn btn-outline btn-large" href="#results">
                <BarChart3 size={20} />
                View Results
                <ArrowRight size={18} />
              </a>
            </div>

            <div className="hero-features" id="how-to-play">
              <div>
                <Zap />
                <span>Simple<br />Interface</span>
              </div>
              <div>
                <ShieldCheck />
                <span>Secure<br />Experience</span>
              </div>
              <div>
                <Users />
                <span>Play<br />Responsibly</span>
              </div>
            </div>
          </div>

          <div className="hero-visual" aria-hidden="true">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="hero-orb">
              <span>A</span>
            </div>
            <div className="orb-caption">AK_GAME</div>
          </div>
        </section>

        <section className="games-section" id="games">
          <div className="section-heading">
            <div>
              <h2>Explore Games</h2>
              <span className="heading-line" />
            </div>
            <span className="section-note">Choose a category</span>
          </div>

          <div className="game-grid">
            {games.map((game) => (
              <a
                className={`game-card ${game.type}`}
                href={game.path}
                key={game.title}
              >
                <div className="game-art">
                  <div className="game-symbol">{game.number}</div>
                </div>

                <div className="game-card-copy">
                  <h3>{game.title}</h3>
                  <p>{game.description}</p>
                </div>

                <span className="game-arrow">
                  <ArrowRight size={19} />
                </span>
              </a>
            ))}
          </div>
        </section>

                <section className="results-section" id="results">
          <div className="section-heading">
            <div>
              <h2>Latest Results</h2>
              <span className="heading-line" />
            </div>

            <span className="section-note">Today's results</span>
          </div>

          <LatestResults />
        </section>














      </main>




<section className="contact-section" id="contact">
  <div className="section-heading">
    <div>
      <h2>Contact Admin</h2>
      <span className="heading-line" />
    </div>
    <span className="section-note">We're here to help</span>
  </div>

  <div className="contact-card">
    <div className="contact-info">
      <div className="contact-icon">
        <Users size={28} />
      </div>

      <h3>Let's Talk</h3>
      <p>
        Have questions about games, results, registration, or your account?
        Fill out the form and our admin team will assist you.
      </p>

      <div className="contact-benefit">
        <ShieldCheck size={20} />
        <span>Your information will be handled responsibly.</span>
      </div>
    </div>







    <form className="contact-form" onSubmit={handleContactSubmit}>






      <div className="contact-form-row">
        <div className="contact-field">
          <label htmlFor="contact-name">Full Name *</label>
          <input
            id="contact-name"
            name="name"
            type="text"
            placeholder="Enter your full name"
            autoComplete="name"
            required
            maxLength={100}
          />
        </div>

        <div className="contact-field">
          <label htmlFor="contact-email">Email Address *</label>
          <input
            id="contact-email"
            name="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            required
            maxLength={254}
          />
        </div>
      </div>

      <div className="contact-form-row">
        <div className="contact-field">
                    <label htmlFor="contact-phone">Phone Number *</label>
          <input
            id="contact-phone"
            name="phone"
            type="tel"
            placeholder="Enter your phone number"
            autoComplete="tel"
            required
            maxLength={20}
          />
        </div>

        <div className="contact-field">
          <label htmlFor="contact-subject">Subject *</label>
          <select id="contact-subject" name="subject" required defaultValue="">
            <option value="" disabled>Select a subject</option>
            <option value="General Enquiry">General Enquiry</option>
            <option value="Registration">Registration</option>
            <option value="Games">Games</option>
            <option value="Results">Results</option>
            <option value="Account Support">Account Support</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      <div className="contact-field">
        <label htmlFor="contact-message">Your Message *</label>
        <textarea
          id="contact-message"
          name="message"
          placeholder="Tell us how we can help..."
          rows={5}
          required
          maxLength={2000}
        />
      </div>

            {contactStatus && (
        <p
          className={`contact-status contact-status-${contactStatus.type}`}
          role="status"
        >
          {contactStatus.message}
        </p>
      )}

      <button
        type="submit"
        className="btn btn-primary contact-submit"
        disabled={contactSending}
      >
        {contactSending ? "Sending..." : "Send Message"}
        {!contactSending && <ArrowRight size={18} />}
      </button>




      <p className="contact-form-note">
        * Required fields
      </p>
    </form>
  </div>
</section>




      <footer className="landing-footer">
        <a className="brand" href="/">
          <span className="brand-mark">A</span>
          <span>AK_<strong>GAME</strong></span>
        </a>

        <p>Your Game. Your Moment.</p>

        <div className="footer-links">
          <a href="#home">Home</a>
          <a href="#games">Games</a>
          <a href="#results">Results</a>
          <a href="#how-to-play">How to Play</a>
            <a href="#contact">Contacts</a>
        </div>

        <div className="responsible-note">
          <ShieldCheck size={20} />
          <span>
            <strong>Play Responsibly</strong>
            <small>Use the platform responsibly and in moderation.</small>
          </span>
        </div>
      </footer>
    </div>
  );
}
