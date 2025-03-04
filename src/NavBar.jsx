import React from 'react';
import { Link } from 'react-router-dom';

export default function NavBar() {
  return (
    <nav style={styles.nav}>
      <div style={styles.navContent}>
        <h1 style={styles.logo}>Video Locker</h1>
        <ul style={styles.ul}>
          <li style={styles.li}>
            <Link to="/" style={styles.link}>Home</Link>
          </li>
          <li style={styles.li}>
            <Link to="/show-videos" style={styles.link}>Preview Videos</Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    width: '100%',
    backgroundColor: '#1f1f1f',
    padding: '15px 30px',
    boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
  },
  navContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    color: '#fff',
    margin: 0,
    fontSize: '24px',
  },
  ul: {
    listStyle: 'none',
    display: 'flex',
    gap: '20px',
    margin: 0,
    padding: 0,
  },
  li: {},
  link: {
    color: '#fff',
    textDecoration: 'none',
    fontSize: '18px',
  },
};
