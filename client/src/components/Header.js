import React, { useState } from 'react';
import { FiUser, FiLogOut } from 'react-icons/fi';

const Header = () => {
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleString());
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Update time every second for live clock
  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      // Add a small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500));
      
      localStorage.removeItem('jwt');
      sessionStorage.removeItem('jwt'); // Also clear session storage
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
    }
  };

  // Enhanced logout button styles that match your app.css theme
  const logoutButtonStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '2.75rem',
    height: '2.75rem',
    background: isLoggingOut 
      ? 'var(--bg-tertiary)' 
      : 'linear-gradient(135deg, var(--danger-red) 0%, #DC2626 100%)',
    border: 'none',
    borderRadius: '0.75rem',
    color: 'white',
    cursor: isLoggingOut ? 'not-allowed' : 'pointer',
    transition: 'all 0.3s ease',
    position: 'relative',
    overflow: 'hidden',
    boxShadow: isLoggingOut 
      ? 'none' 
      : '0 2px 8px rgba(239, 68, 68, 0.3)',
    opacity: isLoggingOut ? 0.7 : 1,
    transform: 'translateZ(0)', // Hardware acceleration
  };

  const logoutIconStyle = {
    transition: 'all 0.3s ease',
    filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))',
    transform: isLoggingOut ? 'rotate(360deg) scale(0.9)' : 'rotate(0deg) scale(1)',
  };

  // Enhanced user profile container style
  const userProfileStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '0.75rem 1.25rem',
    background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)',
    borderRadius: '1rem',
    border: '1px solid var(--border-color)',
    transition: 'all 0.3s ease',
    position: 'relative',
    overflow: 'hidden',
  };

  return (
    <header className="header">
      <div className="header-left">
        <h1 className="page-title">Command Center</h1>
        <p className="page-subtitle">Monitor and manage all visitor activities</p>
      </div>
      <div className="header-right">
        <div 
          className="user-profile" 
          style={userProfileStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15), 0 0 20px rgba(139, 92, 246, 0.2)';
            e.currentTarget.style.borderColor = 'var(--primary-purple)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0px)';
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.borderColor = 'var(--border-color)';
          }}
        >
          <FiUser 
            className="profile-icon" 
            style={{
              fontSize: '1.5rem',
              color: 'var(--primary-purple)',
              padding: '0.5rem',
              background: 'rgba(139, 92, 246, 0.1)',
              borderRadius: '0.75rem',
              transition: 'all 0.3s ease',
            }}
          />
          <div className="profile-info">
            <span 
              className="profile-name"
              style={{
                fontSize: '0.95rem',
                fontWeight: '700',
                color: 'var(--text-primary)',
                marginBottom: '0.125rem',
                letterSpacing: '0.025em',
              }}
            >
              Admin
            </span>
            <span 
              className="profile-time"
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                fontWeight: '500',
                fontFamily: "'Courier New', monospace",
                letterSpacing: '0.05em',
              }}
            >
              {currentTime}
            </span>
          </div>
          <button 
            className="logout-btn" 
            onClick={handleLogout} 
            title={isLoggingOut ? "Logging out..." : "Logout"}
            disabled={isLoggingOut}
            style={logoutButtonStyle}
            onMouseEnter={(e) => {
              if (!isLoggingOut) {
                e.currentTarget.style.background = 'linear-gradient(135deg, #DC2626 0%, var(--warning-orange) 100%)';
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(239, 68, 68, 0.5)';
                e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.2)';
                
                // Icon animation
                const icon = e.currentTarget.querySelector('svg');
                if (icon) {
                  icon.style.transform = 'rotate(-10deg) scale(1.1)';
                  icon.style.filter = 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4))';
                }
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoggingOut) {
                e.currentTarget.style.background = 'linear-gradient(135deg, var(--danger-red) 0%, #DC2626 100%)';
                e.currentTarget.style.transform = 'translateY(0px) scale(1)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(239, 68, 68, 0.3)';
                e.currentTarget.style.border = 'none';
                
                // Reset icon
                const icon = e.currentTarget.querySelector('svg');
                if (icon && !isLoggingOut) {
                  icon.style.transform = 'rotate(0deg) scale(1)';
                  icon.style.filter = 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))';
                }
              }
            }}
            onMouseDown={(e) => {
              if (!isLoggingOut) {
                e.currentTarget.style.transform = 'translateY(0px) scale(1.02)';
              }
            }}
            onMouseUp={(e) => {
              if (!isLoggingOut) {
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
              }
            }}
          >
            {isLoggingOut ? (
              <div 
                style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }}
              />
            ) : (
              <FiLogOut size={20} style={logoutIconStyle} />
            )}
          </button>
        </div>
      </div>
      
      {/* Add CSS animation for spinner */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </header>
  );
};

export default Header;