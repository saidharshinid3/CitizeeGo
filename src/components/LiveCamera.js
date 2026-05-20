import React, { useRef, useState, useCallback } from 'react';
import { Camera, RefreshCw, Check } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const LiveCamera = ({ onCapture, onCancel }) => {
  const { t } = useLanguage();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  
  const [stream, setStream] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [error, setError] = useState('');

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setError('');
    } catch (err) {
      console.error("Error accessing camera: ", err);
      setError("Unable to access camera. Please check permissions.");
    }
  }, []);

  // Initialize camera on mount
  React.useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera]);

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      setPhoto(dataUrl);
    }
  };

  const retakePhoto = () => {
    setPhoto(null);
  };

  const confirmPhoto = () => {
    stopCamera();
    if (onCapture) onCapture(photo);
  };

  const handleCancel = () => {
    stopCamera();
    if (onCancel) onCancel();
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', 
      background: '#000', padding: '1rem', borderRadius: '8px', 
      width: '100%', maxWidth: '500px', margin: '0 auto'
    }}>
      {error && <div style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{error}</div>}
      
      {!photo ? (
        <div style={{ position: 'relative', width: '100%' }}>
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            style={{ width: '100%', borderRadius: '8px', backgroundColor: '#333' }} 
          />
          <button 
            onClick={capturePhoto}
            style={{
              position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
              width: '60px', height: '60px', borderRadius: '50%', background: 'var(--white)',
              border: '4px solid var(--danger)', cursor: 'pointer', display: 'flex', 
              alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.5)'
            }}
          >
            <Camera color="var(--danger)" />
          </button>
        </div>
      ) : (
        <div style={{ width: '100%' }}>
          <img src={photo} alt="Captured" style={{ width: '100%', borderRadius: '8px' }} />
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button className="btn" onClick={retakePhoto} style={{ flex: 1, backgroundColor: '#6c757d', color: 'white' }}>
              <RefreshCw size={16} style={{ marginRight: '5px' }} /> {t('worker.retake') || 'Retake'}
            </button>
            <button className="btn btn-primary" onClick={confirmPhoto} style={{ flex: 1 }}>
              <Check size={16} style={{ marginRight: '5px' }} /> {t('common.submit') || 'Submit'}
            </button>
          </div>
        </div>
      )}
      
      <button 
        className="btn" 
        onClick={handleCancel} 
        style={{ marginTop: '1rem', background: 'transparent', color: 'var(--white)', textDecoration: 'underline' }}
      >
        {t('common.cancel') || 'Cancel'}
      </button>

      {/* Hidden canvas for image extraction */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
};

export default LiveCamera;
