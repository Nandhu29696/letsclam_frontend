import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share } from 'react-native';

const ShareAppScreen = () => {
    const shareApp = async () => {
        try {
            await Share.share({
                message: 'Check out the LetsCalm app! Download it now: https://example.com',
            });
        } catch (error) {
            console.error('Error sharing app:', error);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Share the App</Text>
            <Text style={styles.subHeader}>Really Liked it?</Text>
            <Text style={styles.text}>Do share it with your Friends & Family</Text>
            <TouchableOpacity style={styles.button} onPress={shareApp}>
                <Text style={styles.buttonText}>Share</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: 'white', alignItems: 'center' },
    header: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
    subHeader: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
    text: { fontSize: 14, textAlign: 'center', marginBottom: 20 },
    button: { backgroundColor: '#add8e6', padding: 10, borderRadius: 5, width: '80%', alignItems: 'center' },
    buttonText: { fontSize: 16, fontWeight: 'bold', color: 'black' },
});

export default ShareAppScreen;
