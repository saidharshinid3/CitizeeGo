import React, { useState, useEffect, useContext } from 'react';
import { Edit2, X, AlertTriangle, Camera } from 'lucide-react';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { AuthContext } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import LiveCamera from '../components/LiveCamera';

const WorkerDashboard = () => {
  const { t } = useLanguage();
  const { user } = useContext(AuthContext);
  const { addNotification } = useNotification();

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [editStatus, setEditStatus] = useState('');
  const [editRemarks, setEditRemarks] = useState('');
  const [completionProof, setCompletionProof] = useState(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const fetchAssignedComplaints = async () => {
    try {
      const response = await api.get('/complaints');
      const userId = user?._id || user?.id;
      const assigned = response.data.filter(c => c.assignedTo === userId);
      setComplaints(assigned);

      const emergencies = assigned.filter(c => c.priority === 'High' && c.status === 'Pending');
      if (emergencies.length > 0) {
        addNotification('Emergency Assigned!', `You have ${emergencies.length} pending emergency task(s).`, 'error', true);
        // Play siren sound
        try {
          const audio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA');
          audio.play().catch(e => console.log('Audio play failed', e));
        } catch (e) { }
      }
    } catch (err) {
      console.error('Failed to fetch assigned complaints', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAssignedComplaints();
    }
  }, [user]);

  const extractProofFromRemarks = (remarks) => {
    if (!remarks) return { text: '', proof: null };
    if (remarks.includes('PROOF_START:')) {
      const proofStr = remarks.split('PROOF_START:')[1];
      const text = remarks.split('||PROOF_START:')[0];
      return { text: text.replace('COMPLETED:', '').trim(), proof: proofStr };
    }
    return { text: remarks, proof: null };
  };

  const openEditModal = (complaint) => {
    setSelectedComplaint(complaint);

    // Status can only be 'In Progress' or 'Pending' due to schema enums. 'Completed' implies In Progress + Proof
    const isCompleted = complaint.workerRemarks && complaint.workerRemarks.includes('COMPLETED:');
    setEditStatus(isCompleted ? 'Completed' : (complaint.status || 'Pending'));

    const parsed = extractProofFromRemarks(complaint.workerRemarks);
    setEditRemarks(parsed.text);
    setCompletionProof(parsed.proof);
    setIsCameraOpen(false);
  };

  const handleUpdate = async () => {
    if (!selectedComplaint) return;

    if (
      (editStatus === 'Completed' ||
        editStatus === 'Completed (Needs Proof)') &&
      !completionProof
    ) {
      addNotification(
        'Proof Required',
        'You must capture a live photo as completion proof before marking it Completed.',
        'error'
      );
      return;
    }

    const id = selectedComplaint._id || selectedComplaint.id;
    try {
      // Encode proof inside remarks to bypass backend schema stripping
      const finalRemarks = editStatus === 'Completed' ? `COMPLETED: ${editRemarks} ||PROOF_START:${completionProof}` : editRemarks;
      const finalStatus = editStatus === 'Completed' ? 'In Progress' : editStatus; // Fallback to In Progress if schema rejects Completed

      await api.put(`/complaints/${id}`, {
        status: finalStatus,
        workerRemarks: finalRemarks,
        completionProof: completionProof // Send standard for future-proofing
      });

      setComplaints(complaints.map(c =>
        c._id === id || c.id === id ? { ...c, status: finalStatus, workerRemarks: finalRemarks } : c
      ));
      addNotification(t('common.success'), 'Task updated successfully', 'success');
      setSelectedComplaint(null);
    } catch (err) {
      addNotification(t('common.error'), 'Failed to update task', 'error');
      console.error(err);
    }
  };

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>{t('dash.welcome')} Worker</h1>

      <div className="card">
        <h2 className="card-title">{t('sidebar.assigned_tasks')}</h2>
        {loading ? (
          <div className="spinner" style={{ margin: '2rem auto' }}></div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>{t('worker.task_id')}</th>
                  <th>{t('complaint.description')}</th>
                  <th>{t('complaint.priority')}</th>
                  <th>{t('common.status')}</th>
                  <th>{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {complaints.length > 0 ? (
                  complaints.map(complaint => (
                    <tr key={complaint._id || complaint.id} className={complaint.priority === 'High' ? 'emergency-row' : ''}>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {(complaint._id || complaint.id || '').substring(0, 8).toUpperCase()}
                        {complaint.priority === 'High' && <AlertTriangle size={14} color="var(--danger)" style={{ marginLeft: '5px' }} />}
                      </td>
                      <td>
                        <div style={{ fontWeight: '600', marginBottom: '0.25rem', color: complaint.priority === 'High' ? 'var(--danger)' : 'inherit' }}>
                          {complaint.title}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                          {complaint.description && complaint.description.length > 50
                            ? complaint.description.substring(0, 50) + '...'
                            : complaint.description}
                        </div>
                      </td>
                      <td>
                        {complaint.priority === 'High' ? (
                          <span className="badge badge-rejected emergency-pulse">{t('complaint.priority_emergency') || 'Emergency'}</span>
                        ) : (
                          <span className="badge badge-in-progress" style={{ backgroundColor: '#e9ecef', color: '#495057' }}>{complaint.priority || 'Normal'}</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge badge-${(complaint.status || 'pending').toLowerCase().replace(' ', '-')}`}>
                          {complaint.workerRemarks && complaint.workerRemarks.includes('COMPLETED:') ? 'Completed' : (complaint.status || 'Pending')}
                        </span>
                      </td>
                      <td>
                        <button
                          className={`btn ${complaint.priority === 'High' ? 'btn-danger' : 'btn-primary'}`}
                          style={{ padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.875rem' }}
                          onClick={() => openEditModal(complaint)}
                        >
                          <Edit2 size={14} /> {t('worker.update_status')}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>{t('worker.no_assigned')}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* EDIT MODAL */}
      {selectedComplaint && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000
        }}>
          <div className={`card ${selectedComplaint.priority === 'High' ? 'emergency-border' : ''}`} style={{ width: '100%', maxWidth: '500px', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
            <button
              onClick={() => setSelectedComplaint(null)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
            >
              <X size={24} />
            </button>
            <h2 className="card-title" style={{ marginBottom: '1.5rem', paddingRight: '2rem', color: selectedComplaint.priority === 'High' ? 'var(--danger)' : 'var(--primary-color)' }}>
              {t('worker.update_task')}
            </h2>

            <div style={{ marginBottom: '1rem' }}>
              <strong>{t('worker.task')} </strong> {selectedComplaint.title}
            </div>

            <div className="form-group">
              <label>{t('common.status')}</label>
              <select
                className="form-control"
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">Started (In Progress)</option>
                <option value="Completed">Completed (Needs Proof)</option>
              </select>
            </div>

            {editStatus === 'Completed' && (
              <div className="form-group" style={{ padding: '1rem', border: '2px dashed var(--success)', borderRadius: '8px', backgroundColor: 'rgba(40, 167, 69, 0.05)' }}>
                <label style={{ color: 'var(--success)' }}>Live Completion Proof Required</label>
                {!isCameraOpen && !completionProof ? (
                  <button
                    className="btn btn-primary"
                    style={{ width: '100%', display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'center' }}
                    onClick={() => setIsCameraOpen(true)}
                  >
                    <Camera size={20} /> {t('worker.start_camera') || 'Start Live Camera'}
                  </button>
                ) : isCameraOpen ? (
                  <LiveCamera onCapture={(photo) => { setCompletionProof(photo); setIsCameraOpen(false); }} onCancel={() => setIsCameraOpen(false)} />
                ) : (
                  <div>
                    <img src={completionProof} alt="Proof" style={{ width: '100%', borderRadius: '4px', marginBottom: '10px' }} />
                    <button className="btn" onClick={() => setIsCameraOpen(true)} style={{ width: '100%', backgroundColor: '#6c757d', color: 'white' }}>
                      {t('worker.retake') || 'Retake Photo'}
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="form-group">
              <label>{t('complaint.worker_remarks')}</label>
              <textarea
                className="form-control"
                rows="3"
                placeholder={t('worker.add_remarks')}
                value={editRemarks}
                onChange={(e) => setEditRemarks(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button
                className={`btn ${selectedComplaint.priority === 'High' ? 'btn-danger' : 'btn-primary'}`}
                style={{ flex: 1 }}
                onClick={handleUpdate}
              >
                {t('common.save')}
              </button>
              <button
                className="btn"
                style={{ flex: 1, backgroundColor: '#6c757d', color: 'white' }}
                onClick={() => setSelectedComplaint(null)}
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkerDashboard;
