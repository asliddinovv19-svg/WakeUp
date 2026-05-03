import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguageState] = useState(localStorage.getItem('lang') || 'uz');

  useEffect(() => {
    const token = localStorage.getItem('wakeup_token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchMe();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchMe = async () => {
    try {
      const { data } = await axios.get(`${API}/user/me`);
      setUser(data.user);
      if (data.user.language) {
        setLanguageState(data.user.language);
      }
    } catch (err) {
      localStorage.removeItem('wakeup_token');
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const login = async (identifier, password) => {
    const { data } = await axios.post(`${API}/auth/login`, { identifier, password });
    localStorage.setItem('wakeup_token', data.token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    setUser(data.user);
    if (data.user.language) setLanguageState(data.user.language);
    return data;
  };

  const register = async (username, email, password) => {
    const { data } = await axios.post(`${API}/auth/register`, { username, email, password });
    return data;
  };

  const verify = async (userId, code) => {
    const { data } = await axios.post(`${API}/auth/verify`, { userId, code });
    localStorage.setItem('wakeup_token', data.token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('wakeup_token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const setLanguage = async (lang) => {
    setLanguageState(lang);
    localStorage.setItem('lang', lang);
    if (user) {
      try {
        await axios.put(`${API}/user/profile`, { language: lang });
        setUser(prev => ({ ...prev, language: lang }));
      } catch (e) {}
    }
  };

  const updateUser = (updates) => {
    setUser(prev => ({ ...prev, ...updates }));
  };

  return (
    <AuthContext.Provider value={{ 
      user, loading, login, register, verify, logout, 
      language, setLanguage, updateUser, fetchMe, API 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
