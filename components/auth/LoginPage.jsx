import React, { useContext, useState } from 'react';
import {
    View, Text, TextInput, Alert, StyleSheet,
    Image, TouchableOpacity, KeyboardAvoidingView, Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { AppContext } from '../../AppContext';
import axios from 'axios';

const LoginPage = ({ navigation }) => {

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { setUser, setIsLoggedIn, apiUrl } = useContext(AppContext);

    const handleLoginPage = async (event) => {
        event.preventDefault();
        let loginData = {
            email: email,
            password: password,
        };
        await axios.post(`${apiUrl}/api/user/login`, loginData, {
            headers: {
                'Content-Type': 'application/json',
            },
        }).then(async (res) => {
            const data = res.data;
            Toast.show({ text1: 'Login Successful', text2: 'Welcome back!', type: 'success' });
            await AsyncStorage.setItem('userProfile', JSON.stringify(data));
            setUser(data);
            setIsLoggedIn(true);
            navigation.replace('Home');
        })
            .catch((error) => {
                const errors = error.response?.data?.errors;
                if (errors) {
                    const firstError = errors.non_field_error ? errors.non_field_error[0] : 'An unknown error occurred.';
                    Toast.show({ text1: 'Login Failed', text2: firstError, type: 'error' });
                } else {
                    Toast.show({ text1: 'Error', text2: 'Failed to Login. Please check your network connection.', type: 'error' });
                }
            });
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
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

            <TouchableOpacity style={styles.button} onPress={handleLoginPage}>
                <Text style={styles.buttonText}>Login</Text>
            </TouchableOpacity>

            <View style={styles.footer}>
                <Text>Don't have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                    <Text style={styles.linkText}>Register here</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
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
        backgroundColor: '#007bff',
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
        color: '#007bff',
        fontWeight: 'bold',
    },
});

export default LoginPage;
