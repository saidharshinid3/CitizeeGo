
import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Building2, KeyRound, Mail, User, Shield } from 'lucide-react';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('citizen');
  const [error, setError] = useState('');

  const { register, user, loading } = useContext(AuthContext);
  const { t } = useLanguage();

  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      const userRole = user.role
        ? user.role.toLowerCase()
        : 'citizen';

      navigate(`/dashboard/${userRole}`);
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');

    const result = await register(
      name,
      email,
      password,
      role
    );

    if (result.success) {
      navigate('/');
    } else {
      setError(result.message);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: 'var(--background-light)'
      }}
    >
      {/* LEFT BANNER */}
      <div
        style={{
          flex: 1,
          backgroundColor: 'var(--primary-color)',
          color: 'white',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '3rem',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ position: 'relative', zIndex: 1 }}>
          <img
  src="/CitizeeGo1.png"
  alt="CitizeeGo Logo"
  style={{
    width: '80px',
    marginBottom: '2rem'
  }}
/>

          <h1
            style={{
              color: 'white',
              fontSize: '2.5rem',
              marginBottom: '1rem'
            }}
          >
            {t('app.title')}
          </h1>

          <p
            style={{
              fontSize: '1.2rem',
              lineHeight: 1.6,
              opacity: 0.9
            }}
          >
            Official Citizen Grievance Redressal System.
            Empowering citizens through transparent
            governance.
          </p>
        </div>

        {/* Background Circle */}
        <div
          style={{
            position: 'absolute',
            bottom: '-10%',
            left: '-10%',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(0,86,179,0.5) 0%, rgba(0,0,0,0) 70%)'
          }}
        />
      </div>

      {/* RIGHT FORM */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem'
        }}
      >
        <div
          className="card"
          style={{
            width: '100%',
            maxWidth: '450px',
            borderTop: '4px solid orange'
          }}
        >
          <h2
            style={{
              textAlign: 'center',
              marginBottom: '2rem',
              color: 'var(--primary-color)'
            }}
          >
            Citizen Registration
          </h2>

          {error && (
            <div
              style={{
                backgroundColor: '#ffe5e5',
                color: 'red',
                padding: '10px',
                marginBottom: '1rem',
                borderRadius: '5px',
                textAlign: 'center'
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* NAME */}
            <div className="form-group">
              <label>Full Name</label>

              <div style={{ position: 'relative' }}>
                <User
                  size={18}
                  style={{
                    position: 'absolute',
                    left: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#777'
                  }}
                />

                <input
                  type="text"
                  className="form-control"
                  style={{ paddingLeft: '2.5rem' }}
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  required
                />
              </div>
            </div>

            {/* EMAIL */}
            <div className="form-group">
              <label>Email Address</label>

              <div style={{ position: 'relative' }}>
                <Mail
                  size={18}
                  style={{
                    position: 'absolute',
                    left: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#777'
                  }}
                />

                <input
                  type="email"
                  className="form-control"
                  style={{ paddingLeft: '2.5rem' }}
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  required
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div className="form-group">
              <label>Password</label>

              <div style={{ position: 'relative' }}>
                <KeyRound
                  size={18}
                  style={{
                    position: 'absolute',
                    left: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#777'
                  }}
                />

                <input
                  type="password"
                  className="form-control"
                  style={{ paddingLeft: '2.5rem' }}
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  required
                />
              </div>
            </div>

            {/* ROLE */}
            <div
              className="form-group"
              style={{ marginBottom: '2rem' }}
            >
              <label>Role</label>

              <div style={{ position: 'relative' }}>
                <Shield
                  size={18}
                  style={{
                    position: 'absolute',
                    left: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#777'
                  }}
                />

                <select
                  className="form-control"
                  style={{ paddingLeft: '2.5rem' }}
                  value={role}
                  onChange={(e) =>
                    setRole(e.target.value)
                  }
                >
                  <option value="citizen">
                    Citizen
                  </option>

                  <option value="worker">
                    Worker
                  </option>

                  <option value="admin">
                    Admin
                  </option>
                </select>
              </div>

              <small
                style={{
                  color: '#777',
                  display: 'block',
                  marginTop: '0.5rem'
                }}
              >
                Developer testing mode enabled.
              </small>
            </div>

            {/* BUTTON */}
            <button
              type="submit"
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '0.9rem',
                fontSize: '1rem'
              }}
            >
              Create Account
            </button>
          </form>

          <div
            style={{
              marginTop: '2rem',
              textAlign: 'center'
            }}
          >
            <p>
              Already have an account?{' '}
              <Link to="/login">
                Login here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
