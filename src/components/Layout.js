import React from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
  return (
    <div className="app-container">
      <Navbar />
      <div className="main-content">
        <Sidebar />
        <main className="content-area">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
