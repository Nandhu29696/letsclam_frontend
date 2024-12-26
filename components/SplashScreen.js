
import React, { useContext, useEffect } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppContext } from '../AppContext';

const SplashScreen = ({ navigation }) => {
  const { isLoggedIn } = useContext(AppContext);

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        if (isLoggedIn) {
          navigation.replace('Home');
        } else {
          navigation.replace('Onboarding');
        }
      } catch (error) {
        console.error('Error checking login status:', error);
        navigation.replace('Onboarding');
      }
    };

    const timer = setTimeout(checkLoginStatus, 3000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/splashimage.jpg')}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  logo: {
    width: 250,
    height: 250,
    marginBottom: 20,
  },
});

export default SplashScreen;
