import React, { useContext, useState } from 'react';
import {
    View, Text, TextInput, Alert, StyleSheet,
    Image, TouchableOpacity, KeyboardAvoidingView, Platform, Modal
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { AppContext } from '../../AppContext';
import axios from 'axios';

const LoginPage = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { setUser, setIsLoggedIn, apiUrl } = useContext(AppContext);
    const [isModalVisible, setIsModalVisible] = useState(false); // State for modal visibility

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
            await AsyncStorage.setItem('userProfile', JSON.stringify(data));
            setUser(data);
            setIsLoggedIn(true);

            // Show the modal for 3 seconds
            setIsModalVisible(true);
            setTimeout(() => {
                setIsModalVisible(false); // Hide the modal after 3 seconds
                navigation.replace('Home'); // Navigate to Home page
            }, 3000);
        })
            .catch((error) => {
                const errors = error.response?.data?.errors;
                if (errors) {
                    const firstError = errors.non_field_error ? errors.non_field_error[0] : 'An unknown error occurred.';
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

            {/* Modal for showing the note */}
            <Modal
                visible={isModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setIsModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalBox}>
                        <Text style={styles.modalText}>
                            “Allow LetsCalm to listen and create a temporary recording which can be stored and/or deleted based on your preferred setting after emotion is detected using our proprietary algorithm.”
                        </Text>
                    </View>
                </View>
            </Modal>

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

    // Modal styles
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)', // Dark transparent background
    },
    // Modal Box (content)
    modalBox: {
        width: '85%',
        backgroundColor: '#ffffff',
        borderRadius: 15,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5, // For Android shadow
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Modal Text
    modalText: {
        fontSize: 16,
        color: '#333',
        textAlign: 'center',
        lineHeight: 24,
        fontWeight: '500', // Medium weight for readability
    },
});

export default LoginPage;
