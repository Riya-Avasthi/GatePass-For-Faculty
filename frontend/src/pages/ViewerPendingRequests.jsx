import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import './ViewerRequests.css';

const ViewerPendingRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in and has viewer role
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    
    console.log("Current role from localStorage:", role);
    
    if (!token) {
      console.log("No token found, redirecting to login");
      navigate('/login');
      return;
    }
    
    if (role !== 'viewer') {
      console.log(`Role is ${role}, not viewer, redirecting to dashboard`);
      navigate('/dashboard');
      return;
    }
    
    fetchPendingRequests();
  }, [navigate]);

  const fetchPendingRequests = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log("Fetching pending requests...");
      const token = localStorage.getItem('token');
      
      const response = await axios.get('http://localhost:5000/api/viewer/pending-requests', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log("Response received:", response.data);
      setRequests(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching pending requests:', err);
      setError(err.response?.data?.message || 'Failed to fetch pending requests');
      setLoading(false);
      toast.error("Failed to load pending requests. Please try again later.");
    }
  };

  const formatDate = (dateString) => {
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

  const handleMarkAsAllowed = async (requestId) => {
    try {
      console.log("Marking request as allowed:", requestId);
      const token = localStorage.getItem('token');
      
      await axios.put(`http://localhost:5000/api/viewer/mark-allowed/${requestId}`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Update the local state to reflect the change
      setRequests(requests.filter(request => request._id !== requestId));
      toast.success('Request marked as allowed successfully');
    } catch (err) {
      console.error('Error marking request as allowed:', err);
      toast.error(err.response?.data?.message || 'Failed to mark request as allowed');
    }
  };

  // Safer filtering to handle potential null/undefined values
  const filteredRequests = requests.filter(request => {
    if (!searchTerm) return true;
    
    const searchTermLower = searchTerm.toLowerCase();
    const faculty = request.facultyId || {};
    const facultyName = faculty.name || '';
    const facultyEmail = faculty.email || request.facultyEmail || '';
    const facultyId = faculty.employeeId || '';
    const purpose = request.purpose || '';
    const reason = request.reason || '';
    
    return (
      facultyName.toLowerCase().includes(searchTermLower) ||
      facultyEmail.toLowerCase().includes(searchTermLower) ||
      facultyId.toLowerCase().includes(searchTermLower) ||
      purpose.toLowerCase().includes(searchTermLower) ||
      reason.toLowerCase().includes(searchTermLower)
    );
  });

  return (
    <div className="viewer-requests-container">
      <div className="viewer-requests-header">
        <h1 className="viewer-requests-title">Pending Gate Pass Requests</h1>
        <p className="viewer-requests-subtitle">
          View and mark approved requests as allowed to leave
        </p>
      </div>

      <div className="actions-bar">
        <div className="search-container">
          <input
            type="text"
            className="search-input"
            placeholder="Search by name, email, ID, purpose..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              className="clear-search-btn"
              onClick={() => setSearchTerm('')}
            >
              ×
            </button>
          )}
        </div>
        <div className="buttons-container">
          <button
            className="refresh-btn"
            onClick={fetchPendingRequests}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          <button
            className="view-all-btn"
            onClick={() => navigate('/viewer/all-requests')}
          >
            View All Requests
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button className="close-btn" onClick={() => setError(null)}>
            ×
          </button>
        </div>
      )}

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading pending requests...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="no-requests">
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>No pending requests found</h3>
            <p>
              {searchTerm
                ? "No requests match your search criteria"
                : "All approved requests have been processed"}
            </p>
          </div>
        </div>
      ) : (
        <div className="requests-table-container">
          <table className="requests-table">
            <thead>
              <tr>
                <th>Faculty</th>
                <th>Request Details</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((request) => {
                // Get faculty info safely
                const faculty = request.facultyId || {};
                const facultyName = faculty.name || 'Unknown';
                const facultyEmail = faculty.email || request.facultyEmail || 'No email';
                const employeeId = faculty.employeeId || 'No ID';
                
                return (
                  <tr
                    key={request._id}
                    className={`request-row ${
                      request.status === "approved"
                        ? "status-approved-row"
                        : request.status === "rejected"
                        ? "status-rejected-row"
                        : "status-pending-row"
                    }`}
                  >
                    <td data-label="Faculty">
                      <div className="faculty-name">{facultyName}</div>
                      <div className="faculty-email">{facultyEmail}</div>
                      <div className="faculty-email">ID: {employeeId}</div>
                    </td>
                    <td data-label="Request Details">
                      <div className="request-time">
                        Requested on: {formatDate(request.createdAt)}
                      </div>
                      <div className="request-time">
                        From: {formatDate(request.fromDateTime || request.date + ' ' + request.timeOut)}
                      </div>
                      <div className="request-time">
                        To: {formatDate(request.toDateTime || request.date + ' ' + request.timeIn)}
                      </div>
                      <div
                        className={`purpose-badge purpose-${(request.purpose || '').toLowerCase()}`}
                      >
                        {request.purpose || 'Unknown'}
                      </div>
                      <div className="request-reason">{request.reason || 'No reason provided'}</div>
                    </td>
                    <td data-label="Status">
                      <div
                        className={`status-badge status-${(request.status || '').toLowerCase()}`}
                      >
                        {request.status 
                          ? request.status.charAt(0).toUpperCase() + request.status.slice(1)
                          : 'Unknown'}
                      </div>
                      {request.statusUpdatedAt && (
                        <div className="status-time">
                          Updated: {formatDate(request.statusUpdatedAt)}
                        </div>
                      )}
                    </td>
                    <td data-label="Action">
                      <button
                        onClick={() => handleMarkAsAllowed(request._id)}
                        className="allow-btn"
                        disabled={loading}
                      >
                        Mark as Allowed
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ViewerPendingRequests; 