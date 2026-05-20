import React, { useState, useEffect } from 'react';
import { FileText, Users, Clock, CheckCircle, Activity, UserCog, AlertTriangle, Eye, Check, X } from 'lucide-react';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { useNotification } from '../context/NotificationContext';
import socket from '../services/socket';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AdminDashboard = () => {
  const { t } = useLanguage();
  const { addNotification } = useNotification();
  const [complaints, setComplaints] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewComplaint, setViewComplaint] = useState(null);
  const [showCreateWorker, setShowCreateWorker] = useState(false);
  const [newWorker, setNewWorker] = useState({ name: '', email: '', password: '', category: 'Roads' });

  // Play siren for new emergency complaints
  useEffect(() => {
    const hasPendingEmergency = complaints.some(c => (c.priority === 'High' || c.priority === 'Emergency') && (!c.status || c.status === 'Pending'));
    if (hasPendingEmergency) {
      try {
        const audio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA');
        audio.play().catch(e => console.log('Audio play failed', e));
      } catch (e) { }
    }
  }, [complaints]);

  const fetchData = async () => {
    try {
      const [complaintsRes, usersRes] = await Promise.all([
        api.get('/complaints').catch(() => ({ data: [] })),
        api.get('/users').catch(() => ({ data: [] }))
      ]);

      setComplaints(complaintsRes.data);
      setUsers(usersRes.data);
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {

    fetchData();

    socket.on('emergencyComplaint', (data) => {

      toast.error(data.message);

      const audio = new Audio('/siren.mp3');
      audio.play();

      fetchData();
    });

    return () => {
      socket.off('emergencyComplaint');
    };

  }, []);

  const extractProofFromRemarks = (remarks) => {
    if (!remarks) return { text: '', proof: null };
    if (remarks.includes('PROOF_START:')) {
      const proofStr = remarks.split('PROOF_START:')[1];
      const text = remarks.split('||PROOF_START:')[0];
      return { text: text.replace('COMPLETED:', '').trim(), proof: proofStr };
    }
    return { text: remarks, proof: null };
  };

  const handleAssignWorker = async (complaintId, workerId) => {

    if (!workerId) return;

    try {

      await api.put(
        `/complaints/${complaintId}/assign`,
        {
          workerId: workerId
        }
      );

      addNotification(
        t('common.success'),
        'Worker assigned successfully.',
        'success'
      );

      fetchData();

    } catch (err) {

      console.error(err);

      addNotification(
        t('common.error'),
        err.response?.data?.message || 'Failed to assign worker.',
        'error'
      );

    }

  };
  const handleVerifyResolution = async (complaintId) => {
    try {
      await api.put(`/complaints/${complaintId}`, { status: 'Resolved' });
      addNotification('Verified', 'Complaint has been verified and marked as Resolved.', 'success');
      setViewComplaint(null);
      fetchData();
    } catch (e) {
      addNotification(t('common.error'), 'Failed to verify complaint.', 'error');
    }
  };

  const handleCreateWorker = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/register', {
        name: newWorker.name,
        email: newWorker.email,
        password: newWorker.password,
        role: 'worker',
        category: newWorker.category
      });
      addNotification(t('common.success'), 'Worker created successfully.', 'success');
      setShowCreateWorker(false);
      setNewWorker({ name: '', email: '', password: '', category: 'Roads' });
      fetchData();
    } catch (err) {
      addNotification(t('common.error'), err.response?.data?.message || 'Failed to create worker.', 'error');
    }
  };

  if (loading) return <div className="spinner" style={{ margin: '4rem auto' }}></div>;

  const totalComplaints = complaints.length;
  const emergencyComplaints = complaints.filter(c => c.priority === 'High' || c.priority === 'Emergency').length;
  const pendingComplaints = complaints.filter(c => c.status === 'Pending' || !c.status).length;
  const resolvedComplaints = complaints.filter(c => c.status === 'Resolved').length;
  const inProgressComplaints = complaints.filter(c => c.status === 'In Progress').length;

  const totalUsersCount = users.length;
  const workers = users.filter(u => u.role === 'worker' || u.role === 'Worker');
  const totalWorkers = workers.length;

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>{t('admin.system_overview')}</h1>

      <div className="dashboard-grid" style={{ marginBottom: '2rem' }}>
        <div className="metric-card">
          <div className="metric-icon" style={{ backgroundColor: 'rgba(0, 51, 102, 0.1)', color: 'var(--primary-color)' }}>
            <FileText size={28} />
          </div>
          <div className="metric-info">
            <h3>{t('dash.total_complaints')}</h3>
            <p>{totalComplaints}</p>
          </div>
        </div>

        <div className="metric-card" style={{ borderLeftColor: 'var(--danger)' }}>
          <div className="metric-icon" style={{ backgroundColor: 'rgba(220, 53, 69, 0.1)', color: 'var(--danger)' }}>
            <AlertTriangle size={28} />
          </div>
          <div className="metric-info">
            <h3 style={{ color: 'var(--danger)' }}>{t('dash.emergency_count')}</h3>
            <p style={{ color: 'var(--danger)' }}>{emergencyComplaints}</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ backgroundColor: 'rgba(255, 193, 7, 0.1)', color: 'var(--warning)' }}>
            <Clock size={28} />
          </div>
          <div className="metric-info">
            <h3>{t('dash.pending')}</h3>
            <p>{pendingComplaints}</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ backgroundColor: 'rgba(23, 162, 184, 0.1)', color: 'var(--info)' }}>
            <Activity size={28} />
          </div>
          <div className="metric-info">
            <h3>{t('dash.in_progress')}</h3>
            <p>{inProgressComplaints}</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ backgroundColor: 'rgba(40, 167, 69, 0.1)', color: 'var(--success)' }}>
            <CheckCircle size={28} />
          </div>
          <div className="metric-info">
            <h3>{t('dash.resolved')}</h3>
            <p>{resolvedComplaints}</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ backgroundColor: 'rgba(0, 86, 179, 0.1)', color: 'var(--secondary-color)' }}>
            <Users size={28} />
          </div>
          <div className="metric-info">
            <h3>{t('admin.total_users')}</h3>
            <p>{totalUsersCount}</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        <div className="card" style={{ flex: '2 1 700px' }}>
          <h2 className="card-title">{t('admin.all_complaints_task')}</h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>{t('complaint.title')}</th>
                  <th>Citizen</th>
                  <th>{t('common.status')}</th>
                  <th>{t('admin.assign_worker')}</th>
                  <th>{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map(complaint => {
                  const isEmergency = complaint.priority === 'High' || complaint.priority === 'Emergency';
                  const isCompleted = complaint.workerRemarks && complaint.workerRemarks.includes('COMPLETED:');
                  return (
                    <tr key={complaint._id || complaint.id} className={isEmergency ? 'emergency-row' : ''}>
                      <td style={{ fontWeight: isEmergency ? 'bold' : 'normal', color: isEmergency ? 'var(--danger)' : 'inherit' }}>
                        {complaint.title}
                        {isEmergency && <AlertTriangle size={14} color="var(--danger)" style={{ marginLeft: '5px' }} />}
                      </td>
                      <td>{complaint.user?.name || complaint.citizen?.name || 'Citizen'}</td>
                      <td>
                        <span className={`badge badge-${(complaint.status || 'pending').toLowerCase().replace(' ', '-')}`}>
                          {isCompleted ? 'Completed' : (complaint.status || 'Pending')}
                        </span>
                      </td>
                      <td>
                        <select
                          className="form-control"
                          style={{ padding: '0.3rem', fontSize: '0.875rem', borderColor: isEmergency && !complaint.assignedWorker ? 'var(--danger)' : 'var(--border-color)' }}
                          value={complaint.assignedWorker || ''}
                          onChange={(e) => handleAssignWorker(complaint._id || complaint.id, e.target.value)}
                        >
                          <option value="">{t('admin.unassigned')}</option>
                          {workers
                            .filter(w => !w.category || !complaint.category || w.category === complaint.category)
                            .map(w => (
                              <option key={w._id || w.id} value={w._id || w.id}>{w.name} ({w.category || 'Any'})</option>
                            ))}
                        </select>
                      </td>
                      <td>
                        <button
                          className="btn"
                          style={{ padding: '0.2rem 0.5rem', display: 'flex', alignItems: 'center', gap: '0.2rem', background: isCompleted ? 'var(--success)' : '#e9ecef', color: isCompleted ? 'white' : '#495057' }}
                          onClick={() => setViewComplaint(complaint)}
                        >
                          <Eye size={16} /> View
                        </button>
                      </td>
                    </tr>
                  )
                })}
                {complaints.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>{t('admin.no_complaints')}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card" style={{ flex: '1 1 300px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 className="card-title" style={{ marginBottom: 0 }}>{t('admin.manage_users')}</h2>
            <button className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.875rem' }} onClick={() => setShowCreateWorker(true)}>
              {t('admin.create_worker_btn')}
            </button>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>{t('admin.user_name')}</th>
                  <th>{t('admin.user_role')}</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user._id || user.id}>
                    <td>
                      <div style={{ fontWeight: '600' }}>{user.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{user.email}</div>
                    </td>
                    <td>
                      <span className="badge" style={{ backgroundColor: '#e9ecef', color: '#495057' }}>
                        {(user.role || 'citizen').toUpperCase()}
                      </span>
                      {user.role === 'worker' && user.category && (
                        <div style={{ fontSize: '0.75rem', marginTop: '4px', color: 'var(--primary-color)' }}>
                          {user.category}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan="2" style={{ textAlign: 'center', padding: '2rem' }}>{t('admin.no_users')}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* CREATE WORKER MODAL */}
      {showCreateWorker && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px', position: 'relative' }}>
            <button
              onClick={() => setShowCreateWorker(false)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
            >
              <X size={24} />
            </button>
            <h2 className="card-title" style={{ marginBottom: '1.5rem' }}>{t('admin.create_worker')}</h2>
            <form onSubmit={handleCreateWorker}>
              <div className="form-group">
                <label>{t('admin.user_name')}</label>
                <input type="text" className="form-control" value={newWorker.name} onChange={e => setNewWorker({ ...newWorker, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>{t('admin.worker_email')}</label>
                <input type="email" className="form-control" value={newWorker.email} onChange={e => setNewWorker({ ...newWorker, email: e.target.value })} placeholder="e.g. road_worker01@citizeego.gov" required />
              </div>
              <div className="form-group">
                <label>{t('admin.worker_password')}</label>
                <input type="password" className="form-control" value={newWorker.password} onChange={e => setNewWorker({ ...newWorker, password: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>{t('admin.worker_category')}</label>
                <select className="form-control" value={newWorker.category} onChange={e => setNewWorker({ ...newWorker, category: e.target.value })} required>
                  <option value="Roads">{t('complaint.category_roads')}</option>
                  <option value="Electricity">{t('complaint.category_electricity')}</option>
                  <option value="Water">{t('complaint.category_water')}</option>
                  <option value="Garbage">{t('complaint.category_garbage')}</option>
                  <option value="Public Safety">{t('complaint.category_safety')}</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>{t('admin.create_account')}</button>
            </form>
          </div>
        </div>
      )}

      {/* VERIFY MODAL */}
      {viewComplaint && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '600px', position: 'relative', margin: '20px', maxHeight: '90vh', overflowY: 'auto' }}>
            <button
              onClick={() => setViewComplaint(null)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
            >
              <X size={24} />
            </button>
            <h2 className="card-title" style={{ marginBottom: '1.5rem', paddingRight: '2rem' }}>Admin Verification</h2>
            {viewComplaint.image && (
              <div style={{ marginBottom: '1rem' }}>

                <strong>Citizen Evidence (Before):</strong>

                <img
                  src={viewComplaint.image}
                  alt="Citizen Evidence"
                  style={{
                    width: '100%',
                    maxHeight: '250px',
                    objectFit: 'contain',
                    borderRadius: '8px',
                    marginTop: '0.5rem',
                    border: '1px solid #ddd'
                  }}
                />
              </div>
            )}
            {viewComplaint.completionProof && (
              <div style={{ marginTop: '1rem' }}>

                <strong>Worker Uploaded Proof:</strong>

                <img
                  src={viewComplaint.completionProof}
                  alt="Proof"
                  style={{
                    width: '100%',
                    maxHeight: '300px',
                    objectFit: 'contain',
                    marginTop: '10px',
                    borderRadius: '8px',
                    border: '2px solid #ddd'
                  }}
                />

              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <strong>Task: </strong> {viewComplaint.title}
              </div>
              <div>
                <strong>Status: </strong>
                <span className={`badge badge-${(viewComplaint.status || 'pending').toLowerCase().replace(' ', '-')}`}>
                  {viewComplaint.workerRemarks && viewComplaint.workerRemarks.includes('COMPLETED:') ? 'Completed' : viewComplaint.status}
                </span>
              </div>
            </div>

            {viewComplaint.description && (
              <div style={{ marginBottom: '1rem' }}>
                <strong>Description / GPS: </strong>
                <div style={{ padding: '0.75rem', backgroundColor: '#f8f9fa', borderRadius: '4px', marginTop: '0.5rem', whiteSpace: 'pre-wrap' }}>
                  {viewComplaint.description}
                </div>
              </div>
            )}
            {viewComplaint.completionProof && (
              <div style={{ marginBottom: '1rem' }}>

                <strong>Worker Completion Proof:</strong>

                <div
                  style={{
                    marginTop: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    overflow: 'hidden'
                  }}
                >

                  <img
                    src={viewComplaint.completionProof}
                    alt="Completion Proof"
                    style={{
                      width: '100%',
                      maxHeight: '300px',
                      objectFit: 'contain'
                    }}
                  />

                </div>

              </div>
            )}

            {viewComplaint.image && (
              <div style={{ marginBottom: '1rem' }}>
                <strong>Citizen Evidence: </strong>
                <img src={viewComplaint.image} alt="Evidence" style={{ width: '100%', maxHeight: '200px', objectFit: 'contain', border: '1px solid #ddd', borderRadius: '4px' }} />
              </div>
            )}

            {(() => {
              const parsed = extractProofFromRemarks(viewComplaint.workerRemarks);
              return (
                <React.Fragment>
                  {parsed.proof && (
                    <div style={{ marginBottom: '1rem', padding: '1rem', border: '2px solid var(--success)', borderRadius: '8px' }}>
                      <strong style={{ color: 'var(--success)' }}>Worker Completion Proof (Live Camera): </strong>
                      <img src={parsed.proof} alt="Completion Proof" style={{ width: '100%', maxHeight: '300px', objectFit: 'contain', marginTop: '0.5rem', borderRadius: '4px' }} />
                    </div>
                  )}
                  {parsed.text && (
                    <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#e9ecef', borderRadius: '8px' }}>
                      <strong>Worker Remarks: </strong> {parsed.text}
                    </div>
                  )}
                </React.Fragment>
              );
            })()}

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button
                className="btn btn-success"
                style={{ flex: 1, backgroundColor: 'var(--success)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                onClick={() => handleVerifyResolution(viewComplaint._id || viewComplaint.id)}
                disabled={viewComplaint.status === 'Resolved'}
              >
                <Check size={20} />
                {viewComplaint.status === 'Resolved' ? 'Already Resolved' : t('admin.verify')}
              </button>
            </div>
          </div>
        </div >
      )}
    </div >
  );
};

export default AdminDashboard;
