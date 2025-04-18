import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [redirectAttempted, setRedirectAttempted] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, user, loading: authLoading } = useAuth();
  
  // Check if already logged in and redirect
  useEffect(() => {
    if (user && !redirectAttempted && !authLoading) {
      console.log('User is authenticated, preparing to redirect:', user);
      setRedirectAttempted(true);
      
      // Check for a redirect path from session storage or location state
      const redirectPath = 
        sessionStorage.getItem('redirectPath') || 
        (location.state?.from?.pathname || 
        (user.role === 'faculty' ? '/apply' : '/pending-requests'));
      
      // Clear the redirect path
      sessionStorage.removeItem('redirectPath');
      
      console.log('Redirecting to:', redirectPath);
      navigate(redirectPath, { replace: true });
    }
  }, [user, navigate, redirectAttempted, authLoading, location]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  async function handleSubmit(e) {
    e.preventDefault();
    
    try {
      setError('');
      setLoading(true);
      
      console.log('Attempting login with:', formData.email);
      const userData = await login(formData.email, formData.password);
      
      console.log('Login successful, user data:', userData);
      
      // Redirection will be handled by the useEffect above
      // Set some data to indicate a fresh login
      sessionStorage.setItem('freshLogin', 'true');
      
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  // Determine button state based on local form submission only
  const isButtonDisabled = loading;
  const buttonText = loading ? 'Signing in...' : 'Sign In';

  return (
    <div className="auth-container">
      <div className="college-header">
        <img src="/logo.jpg" alt="College Logo" className="college-logo-Auth" />
        <div className="college-info">
          <h2>Maratha Vidya Prasarak Samaj's</h2>
          <h1>Karmaveer Adv. Baburao Ganpatrao Thakare College of Engineering</h1>
          <p>Udoji Maratha Boarding Campus, Near Pumping Station, Gangapur Road, Nashik</p>
          <p className="university-affiliation">An Autonomous Institute Permanently affiliated to Savitribai Phule Pune University</p>
        </div>
        <div className="college-accreditation">
          <img src="/naac.png" alt="NAAC A+" className="accreditation-logo" />
        </div>
      </div>
      
      <div className="auth-content">
        <div className="auth-form-container">
          <h2 className="gate-pass-title">Gate Pass for Faculty</h2>
          
          <div className="sign-in-container">
            <h3>Sign In</h3>
            
            {error && <div className="auth-error">{error}</div>}
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="email">Email:</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="form-input"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="password">Password:</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="form-input"
                />
              </div>
              
              <button 
                type="submit" 
                disabled={isButtonDisabled} 
                className="sign-in-btn"
              >
                {buttonText}
              </button>
            </form>
            
            <div className="register-link">
              Don't have an account? <Link to="/register">Register</Link>
            </div>
          </div>
        </div>
        
        <div className="college-building">
          <img src="/college-building.jpg" alt="College Building" />
        </div>
      </div>
    </div>
  );
}

export default Login; 