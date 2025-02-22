import React from 'react';
import { Modal, View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Video } from 'expo-av';
import { Ionicons } from '@expo/vector-icons'; // For better close button UI

const VideoPlayer = ({ videoUri, stopVideo, videoRef }) => {
    return (
        <Modal animationType="fade" transparent={true} visible={!!videoUri}>
            <View style={styles.overlay}>
                <View style={styles.videoContainer}>
                    {/* Video Player */}
                    <Video
                        ref={videoRef}
                        source={{ uri: videoUri }}
                        style={styles.video}
                        useNativeControls
                        resizeMode="contain"
                        shouldPlay
                    />
                    
                    {/* Close Button */}
                    <TouchableOpacity style={styles.closeButton} onPress={stopVideo}>
                        <Ionicons name="close-circle" size={40} color="white" />
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.9)', // Dark background for focus
        justifyContent: 'center',
        alignItems: 'center',
    },
    videoContainer: {
        width: '90%',
        height: '50%',
        borderRadius: 10,
        overflow: 'hidden',
        backgroundColor: 'black',
    },
    video: {
        width: '100%',
        height: '100%',
    },
    closeButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        zIndex: 10, // Ensure it's above the video
    },
});

export default VideoPlayer;
