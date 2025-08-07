import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import VisitorTable from './VisitorTable';
import Charts from './Charts';
import { api } from '../utils/api';

const Dashboard = () => {
  const [activeView, setActiveView] = useState('overview');
  const [stats, setStats] = useState({
    totalVisitors: 0,
    todayVisitors: 0,
    weeklyVisitors: 0,
    monthlyVisitors: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/visitors/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    switch (activeView) {
      case 'overview':
        return <Charts stats={stats} />;
      case 'visitors':
        return <VisitorTable />;
      default:
        return <Charts stats={stats} />;
    }
  };

  return (
    <div className="dashboard">
      <Sidebar activeView={activeView} setActiveView={setActiveView} />
      <div className="main-content">
        <Header />
        <div className="content-area">
          {/* Stats Overview */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-content">
                <h3>{loading ? '...' : stats.totalVisitors}</h3>
                <p>Total Visitors</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🔥</div>
              <div className="stat-content">
                <h3>{loading ? '...' : stats.todayVisitors}</h3>
                <p>Today's Visitors</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📈</div>
              <div className="stat-content">
                <h3>{loading ? '...' : stats.weeklyVisitors}</h3>
                <p>This Week</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🚀</div>
              <div className="stat-content">
                <h3>{loading ? '...' : stats.monthlyVisitors}</h3>
                <p>This Month</p>
              </div>
            </div>
          </div>
          
          {/* Dynamic Content */}
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;