import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const PrivacyPolicy = () => {
    const navigation = useNavigation();

    return (
        <View style={styles.container}>
           
            {/* Scrollable Privacy Content */}
            <ScrollView style={styles.content}>
                <Text style={styles.text}>
                    All materials, content, and intellectual property, including but not limited to software, graphics, logos, text, images, 
                    made available on LetsCalm Application are protected by copyright laws and owned by LetsCalm.com, LLC unless otherwise stated.
                </Text>

                <Text style={styles.sectionTitle}>Privacy statement:</Text>
                <Text style={styles.text}>
                    Copyright © 2023-2024 LetsCalm.com, LLC{'\n'}
                    All rights reserved
                </Text>
            </ScrollView>
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
    content: {
        flex: 1,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 20,
        marginBottom: 10,
    },
    text: {
        fontSize: 14,
        color: '#333',
        lineHeight: 20,
    },
});

export default PrivacyPolicy;
