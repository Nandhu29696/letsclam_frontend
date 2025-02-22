import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Image } from 'react-native';

const ContactUsScreen = () => {
    const email = 'letscalmcontact@gmail.com';

    return (
        <View style={styles.container}>
            <Image source={require('../../assets/contactus.jpg')} style={styles.image} />
            <Text style={styles.text}>If you would like to contact us, click on the link below:</Text>
            <TouchableOpacity onPress={() => Linking.openURL(`mailto:${email}`)} style={styles.button}>
                <Text style={styles.buttonText}>{email}</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: 'white', alignItems: 'center' },
    header: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
    image: { width: '100%', height: 100, resizeMode: 'contain', marginBottom: 20 },
    text: { fontSize: 14, textAlign: 'center', marginBottom: 10 },
    button: { backgroundColor: '#add8e6', padding: 10, borderRadius: 5, width: '80%', alignItems: 'center' },
    buttonText: { fontSize: 16, fontWeight: 'bold', color: 'black' },
});

export default ContactUsScreen;
