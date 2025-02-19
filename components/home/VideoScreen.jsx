import React, { useRef, useEffect, useState, useContext } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Video } from 'expo-av';
import { AppContext } from '../../AppContext';

const VideoScreen = ({ route }) => {

    const videoPath = route.params; // The API endpoint passed as a prop
    const videoRef = useRef(null); // Reference for the Video component
    const [videoUrl, setVideoUrl] = useState(null); // State to store the fetched video URL
    const [loading, setLoading] = useState(true); // Loading state for the video
    const { apiUrl } = useContext(AppContext);

    const playSound = async ( ) => {
        let payload = {
            filePath: videoPath,
        };

        const requestOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        };

        try {
            const response = await fetch(`${apiUrl}/play_video`, requestOptions);
            //console.log('response', response);

            if (response.ok) { 
                const blob = await response.blob();

            } else {
                //console.error('Error fetching audio file:', response.status);
            }
        } catch (error) {
            //console.error('Error playing sound:', error);
        }
    };
    useEffect(()=>{
        playSound();
    })

    return (
        <View style={styles.container}>
            <Video
                ref={videoRef}
                style={styles.video}
                useNativeControls
                resizeMode="contain"
                isLooping
            />

        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
    },
    video: {
        width: '100%',
        height: '100%',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
    },
    errorText: {
        color: '#fff',
        fontSize: 16,
    },
});

export default VideoScreen;