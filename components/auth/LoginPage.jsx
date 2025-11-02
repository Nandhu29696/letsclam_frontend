import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Image,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast, { BaseToast, ErrorToast } from 'react-native-toast-message';
import { AppContext } from '../../AppContext';
import axios from 'axios';

// ✅ Unified Toast UI with RegisterPage
const toastConfig = {
  success: (props) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: '#22c55e' }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{ fontSize: 15, fontWeight: '600' }}
      text2Style={{ fontSize: 13 }}
    />
  ),
  error: (props) => (
    <ErrorToast
      {...props}
      style={{ borderLeftColor: '#ef4444' }}
      text1Style={{ fontSize: 15, fontWeight: '600' }}
      text2Style={{ fontSize: 13 }}
    />
  ),
};

const LoginPage = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, apiUrl } = useContext(AppContext);

  const [isOtpModalVisible, setIsOtpModalVisible] = useState(false);
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Step 1: Handle login (send OTP)
  const handleLogin = async () => {
    if (!email || !password) {
      Toast.show({
        type: 'error',
        text1: 'Missing Credentials',
        text2: 'Please enter your email and password.',
        position: 'top',
      });
      return;
    }

    setIsLoading(true);
    try {
      await axios.post(`${apiUrl}/api/user/login`, { email, password }, {
        headers: { 'Content-Type': 'application/json' },
      });

      Toast.show({
        type: 'success',
        text1: 'OTP Sent!',
        text2: 'Please check your email for the OTP.',
        position: 'top',
      });

      setIsOtpModalVisible(true);
    } catch (error) {
      const message = error.response?.data?.detail || 'Login failed. Please try again.';
      Toast.show({
        type: 'error',
        text1: 'Login Failed',
        text2: message,
        position: 'top',
      });
      console.log('Login error:', error.response?.data || error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP and get tokens
  const handleVerifyOtp = async () => {
    if (!otp) {
      Toast.show({
        type: 'error',
        text1: 'Missing OTP',
        text2: 'Please enter the OTP sent to your email.',
        position: 'top',
      });
      return;
    }

    setIsLoading(true);
    try {
      const res = await axios.post(`${apiUrl}/api/user/login/verify-otp/`, {
        email,
        otp,
        purpose: 'login',
      });

      const { access, refresh, user } = res.data;

      await AsyncStorage.setItem('accessToken', access);
      await AsyncStorage.setItem('refreshToken', refresh);
      await AsyncStorage.setItem('user', JSON.stringify(user));

      Toast.show({
        type: 'success',
        text1: 'Login Successful!',
        position: 'top',
      });

      setIsOtpModalVisible(false);
      await login(user, access);

      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    } catch (error) {
      const message = error.response?.data?.detail || 'Invalid OTP. Please try again.';
      Toast.show({
        type: 'error',
        text1: 'OTP Verification Failed',
        text2: message,
        position: 'top',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Image
          source={require('../../assets/splashimage.jpg')}
          style={styles.logo}
        />
        <Text style={styles.title}>Welcome Back</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={isLoading}>
          <Text style={styles.buttonText}>
            {isLoading ? 'Please wait...' : 'Login'}
          </Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.linkText}>Register here</Text>
          </TouchableOpacity>
        </View>

        {/* ✅ Toast inside component */}
        <Toast config={toastConfig} />
      </KeyboardAvoidingView>

      {/* ✅ OTP Modal outside KeyboardAvoidingView */}
      <Modal
        visible={isOtpModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsOtpModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Enter OTP</Text>

            <TextInput
              style={styles.input}
              placeholder="Enter OTP"
              keyboardType="numeric"
              value={otp}
              onChangeText={setOtp}
            />

            <TouchableOpacity
              style={styles.button}
              onPress={handleVerifyOtp}
              disabled={isLoading}>
              <Text style={styles.buttonText}>
                {isLoading ? 'Verifying...' : 'Verify OTP'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setIsOtpModalVisible(false)}>
              <Text style={styles.linkText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#029fe4',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    marginTop: 15,
  },
  linkText: {
    color: '#029fe4',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalBox: {
    width: '85%',
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
});

export default LoginPage;
