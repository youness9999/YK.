import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';

// Pages
import Login from './pages/Login';
import Shop from './pages/Shop';
import Profile from './pages/Profile';
import Admin from './pages/Admin';

function App() {
  useEffect(() => {
    if (localStorage.getItem('theme') === 'light') {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
  }, []);

  return (
    <Router>
      <Routes>
        {/* Default route goes to Login */}
        <Route path="/" element={<Login />} />
        
        {/* App Routes */}
        <Route path="/shop" element={<Shop />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/admin" element={<Admin />} />
        
        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
