import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, Dimensions } from 'react-native';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import AudioUpload from './audioUpload/AudioUpload';
import VideoUpload from './audioUpload/VideoUpload';
import { AppContext } from '../../AppContext';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

const Tab = createMaterialTopTabNavigator();
const ProfileScreen = () => {
    const userdet = {
        name: 'Nandhu',
        email: 'nandhu2@gmail.com',
        phone: '+1 234 567 890',
        country: 'United States',
        profilePicture: 'https://images.pexels.com/photos/1704488/pexels-photo-1704488.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500',
    };

    const { user, apiUrl } = useContext(AppContext);
    const token = user.token.access;

    const [userfile, setUserfile] = useState(userdet)
    const getUserDetails = async () => {
        try {
            const response = await fetch(`${apiUrl}/api/user/profile`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setUserfile(data);
            } else {
                setUserfile(userdet);
            }
        } catch (error) {
            setUserfile(userdet);
        }
    };

    useEffect(() => {
        getUserDetails();
    }, []);

    const [index, setIndex] = useState(0);
    const [routes] = useState([
        { key: 'audio', title: 'Audio Files' },
        { key: 'video', title: 'Video Files' },
    ]);

    const renderScene = SceneMap({
        audio: AudioUpload,
        video: VideoUpload,
    });

    return (
        <View style={styles.container}>
            <View style={styles.profileContainer}>
                <Image source={{ uri: userdet.profilePicture }} style={styles.profilePicture} />
                <Text style={styles.userName}>{userdet.name}</Text>
                <Text style={styles.userInfo}>Email: {userfile.email}</Text>
                <Text style={styles.userInfo}>Phone: {userdet.phone}</Text>
                <Text style={styles.userInfo}>Country: {userdet.country}</Text>
            </View>

            <TabView
                navigationState={{ index, routes }}
                renderScene={renderScene}
                onIndexChange={setIndex}
                initialLayout={{ width: Dimensions.get('window').width }}
                renderTabBar={props => (
                    <TabBar
                        {...props}
                        indicatorStyle={styles.tabIndicator}
                        style={styles.tabBar}
                        labelStyle={styles.tabLabel}
                    />
                )}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9f9f9',
    },
    profileContainer: {
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#ffffff',
        marginBottom: 10,
    },
    profilePicture: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 10,
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    userInfo: {
        fontSize: 16,
        color: '#555',
        marginTop: 5,
    },
    tabBar: {
        backgroundColor: '#007bff',
    },
    tabLabel: {
        color: '#ffffff',
        fontWeight: 'bold',
    },
    tabIndicator: {
        backgroundColor: '#ffffff',
    },
    tabContent: {
        padding: 20,
    },
    fileItem: {
        fontSize: 16,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
});

export default ProfileScreen;