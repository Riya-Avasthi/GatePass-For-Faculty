import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './ApplyRequest.css';

const ApplyRequest = () => {
  const [formData, setFormData] = useState({
    date: '',
    timeIn: '',
    timeOut: '',
    purpose: 'Personal',
    reason: '',
    status: 'pending'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, loading: authLoading, checkAuth } = useAuth();
  
  // Recheck authentication when component mounts
  useEffect(() => {
    checkAuth();
    console.log('ApplyRequest component mounted, user:', user);
  }, []);

  // Log whenever user changes
  useEffect(() => {
    console.log('User state changed in ApplyRequest:', user);
  }, [user]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      if (!user || !user._id) {
        throw new Error('User information not available. Please login again.');
      }
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }
      
      await axios.post('http://localhost:5000/api/faculty/leave-request', {
        ...formData,
        facultyId: user._id,
        facultyEmail: user.email
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccess('Gate pass request submitted successfully!');
      setFormData({
        date: '',
        timeIn: '',
        timeOut: '',
        purpose: 'Personal',
        reason: '',
        status: 'pending'
      });
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      console.error('Error submitting request:', err);
      setError(err.response?.data?.message || err.message || 'Failed to submit request');
      
      // If we get an authentication error, try to refresh the auth
      if (err.response?.status === 401 || err.message.includes('User information') || err.message.includes('token')) {
        checkAuth();
      }
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while auth is being checked
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto text-center">
          <div className="px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">Loading user information...</span>
          </div>
        </div>
      </div>
    );
  }

  // If user is not authenticated
  if (!user) {
    console.log('No user found in ApplyRequest component');
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">Please login to apply for a gate pass.</span>
          </div>
        </div>
      </div>
    );
  }

  console.log('Rendering ApplyRequest form for user:', user.name);
  
  return (
    <div className="gatepass-form-container">
      <h1 className="text-2xl font-bold mb-4">Apply For Gate Pass</h1>
      
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      
      <form onSubmit={handleSubmit} className="gate-pass-form">
        <div className="gate-pass-title">
          <h2>Gate Pass</h2>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="date">Date :</label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
              className="form-input"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="timeOut">Time Out :</label>
            <input
              type="time"
              id="timeOut"
              name="timeOut"
              value={formData.timeOut}
              onChange={handleChange}
              required
              className="form-input"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="timeIn">Time In :</label>
            <input
              type="time"
              id="timeIn"
              name="timeIn"
              value={formData.timeIn}
              onChange={handleChange}
              required
              className="form-input"
            />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="fullName">Full Name :</label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={user.name || ''}
              readOnly
              className="form-input"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="email">Email :</label>
            <input
              type="email"
              id="email"
              name="email"
              value={user.email || ''}
              readOnly
              className="form-input"
            />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group full-width">
            <label htmlFor="purpose">Purpose (Personal/Official) :</label>
            <select
              id="purpose"
              name="purpose"
              value={formData.purpose}
              onChange={handleChange}
              required
              className="form-select"
            >
              <option value="Personal">Personal</option>
              <option value="Official">Official</option>
            </select>
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group full-width">
            <label htmlFor="reason">Reason :</label>
            <input
              type="text"
              id="reason"
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              required
              className="form-input"
              placeholder="Enter your reason for the gate pass"
            />
          </div>
        </div>
        
        <div className="form-submit">
          <button 
            type="submit" 
            disabled={loading} 
            className="submit-btn"
          >
            {loading ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ApplyRequest; 