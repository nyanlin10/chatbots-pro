
import React, { useState, useEffect } from 'react';
import { ViewState, AppData } from './types';
import { getAppData, saveAppData } from './services/storage';
import ChatInterface from './components/ChatInterface';
import LoginScreen from './components/LoginScreen';
import AdminPanel from './components/AdminPanel';

const App: React.FC = () => {
  const [appData, setAppData] = useState<AppData>(getAppData());
  // Initialize view based on login state (optional: could default to admin if logged in, but chat is safer for end users)
  const [view, setView] = useState<ViewState>('chat');

  useEffect(() => {
    // Sync state updates to local storage
    saveAppData(appData);
  }, [appData]);

  // Supports both object and functional updates for safety
  const handleUpdateData = (newData: AppData | ((prev: AppData) => AppData)) => {
    setAppData(newData);
  };

  const handleAdminRequest = () => {
    if (appData.isAdminLoggedIn) {
      setView('admin');
    } else {
      setView('login');
    }
  };

  const handleLoginSuccess = () => {
    handleUpdateData(prev => ({ ...prev, isAdminLoggedIn: true }));
    setView('admin');
  };

  const handleLogout = () => {
    handleUpdateData(prev => ({ ...prev, isAdminLoggedIn: false }));
    setView('chat');
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-black text-white selection:bg-[#00FF00] selection:text-black">
      {view === 'chat' && (
        <ChatInterface 
          appData={appData} 
          onUpdateData={handleUpdateData}
          onAdminRequest={handleAdminRequest} 
        />
      )}
      
      {view === 'login' && (
        <LoginScreen 
          appData={appData} 
          onLoginSuccess={handleLoginSuccess} 
          onBack={() => setView('chat')} 
        />
      )}

      {view === 'admin' && (
        <AdminPanel 
          data={appData} 
          onUpdate={handleUpdateData} 
          onLogout={handleLogout}
          onViewChat={() => setView('chat')}
        />
      )}
    </div>
  );
};

export default App;
