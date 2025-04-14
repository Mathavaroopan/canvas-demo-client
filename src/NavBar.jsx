import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function NavBar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      if (offset > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/show-videos', label: 'Preview Videos' },
    { path: '/create-video', label: 'Upload Video' },
    { path: '/modify-videos', label: 'Modify Videos' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className={`navbar ${scrolled ? 'navbar-scrolled' : ''}`}>
      <div className="container navbar-container">
        <div className="navbar-logo">
          <Link to="/">
            <h1 className="logo-text">Canvas Space</h1>
            <span className="logo-accent"></span>
          </Link>
        </div>

        <div className={`navbar-menu ${menuOpen ? 'menu-open' : ''}`}>
          <ul className="navbar-links">
            {navLinks.map((link, index) => (
              <li 
                key={link.path} 
                className="nav-item"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <Link 
                  to={link.path} 
                  className={`nav-link ${isActive(link.path) ? 'active' : ''}`}
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                  {isActive(link.path) && <span className="nav-indicator"></span>}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <button 
          className={`menu-toggle ${menuOpen ? 'toggle-active' : ''}`}
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </nav>
  );
}

// Add this to your App.css or create a navbar.css file
/*
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  padding: 1.5rem var(--space-4);
  z-index: 1000;
  transition: all 0.3s ease;
  background: transparent;
}

.navbar-scrolled {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  padding: 1rem var(--space-4);
}

.navbar-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.navbar-logo a {
  display: flex;
  align-items: center;
  text-decoration: none;
}

.logo-text {
  color: var(--primary-700);
  font-size: 1.8rem;
  font-weight: 700;
  margin: 0;
  position: relative;
  background: linear-gradient(90deg, var(--primary-600), var(--secondary-600));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  transition: all 0.3s ease;
}

.navbar-scrolled .logo-text {
  font-size: 1.5rem;
}

.logo-accent {
  display: block;
  position: absolute;
  bottom: -3px;
  left: 0;
  width: 30px;
  height: 3px;
  background: linear-gradient(90deg, var(--primary-500), var(--secondary-500));
  border-radius: var(--radius-full);
  transition: width 0.3s ease;
}

.navbar-logo:hover .logo-accent {
  width: 100%;
}

.navbar-links {
  display: flex;
  list-style: none;
  padding: 0;
  margin: 0;
}

.nav-item {
  margin: 0 var(--space-4);
  opacity: 0;
  animation: fadeSlideDown 0.5s forwards;
}

.nav-link {
  color: var(--neutral-700);
  text-decoration: none;
  font-weight: 500;
  font-size: 1rem;
  padding: 0.5rem 0;
  position: relative;
  transition: color 0.3s ease;
}

.nav-link:hover {
  color: var(--primary-600);
}

.nav-link.active {
  color: var(--primary-600);
  font-weight: 600;
}

.nav-indicator {
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 100%;
  height: 3px;
  background: linear-gradient(90deg, var(--primary-500), var(--secondary-500));
  border-radius: var(--radius-full);
  transform-origin: left;
  animation: scaleX 0.3s ease-out forwards;
}

.auth-buttons {
  display: flex;
  gap: var(--space-3);
}

.menu-toggle {
  display: none;
  background: transparent;
  border: none;
  cursor: pointer;
  width: 30px;
  height: 25px;
  position: relative;
  z-index: 1010;
}

.menu-toggle span {
  display: block;
  position: absolute;
  height: 3px;
  width: 100%;
  background: var(--primary-600);
  border-radius: 3px;
  opacity: 1;
  left: 0;
  transform: rotate(0deg);
  transition: all 0.25s ease-in-out;
}

.menu-toggle span:nth-child(1) {
  top: 0px;
}

.menu-toggle span:nth-child(2) {
  top: 10px;
}

.menu-toggle span:nth-child(3) {
  top: 20px;
}

.toggle-active span:nth-child(1) {
  top: 10px;
  transform: rotate(135deg);
}

.toggle-active span:nth-child(2) {
  opacity: 0;
  left: -60px;
}

.toggle-active span:nth-child(3) {
  top: 10px;
  transform: rotate(-135deg);
}

@keyframes fadeSlideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes scaleX {
  from {
    transform: scaleX(0);
  }
  to {
    transform: scaleX(1);
  }
}

@media (max-width: 992px) {
  .navbar-menu {
    position: fixed;
    top: 0;
    right: -100%;
    width: 80%;
    max-width: 400px;
    height: 100vh;
    background: white;
    box-shadow: -5px 0 15px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    transition: right 0.3s ease;
    z-index: 1000;
  }

  .menu-open {
    right: 0;
  }

  .navbar-links {
    flex-direction: column;
    width: 100%;
    margin-bottom: 2rem;
  }

  .nav-item {
    margin: 0.5rem 0;
    text-align: center;
  }

  .auth-buttons {
    flex-direction: column;
    width: 80%;
    gap: 1rem;
  }

  .menu-toggle {
    display: block;
  }
}
*/
