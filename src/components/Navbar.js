import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, User, Globe } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { language, changeLanguage, t } = useLanguage();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar" style={{
      backgroundColor: 'var(--primary-color)',
      color: 'var(--white)',
      padding: window.innerWidth <= 768 ? '0.7rem' : '1rem 2rem',
      display: 'flex',
      justifyContent: window.innerWidth <= 768 ? 'center' : 'space-between',
flexWrap: 'wrap',
gap: '10px',
      alignItems: 'center',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      position: 'sticky',
      top: 0,
      zIndex: 1000
    }}>
      <div className="navbar-right" style={{
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
  flexWrap: 'wrap'
}}>
        <img
  src="/logo192.png"
  alt="Logo"
  style={{height: window.innerWidth <= 768 ? '24px' : '30px'}}
/>
        <Link to="/" style={{ color: 'var(--white)', fontSize: window.innerWidth <= 768 ? '0.9rem' : '1.5rem', fontWeight: 'bold' }}>
          {t('app.title')}
        </Link>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: window.innerWidth <= 768 ? '0.5rem' : '1.5rem'}}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Globe size={18} />
          <select 
            value={language} 
            onChange={(e) => changeLanguage(e.target.value)}
            style={{
              background: 'transparent',
              color: 'var(--white)',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '4px',
              padding: '0.2rem 0.5rem',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="en" style={{color: '#333'}}>English</option>
            <option value="te" style={{color: '#333'}}>తెలుగు</option>
            <option value="hi" style={{color: '#333'}}>हिन्दी</option>
            <option value="ta" style={{color: '#333'}}>தமிழ்</option>
          </select>
        </div>
        
        {user && (
          <React.Fragment>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={20} />
              <span>
  {user?.name || 'User'} ({user?.role || 'citizen'})
</span>
            </div>
            <button 
              onClick={handleLogout}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.3)',
                color: 'var(--white)',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'background 0.3s'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <LogOut size={16} />
              {t('common.logout')}
            </button>
          </React.Fragment>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
