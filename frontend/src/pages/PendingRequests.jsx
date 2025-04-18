import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './PendingRequests.css';

const PendingRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('pending');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    if (user.role !== 'admin') {
      navigate('/');
      return;
    }

    const fetchRequests = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/admin/pending-requests', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setRequests(response.data);
      } catch (err) {
        console.error('Error fetching requests:', err);
        setError(err.response?.data?.message || 'Failed to fetch requests');
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [user, navigate]);

  const handleUpdateStatus = async (requestId, status) => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/admin/update-request', 
      { 
        requestId, 
        status 
      }, 
      {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (status === 'approved') {
        setRequests(requests.map(request => 
          request._id === requestId ? { ...request, status: 'approved' } : request
        ));
      } else {
        // If rejected, remove from the list
        setRequests(requests.filter(request => request._id !== requestId));
      }
    } catch (err) {
      console.error(`Error ${status} request:`, err);
      setError(err.response?.data?.message || `Failed to ${status} request`);
    } finally {
      setActionLoading(false);
    }
  };

  // Filter requests based on status
  const filteredRequests = requests.filter(request => 
    statusFilter === 'all' ? true : request.status === statusFilter
  );

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading requests...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="pending-requests-container">
        <div className="no-requests">
          <div className="no-requests-icon">⚠️</div>
          <div className="no-requests-message">Authentication Required</div>
          <p className="no-requests-suggestion">Please login to view pending requests.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pending-requests-container">
      <div className="requests-header">
        <h2 className="requests-title">
          Pending Gate Pass Requests
          {filteredRequests.length > 0 && (
            <span className="requests-count">{filteredRequests.length}</span>
          )}
        </h2>
        <div className="department-info">
          Department: <span className="department-name">{user.department}</span>
          <p className="department-note">You are viewing requests from faculty in your department only.</p>
        </div>
      </div>
      
      {error && (
        <div className="alert alert-danger" role="alert">
          <span>{error}</span>
          <button 
            onClick={() => setError('')}
            className="ml-auto"
          >
            &times;
          </button>
        </div>
      )}
      
      <div className="requests-filter">
        <span className="filter-label">Filter by status:</span>
        <select 
          className="filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>
      
      <div className="requests-table-container">
        <table className="requests-table">
          <thead>
            <tr>
              <th>Faculty</th>
              <th>Date</th>
              <th>Time</th>
              <th>Purpose</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRequests.length > 0 ? (
              filteredRequests.map((request) => (
                <tr key={request._id} className="request-row">
                  <td data-label="Faculty">
                    <div className="faculty-name">{request.facultyEmail.split('@')[0]}</div>
                    <div className="faculty-email">{request.facultyEmail}</div>
                  </td>
                  <td data-label="Date" className="request-date">
                    {request.date}
                  </td>
                  <td data-label="Time">
                    <div className="request-time">Out: {request.timeOut}</div>
                    <div className="request-time">In: {request.timeIn}</div>
                  </td>
                  <td data-label="Purpose">
                    <span className={`request-purpose purpose-${request.purpose.toLowerCase()}`}>
                      {request.purpose}
                    </span>
                  </td>
                  <td data-label="Reason">
                    {request.reason}
                  </td>
                  <td data-label="Status">
                    <span className={`request-status status-${request.status}`}>
                      {request.status}
                    </span>
                  </td>
                  <td data-label="Actions" className="actions-cell">
                    {request.status === 'pending' && (
                      <div className="action-buttons">
                        <button
                          onClick={() => handleUpdateStatus(request._id, 'approved')}
                          disabled={actionLoading}
                          className="approve-btn"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(request._id, 'rejected')}
                          disabled={actionLoading}
                          className="reject-btn"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="text-center">
                  <div className="no-requests">
                    <div className="no-requests-icon">📝</div>
                    <div className="no-requests-message">No requests found</div>
                    <p className="no-requests-suggestion">There are no gate pass requests from your department matching your filter criteria.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PendingRequests; 