import React, { useState, useEffect } from 'react';
import { Phone, MapPin, AlertOctagon, Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { useNotification } from '../context/NotificationContext';
import LiveCamera from '../components/LiveCamera';

const EmergencyHelp = () => {
  const { t } = useLanguage();
  const { addNotification } = useNotification();
  const navigate = useNavigate();

  const [category, setCategory] = useState('Public Safety');
  const [location, setLocation] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [workers, setWorkers] = useState([]);

  useEffect(() => {
    // Fetch workers for auto assignment
    api.get('/users')
      .then(res => setWorkers(res.data.filter(u => u.role === 'worker' || u.role === 'Worker')))
      .catch(err => console.error('Failed to fetch workers', err));
  }, []);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      addNotification('Error', 'Geolocation is not supported by your browser', 'error');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setIsLocating(false);
        addNotification('Success', 'Location detected automatically', 'success');
      },
      (error) => {
        setIsLocating(false);
        addNotification('Error', 'Failed to get location. Please ensure location services are enabled.', 'error');
      }
    );
  };

  const handlePhotoCapture = (base64Data) => {
    setPhoto(base64Data);
    setIsCameraOpen(false);
  };

  const playSiren = () => {
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA');
      audio.play().catch(e => console.log('Audio play failed', e));
    } catch(e) {}
  };

  const handleSubmitReport = async () => {
    try {
      // Backend strictly validates enums, so use "High" instead of "Emergency" to prevent 500 error.
      // Append image and gps to description since backend drops unknown fields.
      const encodedGPS = location ? `${location.lat},${location.lng}` : 'Not provided';
      const description = `EMERGENCY QUICK REPORT\nType: ${category}\nGPS: ${encodedGPS}\n[IMAGE:${photo ? photo.substring(0, 50) + '...' : 'none'}]`;
      
      const payload = {
        title: `Emergency: ${category}`,
        description: description,
        category: 'Public Safety', // valid enum
        emergencyType: category,
        image: photo, // Explicitly sending as requested by user
        gps: location ? { lat: location.lat, lng: location.lng } : null, // Explicitly sending as requested
        priority: 'High' 
      };

      const response = await api.post('/complaints', payload);
      
      addNotification('Emergency Alert Sent', 'Your emergency report has been submitted.', 'success', true);
      playSiren(); // Play siren on frontend
      
      // Auto Assign System
      const createdId = response.data?._id || response.data?.id || response.data?.complaint?._id;
      if (createdId && workers.length > 0) {
        // Filter by category if workers have it
        const eligibleWorkers = workers.filter(w => !w.category || w.category === category);
        const candidates = eligibleWorkers.length > 0 ? eligibleWorkers : workers;
        const nearestWorker = candidates[Math.floor(Math.random() * candidates.length)];
        try {
          await api.put(`/complaints/${createdId}`, { assignedTo: nearestWorker._id || nearestWorker.id, status: 'In Progress' });
        } catch(e) {
          console.error('Failed to auto-assign worker', e);
        }
      }

      navigate('/dashboard/citizen');
      
    } catch (err) {
      addNotification('Error', 'Failed to submit emergency report', 'error');
    }
  };

  const emergencyContacts = [
    { name: 'Roads & Highway', number: '1033', icon: '🛣️' },
    { name: 'Electricity', number: '1912', icon: '⚡' },
    { name: 'Water Supply', number: '1916', icon: '💧' },
    { name: 'Garbage / Sanitation', number: '155304', icon: '🗑️' },
    { name: 'Police', number: '100', icon: '🚓' },
    { name: 'Women Safety', number: '1091', icon: '🛡️' },
    { name: 'Child Helpline', number: '1098', icon: '🧸' },
    { name: 'Ambulance', number: '108', icon: '🚑' },
    { name: 'Fire', number: '101', icon: '🔥' },
  ];

  return (
    <div style={{ padding: '1rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2rem' }}>
        <AlertOctagon size={32} />
        {t('emergency.title') || 'Emergency Help'}
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
        
        {/* ONE-TAP DIAL SECTION */}
        <div className="card emergency-border">
          <h2 className="card-title" style={{ color: 'var(--danger)' }}>One-Tap Emergency Dial</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {emergencyContacts.map((contact, idx) => (
              <a 
                key={idx}
                href={`tel:${contact.number}`} 
                className="btn"
                style={{ 
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                  backgroundColor: '#fff', border: '2px solid var(--danger)', color: 'var(--danger)',
                  padding: '1rem', fontSize: '1.2rem', textDecoration: 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span>{contact.icon}</span>
                  <strong>{contact.name}</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span>{contact.number}</span>
                  <Phone size={24} />
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* QUICK REPORT SECTION */}
        <div className="card" style={{ backgroundColor: 'rgba(220, 53, 69, 0.05)' }}>
          <h2 className="card-title" style={{ color: 'var(--danger)' }}>{t('emergency.quick_report') || 'Quick Report'}</h2>
          
          {!isCameraOpen ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              <div className="form-group">
                <label style={{ color: 'var(--danger)' }}>Emergency Type</label>
                <select className="form-control" style={{ border: '2px solid var(--danger)' }} value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="Public Safety">Public Safety / Accident</option>
                  <option value="Electricity">Electrical Hazard / Fire</option>
                  <option value="Roads">Major Road Block / Sinkhole</option>
                  <option value="Water">Severe Flooding / Pipe Burst</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button 
                  className="btn" 
                  style={{ backgroundColor: location ? 'var(--success)' : '#e9ecef', color: location ? 'white' : 'black', display: 'flex', gap: '10px', width: '100%' }}
                  onClick={handleGetLocation}
                >
                  <MapPin size={20} />
                  {isLocating ? 'Detecting...' : location ? 'Location Detected' : t('emergency.detect_gps') || 'Detect Location'}
                </button>

                <button 
                  className="btn" 
                  style={{ backgroundColor: photo ? 'var(--success)' : '#007bff', color: 'white', display: 'flex', gap: '10px', width: '100%' }}
                  onClick={() => setIsCameraOpen(true)}
                >
                  <Camera size={20} />
                  {photo ? 'Photo Captured' : t('emergency.take_photo') || 'Take Live Photo'}
                </button>
              </div>

              {photo && (
                <div style={{ width: '100%', borderRadius: '8px', overflow: 'hidden', border: '2px solid var(--danger)' }}>
                  <img src={photo} alt="Emergency Proof" style={{ width: '100%', display: 'block' }} />
                </div>
              )}

              <button 
                className="btn btn-danger emergency-pulse" 
                style={{ width: '100%', padding: '1rem', fontSize: '1.2rem', marginTop: '1rem' }}
                onClick={handleSubmitReport}
              >
                SUBMIT EMERGENCY
              </button>
            </div>
          ) : (
            <LiveCamera onCapture={handlePhotoCapture} onCancel={() => setIsCameraOpen(false)} />
          )}

        </div>
      </div>
    </div>
  );
};

export default EmergencyHelp;
