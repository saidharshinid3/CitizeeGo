import React, { useState, useEffect, useContext } from 'react';

import { Link, useNavigate } from 'react-router-dom';

import { AuthContext } from '../context/AuthContext';

const Login = () => {

  const navigate = useNavigate();

  const { login, user, loading } = useContext(AuthContext);

  const [email, setEmail] = useState('');

  const [password, setPassword] = useState('');

  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && user) {
      const userRole = user.role ? user.role.toLowerCase() : 'citizen';
      navigate(`/dashboard/${userRole}`);
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e) => {

    e.preventDefault();

    setError('');

    const result = await login(email, password);

    if (result.success) {

      const userRole = result.role ? result.role.toLowerCase() : 'citizen';
      navigate(`/dashboard/${userRole}`);

    } else {

      setError(result.message);

    }
  };

  return (

    <div style={{
      width: '100%',
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: '#f4f4f4'
    }}>

      <div style={{
        width: '400px',
        background: '#fff',
        padding: '30px',
        borderRadius: '10px'
      }}>

        <h1>Login</h1>

        {error && (
          <p style={{ color: 'red' }}>
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit}>

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              marginBottom: '15px'
            }}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              marginBottom: '15px'
            }}
          />

          <button
            type="submit"
            style={{
              width: '100%',
              padding: '10px',
              background: 'blue',
              color: 'white',
              border: 'none'
            }}
          >
            Login
          </button>

        </form>

        <p style={{ marginTop: '15px' }}>
          No account?
          <Link to="/register"> Register</Link>
        </p>

      </div>

    </div>
  );
};

export default Login;