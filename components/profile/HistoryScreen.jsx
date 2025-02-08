import React, { useContext, useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { AppContext } from '../../AppContext';
import DateFormatter from '../utils/DateFormatter';

const HistoryScreen = () => {
    const [historyData, setHistoryData] = useState([]);
    const [loading, setLoading] = useState(false);
    const { user, apiUrl } = useContext(AppContext);
    const token = user.token.access;

    useEffect(() => {
        fetchSentimentResults();
    }, []);

    const fetchSentimentResults = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${apiUrl}/api/voice/getsentimentdata/all/${user.userID}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (response.ok) {
                setHistoryData(data);
            } else {
                Alert.alert('Error', data.message || 'Failed to load data');
            }
        } catch (error) {
            console.error('Error fetching sentiment data:', error);
            Alert.alert('Network Error', 'Unable to fetch history.');
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }) => (
        <View style={styles.itemContainer}>
            <Text style={styles.fieldTitle}>Converted Text:</Text>
            <Text style={styles.fieldValue}>{item.converted_text || '-'}</Text>

            <Text style={styles.fieldTitle}>Sentiment:</Text>
            <Text style={styles.fieldValue}>{item.sentiment || '-'}</Text>

            <Text style={styles.fieldTitle}>Scores:</Text>
            <Text style={styles.fieldValue}>
                Pos: {item.scores?.pos}, Neg: {item.scores?.neg}, Neu: {item.scores?.neu}, Compound: {item.scores?.compound}
            </Text>

            <Text style={styles.fieldTitle}>Created At:</Text>
            <Text style={styles.fieldValue}>
                {DateFormatter.formatToUSA(item.created_at)}
            </Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Sentiment Analysis History</Text>
            {loading ? (
                <ActivityIndicator size="large" color="#007bff" />
            ) : (
                <FlatList
                    data={historyData}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContainer}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        padding: 16,
    },
    title: {
        fontSize: 17,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
    },
    listContainer: {
        paddingBottom: 20,
    },
    itemContainer: {
        backgroundColor: '#ffffff',
        padding: 12,
        marginBottom: 12,
        borderRadius: 8,
        elevation: 2,
    },
    fieldTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 4,
    },
    fieldValue: {
        fontSize: 11,
        color: '#555',
    },
});

export default HistoryScreen;