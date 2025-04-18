import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './FacultyRequests.css';

const FacultyRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [requestCounts, setRequestCounts] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'cards'
  
  const navigate = useNavigate();
  
  // Check if user is logged in and is faculty
  useEffect(() => {
    // Get user information from AuthContext instead of localStorage
    const token = localStorage.getItem('token');
    const userFromStorage = JSON.parse(localStorage.getItem('user') || '{}');
    
    console.log('Checking authentication for FacultyRequests...');
    console.log('User data:', userFromStorage);
    
    if (!token) {
      console.log('No token found, redirecting to login');
      navigate('/login');
      return;
    }
    
    // Don't check role here - rely on the PrivateRoute component in App.jsx
    // that has already verified this is a faculty member
    
    console.log('User is authenticated, fetching requests');
    fetchRequests();
  }, [navigate]);
  
  // Fetch faculty's requests
  const fetchRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      console.log('Fetching requests for faculty...');
      console.log('User ID:', user._id);
      console.log('Token exists:', !!token);
      
      if (!token) {
        setError('Authentication token not found. Please log in again.');
        setLoading(false);
        return;
      }
      
      // First check if server is accessible
      try {
        console.log('Checking server status...');
        const statusCheck = await axios.get('http://localhost:5000/api/status');
        console.log('Server status:', statusCheck.data);
      } catch (err) {
        console.error('Server status check failed:', err);
        setError('Could not connect to server. Please check if the server is running.');
        setLoading(false);
        return;
      }
      
      // Now fetch faculty requests
      console.log('Fetching faculty requests from API...');
      const response = await axios.get('http://localhost:5000/api/faculty/my-requests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Response from API:', response.data);
      
      if (Array.isArray(response.data)) {
        const fetchedRequests = response.data;
        
        // Set requests data
        setRequests(fetchedRequests);
        
        // Calculate counts
        const counts = {
          total: fetchedRequests.length,
          pending: fetchedRequests.filter(r => r.status === 'pending').length,
          approved: fetchedRequests.filter(r => r.status === 'approved').length,
          rejected: fetchedRequests.filter(r => r.status === 'rejected').length
        };
        
        console.log('Request counts:', counts);
        setRequestCounts(counts);
        
        // Show message if no requests were found
        if (fetchedRequests.length === 0) {
          console.log('No requests found for this faculty member');
        }
      } else {
        console.error('Unexpected response format:', response.data);
        setError('Received unexpected data format from server');
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching requests:', err);
      console.error('Error details:', err.response?.data || err.message);
      
      // Improved error handling with specific error messages
      if (err.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setTimeout(() => navigate('/login'), 2000);
      } else if (err.response?.status === 403) {
        setError('You do not have permission to access this page.');
      } else if (!err.response) {
        setError('Network error. Please check your internet connection and verify the server is running.');
      } else {
        setError(`Failed to fetch your requests: ${err.response?.data?.message || err.message}`);
      }
      
      setLoading(false);
    }
  };
  
  // Filter requests based on active tab
  const filteredRequests = requests.filter(request => {
    if (activeTab === 'all') return true;
    return request.status === activeTab;
  });
  
  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending': return 'status-badge status-pending';
      case 'approved': return 'status-badge status-approved';
      case 'rejected': return 'status-badge status-rejected';
      default: return 'status-badge';
    }
  };
  
  // Add a retry method
  const retryFetch = () => {
    setError('');
    setLoading(true);
    fetchRequests();
  };
  
  // Add a method to create a new request
  const goToCreateRequest = () => {
    navigate('/apply');
  };
  
  if (loading) {
    return (
      <div className="faculty-requests-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your requests...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="faculty-requests-container">
      <div className="faculty-requests-header">
        <h1 className="faculty-requests-title">My Gate Pass Requests</h1>
        
        {error && (
          <div className="error-message">
            {error}
            <button onClick={() => setError('')} className="close-btn">×</button>
          </div>
        )}
        
        <div className="view-toggle">
          <button 
            className={`view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
            onClick={() => setViewMode('table')}
          >
            <span className="icon">📋</span> Table View
          </button>
          <button 
            className={`view-toggle-btn ${viewMode === 'cards' ? 'active' : ''}`}
            onClick={() => setViewMode('cards')}
          >
            <span className="icon">🃏</span> Card View
          </button>
        </div>
      </div>
      
      <div className="tabs-container">
        <ul className="tabs">
          <li 
            className={`tab-item ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All ({requestCounts.total})
          </li>
          <li 
            className={`tab-item ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            Pending ({requestCounts.pending})
          </li>
          <li 
            className={`tab-item ${activeTab === 'approved' ? 'active' : ''}`}
            onClick={() => setActiveTab('approved')}
          >
            Approved ({requestCounts.approved})
          </li>
          <li 
            className={`tab-item ${activeTab === 'rejected' ? 'active' : ''}`}
            onClick={() => setActiveTab('rejected')}
          >
            Rejected ({requestCounts.rejected})
          </li>
        </ul>
      </div>
      
      <div className="content-container">
        {filteredRequests.length === 0 ? (
          <div className="no-requests">
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              {activeTab === 'all' ? (
                <>
                  <h3>You haven't made any gate pass requests yet</h3>
                  <p>To create a new gate pass request, click the button below.</p>
                </>
              ) : (
                <>
                  <h3>No {activeTab} requests found</h3>
                  <p>You don't have any {activeTab} gate pass requests.</p>
                </>
              )}
              <div className="empty-state-actions">
                {activeTab !== 'all' && (
                  <button 
                    onClick={() => setActiveTab('all')}
                    className="view-all-btn"
                  >
                    View All Requests
                  </button>
                )}
                <button 
                  onClick={retryFetch}
                  className="retry-btn"
                >
                  Refresh Data
                </button>
                <button 
                  onClick={goToCreateRequest}
                  className="create-request-btn"
                >
                  Submit New Request
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Table View */}
            {viewMode === 'table' && (
              <div className="requests-table-container">
                <table className="requests-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Purpose</th>
                      <th>Reason</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequests.map((request) => (
                      <tr key={request._id} className={`request-row status-${request.status}-row`}>
                        <td>{request.date}</td>
                        <td>
                          <div>Out: {request.timeOut}</div>
                          <div>In: {request.timeIn}</div>
                        </td>
                        <td>
                          <span className={`purpose-badge purpose-${request.purpose.toLowerCase()}`}>
                            {request.purpose}
                          </span>
                        </td>
                        <td>{request.reason}</td>
                        <td>
                          <span className={getStatusBadgeClass(request.status)}>
                            {request.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Card View */}
            {viewMode === 'cards' && (
              <div className="request-cards">
                {filteredRequests.map((request) => (
                  <div key={request._id} className={`request-card status-${request.status}-card`}>
                    <div className="request-card-header">
                      <h3 className="request-card-title">Gate Pass Request</h3>
                      <span className={getStatusBadgeClass(request.status)}>
                        {request.status}
                      </span>
                    </div>
                    
                    <div className="request-card-body">
                      <div className="info-group">
                        <div className="request-info-item">
                          <span className="info-label">Date</span>
                          <span className="info-value">{request.date}</span>
                        </div>
                        
                        <div className="request-info-item">
                          <span className="info-label">Time Out</span>
                          <span className="info-value">{request.timeOut}</span>
                        </div>
                        
                        <div className="request-info-item">
                          <span className="info-label">Time In</span>
                          <span className="info-value">{request.timeIn}</span>
                        </div>
                      </div>
                      
                      <div className="request-info-item">
                        <span className="info-label">Purpose</span>
                        <span className={`purpose-badge purpose-${request.purpose.toLowerCase()}`}>
                          {request.purpose}
                        </span>
                      </div>
                      
                      <div className="request-info-item">
                        <span className="info-label">Reason</span>
                        <span className="info-value reason-text">{request.reason}</span>
                      </div>
                      
                      <div className="request-info-item request-id-item">
                        <span className="info-label">Request ID</span>
                        <span className="info-value request-id">{request._id}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default FacultyRequests; 