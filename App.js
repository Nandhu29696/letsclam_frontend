import React, { useContext } from 'react';
import { Platform } from "react-native";
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AppProvider, AppContext } from './AppContext';
import SplashScreen from './components/SplashScreen';
import LoginPage from './components/auth/LoginPage';
import RegisterPage from './components/auth/RegisterPage';
import HomeScreen from './components/home/Home';
import MainLayout from './components/MainLayout';
import AboutScreen from './components/about/About';
import OnboardingScreen from './components/onboarding/OnboardingScreen';
import AudioUpload from './components/profile/audioUpload/AudioUpload';
import VideoUpload from './components/profile/audioUpload/VideoUpload';
import VideoScreen from './components/home/VideoScreen';
import ProfileScreen from './components/profile/ProfileScreen';
import HistoryScreen from './components/profile/HistoryScreen';
import NewFeatures from './components/features/NewFeatures';
import TermsConditions from './components/profile/TermsConditions';
import PrivacyPolicy from './components/profile/audioUpload/PrivacyPolicy';
import ShareAppScreen from './components/features/ShareAppScreen';
import ContactUsScreen from './components/features/ContactUsScreen';
import Toast from 'react-native-toast-message';

const Stack = createStackNavigator();

if (Platform.OS === "android") {
  // Ignore SSL in dev only
  global.XMLHttpRequest = global.originalXMLHttpRequest || global.XMLHttpRequest;
  global.FormData = global.originalFormData || global.FormData;
}

// ✅ App Navigator decides which screens to show
const AppNavigator = () => {
  const { isLoggedIn, loading } = useContext(AppContext);

  if (loading) {
    return <SplashScreen />;
  }

  return (
    <Stack.Navigator initialRouteName="Splash"
      screenOptions={{
        headerStyle: { backgroundColor: "#e5194a" },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "bold" },
      }}
    >
      <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false }} />
      {isLoggedIn ? (
        <>
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
          <Stack.Screen name="My Profile" component={ProfileScreen} />
          <Stack.Screen name="History" component={HistoryScreen} />
          <Stack.Screen name="New Features" component={NewFeatures} />
          <Stack.Screen name="Terms & Conditions" component={TermsConditions} />
          <Stack.Screen name="Privacy Policy" component={PrivacyPolicy} />
          <Stack.Screen name="Share the app" component={ShareAppScreen} />
          <Stack.Screen name="Contact Us" component={ContactUsScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginPage} options={{ headerShown: false }} />
          <Stack.Screen name="Register" component={RegisterPage} options={{ headerShown: false }} />
        </>
      )}
    </Stack.Navigator>
  );
};

const App = () => {
  return (
    <AppProvider>
      <NavigationContainer>
        <AppNavigator />
        <Toast />
      </NavigationContainer>
    </AppProvider>
  );
};

export default App;
