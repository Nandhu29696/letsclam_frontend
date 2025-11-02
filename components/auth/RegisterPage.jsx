import React, { useContext, useState } from 'react';
import {
    View, Text, TextInput, StyleSheet,
    Image, TouchableOpacity, KeyboardAvoidingView, Platform
} from 'react-native';
import Toast, { BaseToast, ErrorToast } from 'react-native-toast-message';
import { AppContext } from '../../AppContext';
import axios from 'axios';

// ✅ Toast configuration
const toastConfig = {
    success: (props) => (
        <BaseToast
            {...props}
            style={{ borderLeftColor: '#22c55e' }}
            contentContainerStyle={{ paddingHorizontal: 15 }}
            text1Style={{ fontSize: 15, fontWeight: '600' }}
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

const RegisterPage = ({ navigation }) => {
    const [fullname, setFullname] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { apiUrl } = useContext(AppContext);

    const handleRegister = async () => {
        if (!fullname || !email || !password) {
            Toast.show({
                type: 'error',
                text1: 'Missing Fields',
                text2: 'Please enter your name, email, and password.',
                position: 'top',
            });
            return;
        }

        try {
            const payload = {
                name: fullname,
                email,
                password,
                password2: password,
                tc: false,
            };

            const res = await axios.post(`${apiUrl}/api/user/register/`, payload, {
                headers: { 'Content-Type': 'application/json' },
            });

            Toast.show({
                type: 'success',
                text1: res.data.message || 'Registration Successful',
                position: 'top',
                visibilityTime: 3000,
            });

            navigation.navigate('Login');
        } catch (error) {
            const errors = error.response?.data;
            if (errors && typeof errors === 'object') {
                const firstErrorKey = Object.keys(errors)[0];
                const firstErrorMsg = Array.isArray(errors[firstErrorKey])
                    ? errors[firstErrorKey][0]
                    : errors[firstErrorKey];

                Toast.show({
                    type: 'error',
                    text1: 'Registration Failed',
                    text2: firstErrorMsg || 'Something went wrong.',
                    position: 'top',
                    visibilityTime: 4000,
                });
            } else {
                Toast.show({
                    type: 'error',
                    text1: 'Registration Failed',
                    text2: 'Please check your internet or try again later.',
                    position: 'top',
                    visibilityTime: 4000,
                });
            }
        }
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
            <Text style={styles.title}>Create an Account</Text>

            <TextInput
                style={styles.input}
                placeholder="Full Name"
                value={fullname}
                onChangeText={setFullname}
            />
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

            <TouchableOpacity style={styles.button} onPress={handleRegister}>
                <Text style={styles.buttonText}>Register</Text>
            </TouchableOpacity>

            <View style={styles.footer}>
                <Text>Already have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                    <Text style={styles.linkText}>Login</Text>
                </TouchableOpacity>
            </View>

            {/* ✅ Toast container must be rendered inside component tree */}
            <Toast config={toastConfig} />
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
});

export default RegisterPage;
