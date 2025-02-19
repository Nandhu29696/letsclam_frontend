import React, { useState, useRef, useEffect } from 'react';
import { Alert, StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { Video } from 'expo-av';
import * as FileSystem from 'expo-file-system';

const VideoPlayback = ({ apiUrl, videoPath }) => {
    const [videoUri, setVideoUri] = useState(null);
    const [playingVideoId, setPlayingVideoId] = useState(null);
    const videoRef = useRef(null);

    const playVideo = async (videoPath, id) => {
        const cacheFilePath = `${FileSystem.cacheDirectory}temp-video.mp4`;

        const payload = {
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
            // Clear the cache file if it exists
            const fileInfo = await FileSystem.getInfoAsync(cacheFilePath);
            if (fileInfo.exists) {
                await FileSystem.deleteAsync(cacheFilePath, { idempotent: true });
            }

            // Fetch the video file from the API
            const response = await fetch(`${apiUrl}/play_video`, requestOptions);
            if (response.ok) {
                const blob = await response.blob();

                // Convert blob to base64 and save as a new file
                const fileReader = new FileReader();
                fileReader.onload = async () => {
                    const base64data = fileReader.result.split(',')[1];
                    await FileSystem.writeAsStringAsync(cacheFilePath, base64data, {
                        encoding: FileSystem.EncodingType.Base64,
                    });

                    //console.log('File saved at:', cacheFilePath);

                    // Set the video URI and play the video
                    setVideoUri(cacheFilePath);
                    setPlayingVideoId(id);
                };

                fileReader.readAsDataURL(blob);
            } else {
                //console.error('Error fetching video file:', response.status);
                Alert.alert('Error', 'Unable to fetch video from server.');
            }
        } catch (error) {
            //console.error('Error playing video:', error);
            Alert.alert('Error', 'An error occurred while fetching the video.');
        }
    };

    const stopVideo = () => {
        if (videoRef.current) {
            videoRef.current.stopAsync();
        }
        setVideoUri(null);
        setPlayingVideoId(null);
    };

    useEffect(() => {
        return () => {
            if (videoRef.current) {
                videoRef.current.unloadAsync().catch((err) =>
                    //console.error('Error unloading video on unmount:', err)
                );
            }
        };
    }, []);

    return (
        <View style={styles.container}>
            {videoUri ? (
                <View style={styles.videoContainer}>
                    <Video
                        ref={videoRef}
                        source={{ uri: videoUri }}
                        style={styles.video}
                        useNativeControls
                        resizeMode="contain"
                        shouldPlay
                    />
                    <TouchableOpacity style={styles.stopButton} onPress={stopVideo}>
                        <Text style={styles.stopButtonText}>Stop Video</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <TouchableOpacity
                    style={styles.playButton}
                    onPress={() => playVideo(videoPath, 1)} // Pass videoPath and an ID
                >
                    <Text style={styles.playButtonText}>Play Video</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    videoContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    video: {
        width: '100%',
        height: '80%',
    },
    playButton: {
        padding: 10,
        backgroundColor: 'green',
        borderRadius: 5,
    },
    playButtonText: {
        color: '#fff',
        fontSize: 16,
    },
    stopButton: {
        padding: 10,
        backgroundColor: 'red',
        borderRadius: 5,
        marginTop: 20,
    },
    stopButtonText: {
        color: '#fff',
        fontSize: 16,
    },
});

export default VideoPlayback;
