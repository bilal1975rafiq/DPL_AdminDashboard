import React from 'react';
import { FiHome, FiUsers, FiZap } from 'react-icons/fi';

const Sidebar = ({ activeView, setActiveView }) => {
  const menuItems = [
    { id: 'overview', label: 'Overview', icon: FiHome },
    { id: 'visitors', label: 'Visitors', icon: FiUsers }
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <FiZap className="logo-icon" />
          <span className="logo-text">DPL<span className="rebel-text">Rebel</span></span>
        </div>
        <div className="tagline">Admin Dashboard</div>
      </div>
      
      <nav className="sidebar-nav">
        {menuItems.map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={`nav-item ${activeView === item.id ? 'active' : ''}`}
              onClick={() => setActiveView(item.id)}
            >
              <Icon className="nav-icon" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
      
      <div className="sidebar-footer">
        <div className="rebel-quote">
          "Innovation as a Service"
        </div>
      </div>
    </div>
  );
};

export default Sidebar;