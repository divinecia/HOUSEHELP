"use client";

import Link from "next/link";
import { FaWrench, FaHome, FaCog, FaExternalLinkAlt } from "react-icons/fa";

export default function Home() {
  return (
    <div className="welcome-page">
      {/* Heading */}
      <header className="welcome-header">
        <h1 className="welcome-title">
          <span className="welcome-title-dark">HOUSE</span>
          <span className="welcome-title-blue">HELP</span>
        </h1>
        <p className="welcome-subtitle">
          Professional household services platform connecting trusted workers with families
        </p>
      </header>

      {/* Cards */}
      <main className="welcome-main">
        <div className="welcome-cards">
          {/* Worker */}
          <Link 
            href="/worker/register/step-1" 
            className="welcome-card welcome-card-worker"
          >
            <div className="welcome-card-inner">
              <div className="welcome-card-icon welcome-card-icon-worker">
                <FaWrench className="w-9 h-9 text-white drop-shadow-lg" />
              </div>
              <h3 className="welcome-card-title">Worker</h3>
            </div>
          </Link>

          {/* Household */}
          <Link 
            href="/household/register/step-1" 
            className="welcome-card welcome-card-household"
          >
            <div className="welcome-card-inner">
              <div className="welcome-card-icon welcome-card-icon-household">
                <FaHome className="w-9 h-9 text-white drop-shadow-lg" />
              </div>
              <h3 className="welcome-card-title">Household</h3>
            </div>
          </Link>

          {/* Admin */}
          <Link 
            href="/admin" 
            className="welcome-card welcome-card-admin"
          >
            <div className="welcome-card-inner">
              <div className="welcome-card-icon welcome-card-icon-admin">
                <FaCog className="w-9 h-9 text-white drop-shadow-lg" />
              </div>
              <h3 className="welcome-card-title">Admin</h3>
            </div>
          </Link>
        </div>

        {/* Guest button */}
        <div className="welcome-guest">
          <Link
            href="https://www.househelprw.com/"
            className="welcome-guest-btn"
            target="_blank"
            rel="noopener noreferrer"
          >
            Continue as Guest
            <FaExternalLinkAlt className="welcome-guest-icon" />
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="welcome-footer">
        <p className="welcome-footer-text">
          © {new Date().getFullYear()} HOUSEHELP. Professional household services platform.
        </p>
        <div className="welcome-footer-links">
          <Link 
            href="https://www.househelprw.com/about" 
            className="welcome-footer-link" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            Terms of Service
            <FaExternalLinkAlt />
          </Link>
          <span className="welcome-footer-separator">•</span>
          <Link 
            href="https://www.househelprw.com/about" 
            className="welcome-footer-link" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            Privacy Policy
            <FaExternalLinkAlt />
          </Link>
        </div>
      </footer>
    </div>
  );
}