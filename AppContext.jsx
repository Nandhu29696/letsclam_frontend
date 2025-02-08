// AppContext.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

// Store the API URL securely
// SecureStore.setItemAsync('API_URL', 'http://ec2-54-159-231-95.compute-1.amazonaws.com:8000');
SecureStore.setItemAsync('API_URL', 'http://192.168.0.135:8000');

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);  // Store user data here
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [apiUrl, setAPI] = useState('')

  async function getApiUrl() {
    const apiget = await SecureStore.getItemAsync('API_URL');
    console.log('apiget', apiget);

    setAPI(apiget);
  }



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
    getApiUrl();
  }, []);

  return (
    <AppContext.Provider value={{ user, setUser, isLoggedIn, setIsLoggedIn, apiUrl }}>
      {children}
    </AppContext.Provider>
  );
};
