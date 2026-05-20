import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { NotificationProvider } from './context/NotificationContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Login from './pages/Login';
import Register from './pages/Register';
import CitizenDashboard from './pages/CitizenDashboard';
import WorkerDashboard from './pages/WorkerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

import EmergencyHelp from './pages/EmergencyHelp';

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <LanguageProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              <Route path="/dashboard/citizen" element={
                <ProtectedRoute allowedRoles={['citizen']}>
                  <Layout>
                    <CitizenDashboard />
                  </Layout>
                </ProtectedRoute>
              } />

              <Route path="/dashboard/citizen/emergency" element={
                <ProtectedRoute allowedRoles={['citizen']}>
                  <Layout>
                    <EmergencyHelp />
                  </Layout>
                </ProtectedRoute>
              } />

              <Route path="/dashboard/worker" element={
                <ProtectedRoute allowedRoles={['worker']}>
                  <Layout>
                    <WorkerDashboard />
                  </Layout>
                </ProtectedRoute>
              } />

              <Route path="/dashboard/admin" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Layout>
                    <AdminDashboard />
                  </Layout>
                </ProtectedRoute>
              } />

              <Route path="/" element={<Navigate to="/login" />} />
            </Routes>
            <ToastContainer />
          </Router>
        </LanguageProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;