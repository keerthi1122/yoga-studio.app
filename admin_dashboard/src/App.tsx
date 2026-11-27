import React, { useState, useCallback } from 'react';
import { BrowserRouter, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppRoutes } from './routes/AppRoutes';
import { SplashScreen } from './components/SplashScreen';

const AppContent: React.FC = () => {
  const location = useLocation();
  const isPublicLanding =
    location.pathname === '/' ||
    location.pathname === '/membership' ||
    location.pathname === '/plans' ||
    location.pathname === '/schedule';

  const [showSplash, setShowSplash] = useState(() => {
    const seen = sessionStorage.getItem('gvya_splash_seen');
    return !seen && isPublicLanding;
  });

  const handleSplashFinish = useCallback(() => {
    setShowSplash(false);
    sessionStorage.setItem('gvya_splash_seen', '1');
  }, []);

  return (
    <>
      {showSplash && isPublicLanding && <SplashScreen onFinish={handleSplashFinish} />}
      <AppRoutes />
    </>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
