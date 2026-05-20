import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard } from 'lucide-react';

import { AuthContext } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const Sidebar = () => {

  const { user } = useContext(AuthContext);
  const { t } = useLanguage();

  if (!user) return null;

  const links = {

    admin: [
      {
        to: '/dashboard/admin',
        icon: <LayoutDashboard size={20} />,
        label: 'Admin Dashboard'
      }
    ],

    citizen: [
      {
        to: '/dashboard/citizen',
        icon: <LayoutDashboard size={20} />,
        label: t('sidebar.dashboard')
      },
      {
        to: '/dashboard/citizen/emergency',
        icon: <span style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '20px', fontWeight: 'bold' }}>!</span>,
        label: t('sidebar.emergency') || 'Emergency Help'
      }
    ],

    worker: [
      {
        to: '/dashboard/worker',
        icon: <LayoutDashboard size={20} />,
        label: 'Assigned Tasks'
      }
    ]

  };

  const currentLinks =
    links[user.role?.toLowerCase()] || [];

  return (

    <aside
      style={{
        width: '250px',
        backgroundColor: 'white',
        borderRight: '1px solid #ddd',
        padding: '1rem'
      }}
    >

      {currentLinks.map((link, index) => (

        <NavLink
          key={index}
          to={link.to}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px',
            marginBottom: '10px',
            textDecoration: 'none'
          }}
        >

          {link.icon}

          {link.label}

        </NavLink>

      ))}

    </aside>

  );
};

export default Sidebar;