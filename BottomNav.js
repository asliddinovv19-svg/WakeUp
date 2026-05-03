import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import translations from '../i18n/translations';

const BottomNav = () => {
  const { language } = useAuth();
  const t = translations[language];

  const navItems = [
    { path: '/', icon: '🏠', label: t.home },
    { path: '/chat', icon: '💬', label: t.chat },
    { path: '/map', icon: '🗺️', label: t.map },
    { path: '/top', icon: '🏆', label: t.top },
    { path: '/profile', icon: '👤', label: t.profile },
  ];

  return (
    <nav className="bottom-nav">
      {navItems.map(item => (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.path === '/'}
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
        >
          <span className="nav-icon">{item.icon}</span>
          <span className="nav-label">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
};

export default BottomNav;
