const axios = require('axios');

async function test() {
  const baseURL = 'http://localhost:5000/api';
  try {
    // 1. Register a test user
    const email = `test${Date.now()}@example.com`;
    const regRes = await axios.post(`${baseURL}/auth/register`, {
      name: 'Test User',
      email: email,
      password: 'password123',
      role: 'admin' // or citizen
    });
    console.log('Register successful');

    // 2. Login
    const loginRes = await axios.post(`${baseURL}/auth/login`, {
      email: email,
      password: 'password123'
    });
    const token = loginRes.data.token;
    console.log('Login successful, token:', token.substring(0, 10) + '...');

    // 3. Post a complaint
    const prioritiesToTest = ['Low', 'Medium', 'High', 'Urgent', 'Normal', 'low', 'medium', 'high', 'normal'];
    for (const p of prioritiesToTest) {
      try {
        const compRes = await axios.post(`${baseURL}/complaints`, {
          title: 'Emergency: Fire',
          description: 'Fire everywhere',
          category: 'Public Safety',
          priority: p
        }, { headers: { Authorization: `Bearer ${token}` } });
        console.log(`Post complaint successful with priority ${p}:`, compRes.data);
        break; // If successful, stop testing
      } catch (e) {
        console.log(`Post complaint error with priority ${p}:`, e.response?.data?.message || e.message);
      }
    }

    // 4. Test updating status
    const complaintId = compRes.data._id;
    const statusesToTest = ['Assigned', 'In Progress', 'Resolved', 'Started', 'Completed', 'Pending'];
    for (const s of statusesToTest) {
      try {
        const updateRes = await axios.put(`${baseURL}/complaints/${complaintId}`, {
          status: s
        }, { headers: { Authorization: `Bearer ${token}` } });
        console.log(`Update status successful with ${s}`);
      } catch (e) {
        console.log(`Update status error with ${s}:`, e.response?.data?.message || e.message);
      }
    }
    
    // 5. Test updating assignedTo
    try {
      const updateRes = await axios.put(`${baseURL}/complaints/${complaintId}`, {
        assignedTo: regRes.data._id || regRes.data.user?._id || '6a0a01f22d3830b5fc3e3de4'
      }, { headers: { Authorization: `Bearer ${token}` } });
      console.log(`Update assignedTo successful`);
    } catch (e) {
      console.log(`Update assignedTo error:`, e.response?.data?.message || e.message);
    }
  } catch (err) {
    console.error('Fatal error:', err.response?.data || err.message);
  }
}

test();
