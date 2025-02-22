import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import comingimg from '../../assets/comingsoon.png'

const NewFeatures = () => {
    const navigation = useNavigation();

    return (
        <View style={styles.container}>
            
            {/* "Coming Soon" Image */}
            <Image
                source={comingimg} // Replace with actual image URL
                style={styles.banner}
                resizeMode="contain"
            />

            {/* Feature Description */}
            <Text style={styles.description}>
                We are aware that LetsCalm may occasionally detect and react to peaks of emotions other than aggression.
            </Text>
            <Text style={styles.description}>
                Our team is working on making the application more sensitive to detecting aggression in the next version.
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingTop: 50,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    banner: {
        width: '100%',
        height: 120,
        alignSelf: 'center',
    },
    description: {
        fontSize: 16,
        textAlign: 'center',
        color: '#333',
        marginTop: 15,
        paddingHorizontal: 10,
    },
});

export default NewFeatures;
