import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();
  const [isLoginMode, setIsLoginMode] = useState(true);
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Load remembered user
  useEffect(() => {
    const savedName = localStorage.getItem('rememberedUser');
    if (savedName) {
      setUsername(savedName);
    }
  }, []);

  const clearMessage = () => setMessage({ type: '', text: '' });

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setUsername('');
    setPassword('');
    clearMessage();
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    clearMessage();

    const trimmedUser = username.trim();
    if (!trimmedUser || !password) {
      setMessage({ type: 'error', text: 'Please fill in all fields.' });
      return;
    }

    setLoading(true);

    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', trimmedUser));
      const snapshot = await getDocs(q);

      if (isLoginMode) {
        // --- LOGIN LOGIC ---
        let validUser = null;
        if (!snapshot.empty) {
          const userDoc = snapshot.docs[0].data();
          if (userDoc.password === password) {
            validUser = userDoc;
          }
        }

        // Hardcoded admin or matching user
        if ((trimmedUser.toLowerCase() === 'admin' && password === 'password') || validUser) {
          const detectedUser = validUser ? validUser.username : 'admin';
          localStorage.setItem('rememberedUser', detectedUser);
          localStorage.setItem('loggedInUser', detectedUser.toLowerCase());
          
          setMessage({ type: 'success', text: 'Login successful! Redirecting...' });
          
          setTimeout(() => {
            if (detectedUser.toLowerCase() === 'admin') {
              navigate('/admin');
            } else {
              navigate('/shop');
            }
          }, 500);
        } else {
          setMessage({ type: 'error', text: 'Invalid username or password.' });
        }
      } else {
        // --- SIGNUP LOGIC ---
        if (!snapshot.empty) {
          setMessage({ type: 'error', text: 'Username already exists!' });
        } else {
          await addDoc(usersRef, { username: trimmedUser, password });
          setMessage({ type: 'success', text: 'Account created! Redirecting to login...' });
          
          setTimeout(() => {
            setIsLoginMode(true);
            setPassword('');
          }, 1000);
        }
      }
    } catch (error) {
      console.error("Auth Error:", error);
      setMessage({ type: 'error', text: error.message || 'Database connection error.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-wrapper">
      <div className="login-container">
        
        <div className="header">
          <h1>{isLoginMode ? 'Welcome Back' : 'Create Account'}</h1>
          <p>{isLoginMode ? 'Please enter your details to sign in.' : 'Register to get started.'}</p>
        </div>

        <form onSubmit={handleAuth}>
          <div className="form-group">
            <label>Username</label>
            <div className="input-wrapper">
              <i className="fas fa-user icon"></i>
              <input 
                type="text" 
                placeholder={isLoginMode ? "Enter username" : "Choose a username"}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="off"
                required 
              />
            </div>
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="input-wrapper">
              <i className="fas fa-lock icon"></i>
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder={isLoginMode ? "Enter password" : "Choose a password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
              <i 
                className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'} toggle-password`}
                onClick={() => setShowPassword(!showPassword)}
              ></i>
            </div>
          </div>

          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                <span>{isLoginMode ? 'Authenticating...' : 'Signing Up...'}</span>
              </>
            ) : (
              <>
                <span>{isLoginMode ? 'Sign In' : 'Sign Up'}</span>
                <i className={`fas ${isLoginMode ? 'fa-arrow-right' : 'fa-user-plus'}`}></i>
              </>
            )}
          </button>

          {message.text && (
            <div className={`message ${message.type}`}>
              {message.text}
            </div>
          )}
          
          <p className="toggle-text">
            {isLoginMode ? "Don't have an account? " : "Already have an account? "}
            <span onClick={toggleMode}>
              {isLoginMode ? "Sign up" : "Log in"}
            </span>
          </p>
        </form>

      </div>
    </div>
  );
}
