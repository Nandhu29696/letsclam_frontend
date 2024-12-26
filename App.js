
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import { AppProvider } from './AppContext';
import AboutScreen from './components/about/About';
import LoginPage from './components/auth/LoginPage';
import RegisterPage from './components/auth/RegisterPage';
import HomeScreen from './components/home/Home';
import MainLayout from './components/MainLayout';
import OnboardingScreen from './components/onboarding/OnboardingScreen';
import AudioUpload from './components/profile/audioUpload/AudioUpload';
import SplashScreen from './components/SplashScreen';
import Toast from 'react-native-toast-message';
import VideoUpload from './components/profile/audioUpload/VideoUpload'; 
import VideoScreen from './components/home/VideoScreen';

const Stack = createStackNavigator();

const App = () => {  

  return (
    <AppProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Splash">
          <Stack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Login" component={LoginPage} options={{ headerShown: false }} />
          <Stack.Screen name="Register" component={RegisterPage} options={{ headerShown: false }} />
          <Stack.Screen name="Home" options={{ headerShown: false }}>
            {({ navigation }) => (
              <MainLayout navigation={navigation}>
                <HomeScreen />
              </MainLayout>
            )}
          </Stack.Screen>
          <Stack.Screen name="About" options={{ headerShown: false }}>
            {({ navigation }) => (
              <MainLayout navigation={navigation}>
                <AboutScreen />
              </MainLayout>
            )}
          </Stack.Screen>
          <Stack.Screen name="AudioUpload" component={AudioUpload} />
          <Stack.Screen name="VideoUpload" component={VideoUpload} />
          <Stack.Screen name="VideoScreen" component={VideoScreen} />
        </Stack.Navigator>
        <Toast/>
      </NavigationContainer>
    </AppProvider>
  );
};

export default App;
