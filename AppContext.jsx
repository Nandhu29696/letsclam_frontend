import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useState, useEffect } from 'react';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userToken, setUserToken] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  // const apiUrl = "http://192.168.0.135:8000";
  const apiUrl = "https://www.jagoindia.in";

  const loadUserData = async () => {
    try {
      const savedUser = await AsyncStorage.getItem('user');
      const savedUserToken = await AsyncStorage.getItem('accessToken');

      if (savedUser && savedUserToken) {
        setUser(JSON.parse(savedUser));
        setUserToken(savedUserToken);
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserData();
  }, []);

  // ✅ Call this after login success
  const login = async (userData, token) => {
    try {
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      await AsyncStorage.setItem('accessToken', token);
      setUser(userData);
      setUserToken(token);
      setIsLoggedIn(true);
    } catch (error) {
      console.error('Failed to save login data:', error);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('accessToken');
      setUser(null);
      setUserToken(null);
      setIsLoggedIn(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        userToken,
        apiUrl,
        isLoggedIn,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
