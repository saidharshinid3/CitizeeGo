import React, { useState, useEffect } from 'react';
import { FileText, Clock, CheckCircle, Eye, X, Camera, AlertTriangle, MapPin } from 'lucide-react';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { useNotification } from '../context/NotificationContext';
import LiveCamera from '../components/LiveCamera';

const CitizenDashboard = () => {
  const { t } = useLanguage();
  const { addNotification } = useNotification();

  const [complaints, setComplaints] = useState([]);
  const [workers, setWorkers] = useState([]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Roads');
  const [priority, setPriority] = useState('Low');
  const [location, setLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);

  const [imagePreview, setImagePreview] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  const fetchComplaints = async () => {
    try {
      const response = await api.get('/complaints');
      setComplaints(response.data);
    } catch (err) {
      console.error('Failed to fetch complaints', err);
      try {
        const res = await api.get('/complaints');
        setComplaints(res.data);
      } catch (e) {
        console.error(e);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkers = async () => {
    try {
      const res = await api.get('/users');
      setWorkers(res.data.filter(u => u.role === 'worker' || u.role === 'Worker'));
    } catch (e) {
      console.error('Failed to fetch workers', e);
    }
  };

  useEffect(() => {

    fetchComplaints();
    fetchWorkers();

    const interval = setInterval(() => {

      fetchComplaints();
      fetchWorkers();

    }, 3000);

    return () => clearInterval(interval);

  }, [])

  const clearImage = () => {
    setImagePreview(null);
    setImageBase64(null);
    setIsCameraOpen(false);
  };

  const handlePhotoCapture = (base64Data) => {
    setImageBase64(base64Data);
    setImagePreview(base64Data);
    setIsCameraOpen(false);
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      addNotification(t('common.error'), 'Geolocation is not supported by your browser', 'error');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        setIsLocating(false);
        addNotification(t('common.success'), 'Location detected automatically', 'success');
      },
      (error) => {
        setIsLocating(false);
        addNotification(t('common.error'), 'Failed to get location.', 'error');
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const finalDescription = location ? `${description}\n[GPS: ${location.lat}, ${location.lng}]` : description;

      const response = await api.post('/complaints', {
        title,
        description: finalDescription,
        category,
        priority,
        image: imageBase64
      });

      addNotification(t('common.success'), t('complaint.success_msg'), 'success', priority === 'Emergency');

      // Auto Assign to Nearest Worker if Emergency
      if (priority === 'Emergency') {
        const createdId = response.data?._id || response.data?.id || response.data?.complaint?._id;
        if (createdId && workers.length > 0) {
          const eligibleWorkers = workers.filter(w => !w.category || w.category === category);
          const candidates = eligibleWorkers.length > 0 ? eligibleWorkers : workers;
          const nearestWorker = candidates[Math.floor(Math.random() * candidates.length)];
          try {
            await api.put(`/complaints/${createdId}`, { assignedTo: nearestWorker._id || nearestWorker.id });
            addNotification('Emergency Alert!', `Complaint automatically assigned to worker: ${nearestWorker.name}`, 'info', true);
          } catch (e) {
            console.error('Failed to auto-assign worker', e);
          }
        }
      }

      setTitle('');
      setDescription('');
      setCategory('Roads');
      setPriority('low');
      setLocation(null);
      clearImage();

      fetchComplaints();
    } catch (err) {
      addNotification(t('common.error'), err.response?.data?.message || t('complaint.error_msg'), 'error');
    }
  };
  const handleDeleteComplaint = async (id) => {

    try {

      await api.delete(`/complaints/${id}`);

      addNotification(
        'Success',
        'Complaint deleted successfully',
        'success'
      );

      fetchComplaints();

    } catch (error) {

      console.error(error);

      addNotification(
        'Error',
        'Failed to delete complaint',
        'error'
      );

    }

  };

  const totalComplaints = complaints.length;
  const emergencyComplaints = complaints.filter(c => c.priority === 'Emergency' || c.priority === 'emergency').length;
  const pendingComplaints = complaints.filter(c => c.status === 'Pending' || c.status === 'pending' || !c.status).length;
  const resolvedComplaints = complaints.filter(c => c.status === 'Resolved' || c.status === 'resolved').length;

  const renderTimeline = (complaint) => {

    const s = (complaint.status || 'pending').toLowerCase();

    const hasWorker = !!complaint.assignedWorker;

    const hasProof = !!complaint.completionProof;

    const steps = [
      { key: 'pending', label: t('timeline.submitted') || 'Submitted' },
      { key: 'assigned', label: t('timeline.assigned') || 'Assigned' },
      { key: 'started', label: t('timeline.started') || 'Started' },
      { key: 'completed', label: t('timeline.completed') || 'Completed (Proof Uploaded)' },
      { key: 'resolved', label: t('timeline.verified') || 'Verified & Resolved' }
    ];

    let currentIndex = 0;

    // Worker assigned
    if (hasWorker) currentIndex = 1;

    // Work started
    if (s === 'started' || s === 'in progress') currentIndex = 2;

    // Proof uploaded
    if (hasProof) currentIndex = 3;
    // Admin verified
    if (s === 'resolved') currentIndex = 4;


    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2rem 0', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '15px', left: '0', right: '0', height: '4px', background: '#e9ecef', zIndex: 1 }}></div>
        <div style={{ position: 'absolute', top: '15px', left: '0', width: `${(currentIndex / 4) * 100}%`, height: '4px', background: 'var(--success)', zIndex: 1, transition: 'width 0.5s ease' }}></div>

        {steps.map((step, index) => (
          <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, position: 'relative' }}>
            <div style={{
              width: '34px', height: '34px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: index <= currentIndex ? 'var(--success)' : '#e9ecef',
              color: index <= currentIndex ? 'white' : 'transparent',
              border: `4px solid ${index <= currentIndex ? '#c3e6cb' : '#fff'}`
            }}>
              {index <= currentIndex && <CheckCircle size={16} />}
            </div>
            <span style={{ fontSize: '0.75rem', marginTop: '8px', color: index <= currentIndex ? 'var(--primary-color)' : 'var(--text-secondary)', fontWeight: index <= currentIndex ? 'bold' : 'normal', textAlign: 'center', maxWidth: '70px' }}>
              {step.label}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{ padding: '1rem' }}>
      <h1 style={{ marginBottom: '2rem', color: 'var(--primary-color)' }}>{t('dash.welcome_citizen')}</h1>

      {/* STATISTICS */}
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
          <div className="metric-icon" style={{ backgroundColor: 'rgba(40, 167, 69, 0.1)', color: 'var(--success)' }}>
            <CheckCircle size={28} />
          </div>
          <div className="metric-info">
            <h3>{t('dash.resolved')}</h3>
            <p>{resolvedComplaints}</p>
          </div>
        </div>
      </div>

      <div
  style={{
    display: 'flex',
    gap: '2rem',
    flexWrap: 'wrap',
    flexDirection: window.innerWidth <= 768 ? 'column' : 'row'
  }}
>
        {/* COMPLAINT FORM */}
        <div
  className={`card ${priority === 'Emergency' ? 'emergency-border' : ''}`}
  style={{
    flex: window.innerWidth <= 768
      ? '1 1 100%'
      : '1 1 350px',
    width: '100%',
    alignSelf: 'flex-start'
  }}
>
          <h2 className="card-title" style={{ color: priority === 'Emergency' ? 'var(--danger)' : 'var(--primary-color)' }}>
            {t('complaint.submit_title')}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>{t('complaint.title')}</label>
              <input type="text" className="form-control" placeholder={t('complaint.enter_title')} value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>

            <div className="form-group">
              <label>{t('complaint.description')}</label>
              <textarea className="form-control" rows="4" placeholder={t('complaint.enter_desc')} value={description} onChange={(e) => setDescription(e.target.value)} required />
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>{t('complaint.category')}</label>
                <select className="form-control" value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="Roads">{t('complaint.category_roads')}</option>
                  <option value="Water">{t('complaint.category_water')}</option>
                  <option value="Electricity">{t('complaint.category_electricity')}</option>
                  <option value="Garbage">{t('complaint.category_garbage')}</option>
                  <option value="Public Safety">{t('complaint.category_safety')}</option>
                </select>
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>{t('complaint.priority')}</label>
                <select
                  className="form-control"
                  style={{ borderColor: priority === 'Emergency' ? 'var(--danger)' : 'var(--border-color)', color: priority === 'Emergency' ? 'var(--danger)' : 'inherit', fontWeight: priority === 'Emergency' ? 'bold' : 'normal' }}
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Emergency">Emergency</option>
                </select>
              </div>
            </div>

            {/* GPS & CAMERA */}
            <div className="form-group">
              <label>{t('complaint.location')} / {t('complaint.preview')}</label>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
                <button type="button" className="btn" onClick={handleGetLocation} style={{ flex: 1, padding: '0.5rem', fontSize: '0.9rem', backgroundColor: location ? 'var(--success)' : '#e9ecef', color: location ? 'white' : '#495057' }}>
                  <MapPin size={16} style={{ marginRight: '5px' }} /> {isLocating ? '...' : location ? 'GPS Set' : 'Get GPS'}
                </button>
                <button type="button" className="btn btn-accent" onClick={() => setIsCameraOpen(true)} style={{ flex: 1, padding: '0.5rem', fontSize: '0.9rem' }}>
                  <Camera size={16} style={{ marginRight: '5px' }} /> {t('complaint.camera_btn')}
                </button>
              </div>

              {isCameraOpen && (
                <div style={{ marginBottom: '10px' }}>
                  <LiveCamera onCapture={handlePhotoCapture} onCancel={() => setIsCameraOpen(false)} />
                </div>
              )}

              {imagePreview && (
                <div style={{ position: 'relative', marginTop: '10px', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                  <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '200px', objectFit: 'cover', display: 'block' }} />
                  <button type="button" onClick={clearImage} style={{ position: 'absolute', top: '5px', right: '5px', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer' }}>×</button>
                </div>
              )}
            </div>

            <button type="submit" className={`btn ${priority === 'Emergency' ? 'btn-danger emergency-pulse' : 'btn-primary'}`} style={{ width: '100%' }}>
              {t('complaint.submit_btn')}
            </button>
          </form>
        </div>

        {/* COMPLAINT TABLE */}
        <div
  className="card"
  style={{
    flex: window.innerWidth <= 768
      ? '1 1 100%'
      : '2 1 500px',
    width: '100%'
  }}
>
          <h2 className="card-title">{t('dash.my_complaints')}</h2>
          {loading ? (
            <div className="spinner" style={{ margin: '2rem auto' }}></div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>{t('complaint.title')}</th>
                    <th>{t('complaint.priority')}</th>
                    <th>{t('common.status')}</th>
                    <th>{t('common.date')}</th>
                    <th>{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {complaints.length > 0 ? (
                    complaints.map((complaint) => (
                      <tr key={complaint._id || complaint.id}>
                        <td style={{ fontWeight: complaint.priority === 'Emergency' ? 'bold' : 'normal' }}>
                          {complaint.title}
                        </td>
                        <td>
                          {complaint.priority === 'Emergency' ? (
                            <span className="badge badge-rejected emergency-pulse">Emergency</span>
                          ) : (
                            <span className="badge badge-in-progress" style={{ backgroundColor: '#e9ecef', color: '#495057' }}>Normal</span>
                          )}
                        </td>
                        <td>
                          <span className={`badge badge-${(complaint.status || 'pending').toLowerCase().replace(' ', '-')}`}>
                            {t(`dash.${(complaint.status || 'pending').toLowerCase().replace(' ', '_')}`) || complaint.status || 'Pending'}
                          </span>
                        </td>
                        <td>{new Date(complaint.createdAt).toLocaleDateString()}</td>
                        <td>
                          <button
                            className="btn"
                            style={{ padding: '0.2rem 0.5rem', display: 'flex', alignItems: 'center', gap: '0.2rem', background: '#e9ecef', color: '#495057' }}
                            onClick={() => setSelectedComplaint(complaint)}
                          >
                            <Eye size={16} /> {t('common.view')}
                          </button>
                          <button
                            className="btn"
                            style={{
                              padding: '0.2rem 0.5rem',
                              backgroundColor: '#dc3545',
                              color: 'white',
                              marginLeft: '8px'
                            }}
                            onClick={() => handleDeleteComplaint(complaint._id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>{t('dash.no_complaints')}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* COMPLAINT DETAILS MODAL */}
      {selectedComplaint && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000
        }}>
          <div className={`card ${selectedComplaint.priority === 'Emergency' ? 'emergency-border' : ''}`} style={{ width: '100%', maxWidth: '600px', position: 'relative', margin: '20px', maxHeight: '90vh', overflowY: 'auto' }}>
            <button
              onClick={() => setSelectedComplaint(null)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
            >
              <X size={24} />
            </button>
            <h2 className="card-title" style={{ marginBottom: '0.5rem', paddingRight: '2rem', color: selectedComplaint.priority === 'Emergency' ? 'var(--danger)' : 'var(--primary-color)' }}>
              {selectedComplaint.title}
            </h2>

            {/* TIMELINE */}
            {renderTimeline(selectedComplaint)}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <strong>{t('complaint.category')}: </strong> {t(`complaint.category_${(selectedComplaint.category || 'roads').toLowerCase().split(' ')[0]}`) || selectedComplaint.category}
              </div>
              <div>
                <strong>{t('complaint.priority')}: </strong>
                {selectedComplaint.priority === 'Emergency' ? (
                  <span className="badge badge-rejected emergency-pulse">{t('complaint.priority_emergency')}</span>
                ) : (
                  <span className="badge" style={{ backgroundColor: '#e9ecef', color: '#495057' }}>{t('complaint.priority_normal')}</span>
                )}
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <strong>{t('complaint.date_submitted')}: </strong> {new Date(selectedComplaint.createdAt).toLocaleString()}
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <strong>{t('complaint.description')}: </strong>
              <div style={{ padding: '0.75rem', backgroundColor: '#f8f9fa', borderRadius: '4px', marginTop: '0.5rem', whiteSpace: 'pre-wrap' }}>
                {selectedComplaint.description}
              </div>
            </div>

            {selectedComplaint.image && (
              <div style={{ marginBottom: '1rem' }}>
                <strong>{t('complaint.preview')}: </strong>
                <div style={{ marginTop: '0.5rem', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                  <img src={selectedComplaint.image} alt="Complaint Evidence" style={{ width: '100%', maxHeight: '200px', objectFit: 'contain' }} />
                </div>
              </div>
            )}

            {(() => {
              const extractProofFromRemarks = (remarks) => {
                if (!remarks) return { text: '', proof: null };
                if (remarks.includes('PROOF_START:')) {
                  const proofStr = remarks.split('PROOF_START:')[1];
                  const text = remarks.split('||PROOF_START:')[0];
                  return { text: text.replace('COMPLETED:', '').trim(), proof: proofStr };
                }
                return { text: remarks, proof: null };
              };

              const parsed = extractProofFromRemarks(selectedComplaint.workerRemarks);

              return (
                <React.Fragment>
                  {parsed.text && (
                    <div style={{ marginBottom: '1rem' }}>
                      <strong>{t('complaint.worker_remarks')}: </strong>
                      <div style={{ padding: '0.75rem', backgroundColor: '#e9f5ff', borderRadius: '4px', marginTop: '0.5rem', borderLeft: '4px solid var(--primary-color)' }}>
                        {parsed.text}
                      </div>
                    </div>
                  )}

                  {(parsed.proof || selectedComplaint.completionProof) && (
                    <div style={{ marginBottom: '1rem' }}>
                      <strong>Worker Completion Proof: </strong>
                      <div style={{ marginTop: '0.5rem', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--success)' }}>
                        <img src={parsed.proof || selectedComplaint.completionProof} alt="Completion Proof" style={{ width: '100%', maxHeight: '200px', objectFit: 'contain' }} />
                      </div>
                    </div>
                  )}
                </React.Fragment>
              );
            })()}

            <button
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '1rem' }}
              onClick={() => setSelectedComplaint(null)}
            >
              {t('common.close')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CitizenDashboard;
