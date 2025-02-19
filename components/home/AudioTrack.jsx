import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Icon from 'react-native-vector-icons/FontAwesome';
import { Audio } from 'expo-av';

const AudioTrack = () => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [playingAudioId, setPlayingAudioId] = useState(null);
    const sound = useRef(new Audio.Sound());
    const [isLoaded, setIsLoaded] = useState(false);

    const audioFiles = [
        { id: '1', title: 'The Best Jazz', description: 'Calm music for relaxation', audioUrl: require('../../assets/audios/1.wav') },
        { id: '2', title: 'Beauteous', description: 'Stop Stressing', audioUrl: require('../../assets/audios/2.wav') },
        { id: '3', title: 'Inside You', description: 'Breathe in and breathe out', audioUrl: require('../../assets/audios/3.wav') }
    ];

    const playSound = async (audioUrl, id) => {
        try {
            if (isLoaded) await sound.current.stopAsync();
            await sound.current.unloadAsync();
            await sound.current.loadAsync({ uri: audioUrl });
            await sound.current.playAsync();
            setPlayingAudioId(id);
            setIsLoaded(true);
        } catch (error) {
            //console.error('Error playing sound:', error);
        }
    };

    const stopSound = async () => {
        if (isLoaded) {
            await sound.current.stopAsync();
            setPlayingAudioId(null);
            setIsLoaded(false);
        }
    };

    const renderAudioFile = ({ item }) => (
        <View style={styles.audioCard}>
            <View style={styles.audioInfo}>
                <Ionicons name="musical-notes-outline" size={22} color="black" />
                <View>
                    <Text style={styles.audioTitle}>{item.title}</Text>
                    <Text style={styles.audioDescription}>{item.description}</Text>
                </View>
            </View>
            <View style={styles.audioControls}>
                <TouchableOpacity
                    style={styles.playButton}
                    onPress={() => playSound(item.audioUrl, item.id)}>
                    <Icon name="play" size={14} color="#3caeff" />
                    <Text>Play</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.stopButton} onPress={stopSound}>
                    <Icon name="stop" size={14} color="red" />
                    <Text>Stop</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <FlatList data={audioFiles} renderItem={renderAudioFile} keyExtractor={(item) => item.id} />
    );
};

const styles = StyleSheet.create({
    audioCard: { padding: 10, backgroundColor: '#f9f9f9', borderRadius: 8, marginBottom: 10 },
    audioInfo: { flexDirection: 'row', alignItems: 'center' },
    audioTitle: { fontSize: 14, fontWeight: 'bold' },
    audioDescription: { fontSize: 12, color: '#777' },
    audioControls: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 10 },
    playButton: { flexDirection: 'row', alignItems: 'center' },
    stopButton: { flexDirection: 'row', alignItems: 'center' }
});

export default AudioTrack;
