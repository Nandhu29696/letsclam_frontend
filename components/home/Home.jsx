import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { Audio, Video } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Alert, FlatList, Modal, StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native';
import Toast from 'react-native-toast-message';
import Icon from 'react-native-vector-icons/FontAwesome';
import { AppContext } from '../../AppContext';
import { Platform } from 'react-native';
import VideoPlayer from './VideoScreen';

const HomeScreen = () => {

    const { user, userToken, apiUrl } = useContext(AppContext);

    const token = userToken;
    // const sound = useRef(new Audio.Sound());

    const [playingAudioId, setPlayingAudioId] = useState(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const navigation = useNavigation();

    const [audioFiles, setaudioFiles] = useState([])
    const [videoFiles, setvideoFiles] = useState([])
    const [videoUri, setVideoUri] = useState(null);
    const videoRef = useRef(null);
    const [playingVideoId, setPlayingVideoId] = useState(null);

    const [recording, setRecording] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [loading, setLoading] = useState(false);
    const [intervalId, setIntervalId] = useState(null);


    const recordingOptions = {
        android: {
            extension: '.wav',
            outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_PCM_16BIT,
            audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_PCM_16BIT,
            sampleRate: 44100,
            numberOfChannels: 2,
            bitRate: 128000,
        },
        ios: {
            extension: '.wav',
            audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
            sampleRate: 44100,
            numberOfChannels: 2,
            bitRate: 128000,
            linearPCMBitDepth: 16,
            linearPCMIsBigEndian: false,
            linearPCMIsFloat: false,
        },
    };

    const refreshPage = () => {
        fetchAudioFiles();
        fetchvideoFiles();
    };

    useFocusEffect(
        useCallback(() => {
            refreshPage();
        }, [])
    );

    useEffect(() => {
        const initializeRecording = async () => {
            const { granted } = await Audio.requestPermissionsAsync();
            if (granted) {
                await startRecording();
            } else {
                // console.log('Permission required. Microphone permission is required.');
                // Alert.alert('Permission required', 'Microphone permission is required.');
            }
        };
        initializeRecording();
        return () => {
            cleanupRecording();
        };
    }, []);

    const cleanupRecording = async () => {
        if (recording) {
            try {
                await recording.stopAndUnloadAsync();
            } catch (error) {
            }
        }
        clearInterval(intervalId);
        setRecording(null);
    };

    const startRecording = async () => {
        Toast.show({
            text1: 'Recording started..',
            type: 'success',
        });
        try {
            const { granted } = await Audio.requestPermissionsAsync();
            if (!granted) {
                Alert.alert('Permission required', 'Microphone permission is required.');
                return;
            }
            await cleanupRecording();
            setIsRecording(true);
            const { recording: newRecording } = await Audio.Recording.createAsync(recordingOptions);
            console.log('newRecording', newRecording);

            setRecording(newRecording);
            const id = setInterval(async () => {
                //console.log('1-minute interval reached. Stopping recording...');
                await handlePauseAndSave(newRecording);
            }, 30000);
            setIntervalId(id);
        } catch (error) {
            console.log(error);

            setIsRecording(false);
        }
    };

    const stopRecording = async () => {
        try {
            Toast.show({ text1: 'Recording stopped.', type: 'info', });
            setIsRecording(false);
            clearInterval(intervalId);
            if (recording) {
                await recording.stopAndUnloadAsync();
                const uri = recording.getURI();
                if (!uri) {
                    const audioBuffer = await currentRecording.getAudioData();
                    uri = URL.createObjectURL(new Blob([audioBuffer], { type: 'audio/wav' }));
                    //console.log('URI is null. Creating blob from audio data...', uri);
                    await transcribeAudio(uri);
                } else {
                    //console.log('Recording saved at:', uri);
                    await transcribeAudio(uri);
                }
                setRecording(null);
                // Toast.show({
                //     text1: 'Recording Stopped..',
                //     type: 'success',
                // });
            }
        } catch (error) {
            //console.error('Error stopping recording:', error);
        }
    };

    const handlePauseAndSave = async (currentRecording) => {
        try {
            if (currentRecording) {
                //console.log('Pausing and saving the current recording...');
                const status = await currentRecording.getStatusAsync();
                if (status.isRecording) {
                    await currentRecording.stopAndUnloadAsync();
                    const uri = currentRecording.getURI();
                    if (!uri) {
                        //console.log('URI is null or undefined. Creating Blob from audio data...');
                        const audioUri = await currentRecording.getURI();
                        //console.log('audioUri', audioUri);

                        if (audioUri) {
                            const response = await fetch(audioUri);
                            const audioBlob = await response.blob();
                            uri = await uploadBlobToStorage(audioBlob);
                            //console.log('Audio uploaded, URI:', uri);
                            await transcribeAudio(uri);
                        }
                    } else {
                        //console.log('Recording saved at:', uri);
                        await transcribeAudio(uri);
                    }
                }
                setRecording(null);
                if (intervalId) {
                    clearInterval(intervalId);
                    setIntervalId(null);
                }
                setTimeout(async () => {
                    //console.log('Starting a new recording...');
                    const { recording: newRecording } = await Audio.Recording.createAsync(recordingOptions);
                    setRecording(newRecording);
                    const newIntervalId = setInterval(async () => {
                        //console.log('1-minute interval reached. Stopping recording...');
                        handlePauseAndSave(newRecording);
                    }, 30000);
                    setIntervalId(newIntervalId);
                }, 500);
            } else {
                //console.log('No recording to pause and save.');
            }
        } catch (error) {
            //console.error('Error during pause and save:', error);
        }
    };

    const uploadBlobToStorage = async (blob) => {
        try {
            // Example using Firebase Storage (you can replace this with your own blob storage method)
            const storageRef = firebase.storage().ref();
            const blobRef = storageRef.child('audio_files/' + new Date().getTime() + '.wav');

            await blobRef.put(blob);
            const downloadURL = await blobRef.getDownloadURL();
            return downloadURL;  // This is the URI of the uploaded audio file
        } catch (error) {
            //console.error('Error uploading blob to storage:', error);
            throw new Error('Failed to upload audio to blob storage');
        }
    };

    const transcribeAudio = async (uri) => {
        if (!uri) {
            // Toast.show({ text1: 'Error', text2: 'Invalid audio file.', type: 'error' });
            return;
        }

        try {
            setLoading(true);
            const formData = new FormData();
            let file;
            //console.log('Platform.OS', Platform.OS);

            if (Platform.OS === 'web') {
                // Web: Convert Blob URL to File
                const response = await fetch(uri);
                const blob = await response.blob();
                file = new File([blob], `audio-${Date.now()}.wav`, { type: 'audio/wav' });
            } else {
                // Mobile: Directly use uri
                file = { uri, name: `audio-${Date.now()}.wav`, type: 'audio/wav' };
            }

            formData.append('file', file);

            const res = await axios.post(`${apiUrl}/api/voice/transcribe`, formData, {
                method: 'POST',
                headers: {
                    "Content-Type": 'multipart/form-data',
                    "Authorization": `Bearer ${token}`
                }
            });

            const audioData = res.data?.data;
            if (audioData?.length > 0) {
                const { file_name, id } = audioData[0];
                playSound(file_name, id);
                await stopRecording();
            } else {
                // Toast.show({ text1: 'No Transcription Data', text2: 'No matching audio found.', type: 'info' });
            }
        } catch (error) {
            const status = error.response?.status;
            const errorMessage = error.response?.data?.message;

            if (status === 401) {
                // Toast.show({ text1: 'Unauthorized', text2: 'Session expired. Please log in again.', type: 'error' });
                navigation.replace('Login');
            } else if (status === 404 && errorMessage === 'No audio files found.') {
                // Toast.show({ text1: 'No Audio Found', text2: 'No audio files were found for transcription.', type: 'info' });
            } else {
                // Toast.show({ text1: 'Error', text2: 'Failed to transcribe audio. Try again later.', type: 'error' });
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchAudioFiles = async () => {
        await axios.get(`${apiUrl}/api/voice/audio/all/${user.id}`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        }).then((res) => {
            const data = res.data;
            setaudioFiles(data);
        }).catch((error) => {
            const status = error.response?.status;
            if (status === 401) {
                // Toast.show({ text1: 'Unauthorized', text2: 'Your session has expired. Please log in again.', type: 'error' });
                navigation.replace('Login');
            } else {
                // Toast.show({ text1: 'Error', text2: 'Failed to fetch audio files. Please try again later.', type: 'error' });
                setaudioFiles([]);
            }
        });
    };

    useEffect(() => {
        return () => {
            if (sound.current && typeof sound.current.unloadAsync === "function") {
                sound.current.unloadAsync().catch((err) => {
                    console.error("Error unloading sound on unmount:", err);
                });
            }
            if (videoRef.current) {
                videoRef.current.unloadAsync().catch((err) =>
                    console.error('Error unloading video on unmount:', err)
                );
            }
        };
    }, []);

    const sound = useRef(null);
    const webAudio = useRef(null);

    const playSound = async (audioPath, id) => {
        try {
            const payload = { file_path: audioPath.startsWith('audio/') ? audioPath : `audio/${audioPath}` };
            const response = await fetch(`${apiUrl}/api/voice/audio/play`, {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) throw new Error(`Failed to fetch audio: ${response.status}`);

            // --- ✅ WEB ---
            if (Platform.OS === 'web') {
                const blob = await response.blob();
                const audioURL = URL.createObjectURL(blob);
                if (webAudio.current) {
                    webAudio.current.pause();
                    webAudio.current.currentTime = 0;
                    URL.revokeObjectURL(webAudio.current.src);
                }
                webAudio.current = new window.Audio(audioURL);
                webAudio.current.play();
                webAudio.current.onended = () => URL.revokeObjectURL(audioURL);
                setIsLoaded(true);
                setPlayingAudioId(id);
                return;
            }

            // --- ✅ ANDROID / iOS ---
            const blob = await response.blob();
            const fileReader = new FileReader();

            fileReader.onload = async () => {
                const base64data = fileReader.result.split(',')[1];
                const cacheFilePath = `${FileSystem.cacheDirectory}temp-audio.mp3`;
                await FileSystem.writeAsStringAsync(cacheFilePath, base64data, {
                    encoding: FileSystem.EncodingType.Base64,
                });

                if (sound.current) {
                    await sound.current.unloadAsync();
                }

                sound.current = new Audio.Sound();
                await sound.current.loadAsync({ uri: cacheFilePath });
                await sound.current.playAsync();

                setIsLoaded(true);
                setPlayingAudioId(id);
            };

            fileReader.readAsDataURL(blob);
        } catch (error) {
            console.log('Error playing sound:', error);
        }
    };

    const stopSound = async () => {
        try {
            if (Platform.OS === "web") {
                // Web: just reset state
                setPlayingAudioId(null);
                setIsLoaded(false);
                return;
            }

            // Native only
            if (sound.current) {
                const currentSound = sound.current;

                // Check if the sound object supports these methods
                if (typeof currentSound.getStatusAsync === "function") {
                    const status = await currentSound.getStatusAsync().catch(() => null);

                    if (status?.isLoaded) {
                        if (status.isPlaying && typeof currentSound.stopAsync === "function") {
                            await currentSound.stopAsync().catch(() => null);
                        }

                        if (typeof currentSound.unloadAsync === "function") {
                            await currentSound.unloadAsync().catch(() => null);
                        }
                    }
                }

                // Always clean up
                sound.current = null;
            }

            setPlayingAudioId(null);
            setIsLoaded(false);
        } catch (error) {
            console.log("Error stopping sound safely:", error);
        }
    };


    const fetchvideoFiles = async () => {
        await axios.get(`${apiUrl}/api/voice/video/all/${user.userID}`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        }).then((res) => {
            const data = res.data;
            setvideoFiles(data);
        }).catch((error) => {
            const status = error.response?.status;
            if (status === 401) {
                // Toast.show({ text1: 'Unauthorized', text2: 'Your session has expired. Please log in again.', type: 'error' });
                navigation.replace('Login');
            } else {
                // Toast.show({ text1: 'Error', text2: 'Failed to fetch video files. Please try again later.', type: 'error' });
                setvideoFiles([]);
            }
        });
    };

    const playVideo = async (videoPath, id) => {
        // console.log('videoPath', videoPath);

        if (Platform.OS !== 'web') {
            // 🔹 Native platforms (iOS/Android) use cache directory
            var cacheFilePath = `${FileSystem.cacheDirectory}temp-video.mp4`;
        }

        setLoading(true);
        const payload = {
            file_path: videoPath.startsWith('video/') ? videoPath : `video/${videoPath}`,
        };
        const requestOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(payload),
        };

        try {
            if (Platform.OS !== 'web') {
                // 🔹 On mobile, delete the old file before writing a new one
                const fileInfo = await FileSystem.getInfoAsync(cacheFilePath);
                if (fileInfo.exists) {
                    await FileSystem.deleteAsync(cacheFilePath, { idempotent: true });
                }
            }

            // 🔹 Fetch video from API
            const response = await fetch(`${apiUrl}/api/voice/video/play`, requestOptions);
            // console.log('response', response);

            if (response.ok) {
                const blob = await response.blob();

                if (Platform.OS === 'web') {
                    // 🔹 Web: Use blob URL instead of filesystem storage
                    const videoUrl = URL.createObjectURL(blob);
                    setVideoUri(videoUrl);
                } else {
                    // 🔹 Mobile: Store video in cache and play
                    const fileReader = new FileReader();
                    fileReader.onload = async () => {
                        const base64data = fileReader.result.split(',')[1];
                        await FileSystem.writeAsStringAsync(cacheFilePath, base64data, {
                            encoding: FileSystem.EncodingType.Base64,
                        });
                        setVideoUri(cacheFilePath);
                    };
                    fileReader.readAsDataURL(blob);
                }
                setPlayingVideoId(id);
            } else {
                Alert.alert('Error', 'Unable to fetch video from server.');
            }
        } catch (error) {
            console.error('Error playing video:', error);
            Alert.alert('Error', 'An error occurred while fetching the video.');
        }
    };

    const stopVideo = () => {
        if (videoRef.current) {
            videoRef.current.stopAsync();
        }
        setVideoUri(null);
        setLoading(false);
        setPlayingVideoId(null);
    };

    const renderAudioFile = ({ item }) => (
        <View style={playingAudioId === item.id ? styles.audioCardBg : styles.audioCard}>
            {/* Audio Info Section */}
            <View style={styles.audioInfo}>
                <Ionicons name="musical-notes-outline" size={22} color="black" style={styles.icon} />
                <View style={[styles.textContainer, !item.description && styles.centerContent]}>
                    <Text style={styles.audioTitle}>{item.title}{item.sentiment_type ? ` - ${item.sentiment_type}` : ""}</Text>
                    {item.description ? (
                        <Text style={styles.audioDescription}>{item.description}</Text>
                    ) : null}
                </View>

            </View>

            {/* Play & Stop Icons */}
            <View style={styles.audioControls}>
                <Ionicons
                    name="play-circle"
                    size={20}
                    color="green"
                    onPress={() => playSound(item.file_name, item.id)}
                    style={styles.iconButton}
                />
                <Ionicons
                    name="stop-circle"
                    size={20}
                    color="red"
                    onPress={stopSound}
                    style={styles.iconButton}
                />
            </View>

        </View>
    );

    const renderVideoFile = ({ item }) => (
        <View style={styles.audioCard}>
            <View style={styles.audioRow}>
                {/* Video Icon */}
                <Ionicons name="videocam-outline" size={22} color="black" style={styles.icon} />

                {/* Title and Sentiment */}
                <View style={styles.audioTextContainer}>
                    <View style={[styles.textContainer, !item.description && styles.centerContent]}>
                        <Text style={styles.audioTitle}>{item.title}{item.sentiment_type ? ` - ${item.sentiment_type}` : ""}</Text>
                        {item.description ? (
                            <Text style={styles.audioDescription}>{item.description}</Text>
                        ) : null}
                    </View>
                </View>

                {/* Play & Stop Icons */}
                <View style={styles.audioControls}>
                    <Ionicons
                        name="play-circle"
                        size={20}
                        color="green"
                        onPress={() => playVideo(item.file_name, item.id)}
                        style={styles.iconButton}
                    />
                    <Ionicons
                        name="stop-circle"
                        size={20}
                        color="red"
                        onPress={stopVideo}
                        style={styles.iconButton}
                    />
                </View>
            </View>
        </View>
    );



    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                <Text style={styles.title}>Welcome to LetsCalm</Text>
                <TouchableOpacity style={styles.historyButton} onPress={() => navigation.navigate('History')}>
                    <MaterialIcons name="history" size={25} color="#029fe4" />
                </TouchableOpacity>
            </View>
            <Text style={styles.subtitle}>Stops Conflict-Promotes Happiness</Text>

            <View style={styles.descriptionContainer}>
                <Text style={styles.description}>
                    Please tap on the "Start Recording" button and observe the audio or video that is played
                    when the voice volume reaches its peak.
                </Text>
                <View style={styles.recordingButtons}>
                    <TouchableOpacity
                        style={[styles.recordButton, { backgroundColor: isRecording ? '#eaf3fb' : '#c0dbf2' }]}
                        onPress={startRecording} disabled={isRecording}>
                        <View style={styles.buttonContent}>
                            <Icon name="microphone" size={10} color="#3caeff" style={styles.icon} />
                            <Text style={styles.startbuttonText}>Start Recording</Text>
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.recordButton, { backgroundColor: '#F6D3D3' }]}
                        onPress={stopRecording} disabled={!isRecording}>
                        <View style={styles.buttonContent}>
                            <Icon name="stop" size={10} color="#f70d1a" style={styles.icon} />
                            <Text style={styles.stopbuttonText}>Stop Alert</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>

            <Text style={styles.sectionTitle}>Choose your Favourite Audio File</Text>
            <View style={styles.fixedListContainer}>
                <FlatList
                    data={audioFiles}
                    renderItem={renderAudioFile}
                    keyExtractor={(item) => item.id}
                    style={styles.audioList}
                    showsVerticalScrollIndicator={true}
                />
            </View>
            <Text style={styles.sectionTitle}>Choose Your Favorite Video File</Text>
            <View style={styles.fixedListContainer}>
                <FlatList
                    data={videoFiles}
                    renderItem={renderVideoFile}
                    keyExtractor={(item) => item.id}
                    style={styles.audioList} />
            </View>
            {
                videoUri && (
                    <VideoPlayer videoUri={videoUri} videoRef={videoRef} stopVideo={stopVideo} />

                )
            }
        </View >

    );
    return { playSound, stopSound, isLoaded, playingAudioId };
};


const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        padding: 20,
        paddingTop: 100,
        width: '100%',
        backgroundColor: '#eeeee4',
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between', // Adjust spacing
        padding: 10,
        paddingTop: 0
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'left',
        marginBottom: 5
    },
    historyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    subtitle: {
        fontSize: 14,
        textAlign: 'left',
        marginBottom: 10,
        color: '#666',
    },
    descriptionContainer: {
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.15,
        shadowRadius: 2,
        elevation: 3,
        padding: 10,
        borderRadius: 10,
        backgroundColor: 'white',
        alignItems: 'flex-start',
    },
    description: {
        fontSize: 11,
        textAlign: 'left',
        color: '#888',
        marginBottom: 2
    },
    recordingButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginTop: 10
    },
    recordButton: {
        flex: 1,
        padding: 8,
        alignItems: 'center',
        borderRadius: 5,
        marginHorizontal: 5,
    },
    recording: {
        backgroundColor: '#D3E6F6',
    },
    notRecording: {
        backgroundColor: '#F6D3D3',
    },
    startbuttonText: {
        color: "#3caeff",
        fontWeight: 'bold',
        fontSize: 13,
        textAlign: 'center',
    },
    stopbuttonText: {
        color: "#f70d1a",
        fontWeight: 'bold',
        fontSize: 13,
        textAlign: 'center',
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center'
    },
    icon: {
        marginRight: 5,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginVertical: 5,
        textAlign: 'left',
    },
    audioList: {
        marginBottom: 10,
    },
    audioCardBg: {
        backgroundColor: '#95baf5',
        padding: 10,
        marginVertical: 5,
        borderRadius: 8,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderWidth: 1,
        borderColor: "#eee",
    },
    audioCard: {
        padding: 10,
        marginVertical: 5,
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderWidth: 1,
        borderColor: "#eee",
    },

    fixedListContainer: {
        height: 200,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        marginBottom: 20,
        overflow: 'hidden',
    },
    audioInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    icon: {
        marginRight: 10,
    },
    audioTitle: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    audioDescription: {
        fontSize: 11,
        color: '#777',
    },
    audioControls: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 10,
    },
    buttonText: {
        fontWeight: 'bold',
        fontSize: 12,
        textAlign: 'center',
        marginLeft: 5,
    },
    playButton: {
        backgroundColor: '#D3E6F6',
        padding: 5,
        width: '30%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 5,
        borderRadius: 5,
    },
    stopButton: {
        backgroundColor: '#F6D3D3',
        padding: 5, width: '30%',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 5,
    },
    selectButton: {
        backgroundColor: '#9df2c1',
        padding: 5, width: '30%',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 5,
    },
    videoSection: {
        marginTop: 20,
    },
    video: {
        width: '100%',
        height: '80%',
    },
    audioRow: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1, // Ensures it stretches across available space
    },

    audioTextContainer: {
        flex: 1, // Allows text to take available space
    },
    iconButton: {
        marginLeft: 2,
    },
    textContainer: {
        alignItems: 'flex-start', // Default alignment when description is present
    },
    centerContent: {
        alignItems: 'center', // Center content if no description
        justifyContent: 'center',
    },
});

if (Platform.OS === 'web') {
    const globalStyle = document.createElement('style');
    globalStyle.innerHTML = `
        ::-webkit-scrollbar {
            width: 6px; /* Reduced width */
            height: 6px;
        }
        ::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb {
            background: #c0dbf2; /* Light blue */
            border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: #a0c4de; /* Darker blue on hover */
        }
        ::-webkit-scrollbar-thumb:active {
            background: #7daed6;
        }
    `;
    document.head.appendChild(globalStyle);
}

export default HomeScreen;
