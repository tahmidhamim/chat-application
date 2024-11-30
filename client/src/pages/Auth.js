import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Auth = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/'); // Redirect to Chat page
    }
  }, [navigate]);

  const handleRegister = async () => {
    try {
      const response = await axios.post('http://localhost:5000/api/register', {
        username,
        password,
      });
      alert('Registration successful! Please login.');
    } catch (error) {
      alert('Registration failed: ' + error.response.data.message);
    }
  };

  const handleLogin = async () => {
    try {
      const response = await axios.post('http://localhost:5000/api/login', {
        username,
        password,
      });
      localStorage.setItem('token', response.data.token); // Save the token
      localStorage.setItem('userId', response.data.userId);
      navigate('/');
    } catch (error) {
      alert('Login failed: ' + error.response.data.message);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="bg-white p-6 rounded shadow-md w-80">
        <h2 className="text-xl font-bold mb-4 text-center">Welcome</h2>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="block w-full p-2 mb-4 border rounded"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="block w-full p-2 mb-4 border rounded"
        />
        <div className="flex justify-between">
          <button
            onClick={handleLogin}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Login
          </button>
          <button
            onClick={handleRegister}
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            Register
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
