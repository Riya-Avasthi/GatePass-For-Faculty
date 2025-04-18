import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import './ViewerRequests.css';

const ViewerAllowedRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const navigate = useNavigate();
  
  // Check if user is logged in and is viewer
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!token) {
      console.log('No token found, redirecting to login');
      navigate('/login');
      return;
    }
    
    if (user.role !== 'viewer') {
      console.log('User is not viewer, redirecting to dashboard');
      navigate('/dashboard');
      return;
    }
    
    fetchAllowedRequests();
  }, [navigate]);
  
  // Fetch allowed requests
  const fetchAllowedRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.get('http://localhost:5000/api/viewer/all-allowed', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Allowed requests:', response.data);
      setRequests(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching allowed requests:', err);
      setError('Failed to fetch requests. Please try again later.');
      setLoading(false);
      toast.error("Failed to load allowed requests. Please try again later.");
    }
  };
  
  // Format the date for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Format the allowed date for display
  const formatAllowedDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Filter requests based on search term
  const filteredRequests = requests.filter(request => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const facultyName = request.facultyEmail?.split('@')[0] || '';
    return (
      facultyName.toLowerCase().includes(searchLower) ||
      (request.facultyEmail || '').toLowerCase().includes(searchLower) ||
      (request.purpose || '').toLowerCase().includes(searchLower) ||
      (request.reason || '').toLowerCase().includes(searchLower)
    );
  });
  
  if (loading) {
    return (
      <div className="viewer-requests-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading requests...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="viewer-requests-container">
      <div className="viewer-requests-header">
        <h1 className="viewer-requests-title">Gate Passes - Allowed Requests</h1>
        <p className="viewer-requests-subtitle">
          Requests allowed to leave through the gate
        </p>
        
        {error && (
          <div className="error-message">
            {error}
            <button onClick={() => setError('')} className="close-btn">×</button>
          </div>
        )}
        
        <div className="actions-bar">
          <button 
            onClick={() => fetchAllowedRequests()}
            className="refresh-btn"
            disabled={loading}
          >
            Refresh Requests
          </button>
          
          <button 
            onClick={() => navigate('/viewer/all-requests')}
            className="view-all-btn"
          >
            View All Requests
          </button>
          
          <div className="search-container">
            <input
              type="text"
              placeholder="Search by faculty, purpose or reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="clear-search-btn"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>
      
      <div className="content-container">
        {filteredRequests.length === 0 ? (
          <div className="no-requests">
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              {searchTerm ? (
                <>
                  <h3>No matching requests</h3>
                  <p>No allowed requests match your search term</p>
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="view-all-btn"
                  >
                    Clear Search
                  </button>
                </>
              ) : (
                <>
                  <h3>No allowed requests</h3>
                  <p>No gate passes have been marked as allowed yet</p>
                  <button 
                    onClick={() => navigate('/viewer/all-requests')}
                    className="view-all-btn"
                  >
                    View All Requests
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="requests-table-container">
            <table className="requests-table">
              <thead>
                <tr>
                  <th>Faculty</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Purpose</th>
                  <th>Status</th>
                  <th>Allowed At</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((request) => (
                  <tr 
                    key={request._id} 
                    className={`request-row status-${request.status}-row allowed-row`}
                  >
                    <td data-label="Faculty">
                      <div className="faculty-name">{request.facultyEmail?.split('@')[0] || 'Unknown'}</div>
                      <div className="faculty-email">{request.facultyEmail || 'No email'}</div>
                    </td>
                    <td data-label="Date">
                      {formatDate(request.date)}
                    </td>
                    <td data-label="Time">
                      <div className="request-time">Out: {request.timeOut}</div>
                      <div className="request-time">In: {request.timeIn}</div>
                    </td>
                    <td data-label="Purpose">
                      <span className={`purpose-badge purpose-${(request.purpose || '').toLowerCase()}`}>
                        {request.purpose || 'Unknown'}
                      </span>
                      <div className="request-reason">{request.reason || 'No reason provided'}</div>
                    </td>
                    <td data-label="Status">
                      <span className={`status-badge status-${request.status || 'unknown'}`}>
                        {request.status ? (request.status.charAt(0).toUpperCase() + request.status.slice(1)) : 'Unknown'}
                      </span>
                    </td>
                    <td data-label="Allowed At">
                      <div className="allowed-at">
                        {formatAllowedDate(request.allowedAt)}
                      </div>
                      <div className="allowed-badge">
                        Allowed ✓
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewerAllowedRequests; 