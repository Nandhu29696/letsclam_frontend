import React, { useContext, useState } from 'react';
import {
    View, Text, TextInput, Button, Alert, StyleSheet,
    Image, TouchableOpacity, KeyboardAvoidingView, Platform
} from 'react-native';
import Toast from 'react-native-toast-message';
import { AppContext } from '../../AppContext';
import axios from 'axios';

const RegisterPage = ({ navigation }) => {
    const [fullname, setFullname] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { apiUrl } = useContext(AppContext);

    const handleRegister = async (event) => {
        event.preventDefault();
        let payload = {
            name: fullname,
            email: email,
            password: password,
            password2: password,
            tc: false
        };
        await axios.post(`${apiUrl}/api/user/register`, payload, {
            headers: {
                'Content-Type': 'application/json',
            },
        }).then((res) => {
            const data = res.data;
            Toast.show({
                text1: data.message || 'Registration Successful',
                type: 'success',
            });
            navigation.navigate('Login');
        }).catch((error) => {
            const errors = error.response?.data?.error;
            if (errors) {
                const firstError = Object.values(errors)[0][0];
                Toast.show({ text1: 'Registration Failed', text2: firstError, type: 'error', });
            } else {
                Toast.show({ text1: 'Registration Failed', text2: 'Failed to Register. Please check your network connection.', type: 'error', });
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
                style={styles.logo} />
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

export default RegisterPage;
