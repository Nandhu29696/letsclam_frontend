// AppContext.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useState, useEffect } from 'react';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);  // Store user data here
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const apiUrl = 'http://ec2-98-83-213-50.compute-1.amazonaws.com:8080';
  // const apiUrl = 'http://192.168.0.137:8080';

  // Simulate loading user data after login
  const loadUserData = async () => {
    try {
      const savedUser = await AsyncStorage.getItem('user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
        setIsLoggedIn(true);
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };

  useEffect(() => {
    loadUserData();
  }, []);

  return (
    <AppContext.Provider value={{ user, setUser, isLoggedIn, setIsLoggedIn, apiUrl }}>
      {children}
    </AppContext.Provider>
  );
};
