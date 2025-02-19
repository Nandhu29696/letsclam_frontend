import { Ionicons } from '@expo/vector-icons';
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

const HomeScreen = () => {

    const { user, apiUrl } = useContext(AppContext);
    const token = user.token.access;
    const sound = useRef(new Audio.Sound());
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
        //console.log('Screen refreshed!');
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
                startRecording();
            } else {
                console.log('Permission required. Microphone permission is required.');
                Alert.alert('Permission required', 'Microphone permission is required.');
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
            text1: 'Starts Recording..',
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
            setRecording(newRecording);
            const id = setInterval(async () => {
                //console.log('1-minute interval reached. Stopping recording...');
                await handlePauseAndSave(newRecording);
            }, 60000);
            setIntervalId(id);
        } catch (error) {
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
                Toast.show({
                    text1: 'Recording Stopped..',
                    type: 'success',
                });
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
                    }, 60000);
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
            Toast.show({ text1: 'Error', text2: 'Invalid audio file.', type: 'error' });
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

            const headers = {
                'Content-Type': 'multipart/form-data',
            };

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const res = await axios.post(`${apiUrl}/api/voice/transcribe`, formData, { headers });

            const audioData = res.data?.data;
            if (audioData?.length > 0) {
                const { file_name, id } = audioData[0];
                playSound(file_name, id);
            } else {
                Toast.show({ text1: 'No Transcription Data', text2: 'No matching audio found.', type: 'info' });
            }
        } catch (error) {
            const status = error.response?.status;
            const errorMessage = error.response?.data?.message;

            if (status === 401) {
                Toast.show({ text1: 'Unauthorized', text2: 'Session expired. Please log in again.', type: 'error' });
                navigation.replace('Login');
            } else if (status === 404 && errorMessage === 'No audio files found.') {
                Toast.show({ text1: 'No Audio Found', text2: 'No audio files were found for transcription.', type: 'info' });
            } else {
                Toast.show({ text1: 'Error', text2: 'Failed to transcribe audio. Try again later.', type: 'error' });
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchAudioFiles = async () => {
        await axios.get(`${apiUrl}/api/voice/audio/all/${user.userID}`, {
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
                Toast.show({ text1: 'Unauthorized', text2: 'Your session has expired. Please log in again.', type: 'error' });
                navigation.replace('Login');
            } else {
                Toast.show({ text1: 'Error', text2: 'Failed to fetch audio files. Please try again later.', type: 'error' });
                setaudioFiles([]);
            }
        });
    };

    const playSound = async (audioPath, id) => {
        const cacheFilePath = `${FileSystem.cacheDirectory}temp-audio.mp3`;
        const payload = { file_path: audioPath.startsWith('audio/') ? audioPath : `audio/${audioPath}`, };
        const requestOptions = {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(payload),
        };

        try {
            const response = await fetch(`${apiUrl}/api/voice/audio/play`, requestOptions);
            if (!response.ok) throw new Error(`Failed to fetch audio: ${response.status}`);

            if (Platform.OS === 'web') {
                // 🌐 Web: Use HTML5 Audio API
                const blob = await response.blob();
                //console.log('blob', blob);
                const audioURL = URL.createObjectURL(blob);
                //console.log('audioURL ', audioURL);
                const audio = new window.Audio(audioURL);  // Ensure window.Audio is used
                audio.load();
                await audio.play();

                // Cleanup
                audio.onended = () => URL.revokeObjectURL(audioURL);
            } else {
                if (response.ok) {
                    const blob = await response.blob();

                    // Convert blob to base64 and save as a new file
                    const fileReader = new FileReader();
                    fileReader.onload = async () => {
                        const base64data = fileReader.result.split(',')[1];
                        await FileSystem.writeAsStringAsync(cacheFilePath, base64data, {
                            encoding: FileSystem.EncodingType.Base64,
                        });

                        // Unload any previously loaded sound
                        if (isLoaded) {
                            try {
                                await sound.current.stopAsync();
                                await sound.current.unloadAsync();
                                setIsLoaded(false);
                            } catch (err) {
                                //console.error('Error unloading sound:', err);
                            }
                        }

                        // Reset the sound instance (optional, for safe measure)
                        sound.current = new Audio.Sound();

                        // Load and play the new sound
                        try {
                            await sound.current.loadAsync({ uri: cacheFilePath });
                            await sound.current.playAsync();
                            setIsLoaded(true);
                            setPlayingAudioId(id);
                        } catch (err) {
                            //console.error('Error playing sound:', err);
                        }
                    };

                    fileReader.readAsDataURL(blob);
                } else {
                    //console.error('Error fetching audio file:', response.status);
                }
            }
        } catch (error) {
            //console.error('Error playing sound:', error);
        }
    };
    useEffect(() => {
        return () => {
            if (sound.current) {
                sound.current.unloadAsync().catch((err) =>
                    console.error('Error unloading sound on unmount:', err)
                );
            }
            if (videoRef.current) {
                videoRef.current.unloadAsync().catch((err) =>
                    console.error('Error unloading video on unmount:', err)
                );
            }
        };
    }, []);

    const stopSound = async () => {
        try {
            if (isLoaded && sound.current) {
                await sound.current.stopAsync();
                await sound.current.unloadAsync(); // Unload to free resources
                setPlayingAudioId(null);
                setIsLoaded(false);
            }
        } catch (error) {
            //console.error("Error stopping sound:", error);
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
                Toast.show({ text1: 'Unauthorized', text2: 'Your session has expired. Please log in again.', type: 'error' });
                navigation.replace('Login');
            } else {
                // Toast.show({ text1: 'Error', text2: 'Failed to fetch video files. Please try again later.', type: 'error' });
                setvideoFiles([]);
            }
        });
    };

    const playVideo = async (videoPath, id) => {

        const cacheFilePath = `${FileSystem.cacheDirectory}temp-video.mp4`;
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
            const fileInfo = await FileSystem.getInfoAsync(cacheFilePath);
            if (fileInfo.exists) {
                await FileSystem.deleteAsync(cacheFilePath, { idempotent: true });
            }
            const response = await fetch(`${apiUrl}/api/voice/video/play`, requestOptions);
            console.log('response', response);

            if (response.ok) {
                const blob = await response.blob();
                const fileReader = new FileReader();
                fileReader.onload = async () => {
                    const base64data = fileReader.result.split(',')[1];
                    await FileSystem.writeAsStringAsync(cacheFilePath, base64data, {
                        encoding: FileSystem.EncodingType.Base64,
                    });
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
        setLoading(false);
        setPlayingVideoId(null);
    };

    const renderAudioFile = ({ item }) => (
        <View style={styles.audioCard}>
            <View style={styles.audioInfo}>
                <Ionicons name="musical-notes-outline" size={22} color="black" style={styles.icon} />
                <View>
                    <Text style={styles.audioTitle}>{item.title}</Text>
                    <Text style={styles.audioDescription}>{item.description}</Text>
                </View>
            </View>
            <View style={styles.audioControls}>
                <TouchableOpacity
                    style={[styles.playButton, playingAudioId === item.id && styles.playButtonActive]}
                    onPress={() => playSound(item.file_name, item.id)}>
                    <Icon name="play" size={14} color={playingAudioId === item.id ? "white" : "#3caeff"} />
                    <Text style={[styles.buttonText, { color: playingAudioId === item.id ? "blue" : "#3caeff" }]}>Play</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.stopButton}
                    onPress={stopSound}>
                    <Icon name="stop" size={14} color="f70d1a" />
                    <Text style={[styles.buttonText, { color: "#f70d1a" }]}>Stop</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.selectButton}>
                    <Icon name="check" size={14} color="#00b34c" />
                    <Text style={[styles.buttonText, { color: "#00b34c" }]}>Select</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderVideoFile = ({ item }) => (
        <View style={styles.audioCard}>
            <View style={styles.audioInfo}>
                <Ionicons name="videocam-outline" size={22} color="black" style={styles.icon} />
                <View>
                    <Text style={styles.audioTitle}>{item.title}</Text>
                </View>
            </View>
            <View style={styles.audioControls}>
                <TouchableOpacity
                    style={styles.playButton}
                    onPress={() => playVideo(item.file_name, item.id)} >
                    <Icon name="play" size={14} color={playingAudioId === item.id ? "white" : "#3caeff"} />
                    <Text style={[styles.buttonText, { color: playingAudioId === item.id ? "blue" : "#3caeff" }]}>Play</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.stopButton}
                    onPress={stopSound} >
                    <Icon name="stop" size={14} color="f70d1a" />
                    <Text style={[styles.buttonText, { color: "#f70d1a" }]}>Stop</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.selectButton}>
                    <Icon name="check" size={14} color="#00b34c" />
                    <Text style={[styles.buttonText, { color: "#00b34c" }]}>Select</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Welcome to LetsCalm</Text>
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
                    <Modal animationType="slide" transparent={false} visible={!!videoUri}>
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
                    </Modal>
                )
            }
        </View >

    );
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        padding: 20,
        marginTop: 90,
        backgroundColor: '#fff',
    }, scrollContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
    contentContainer: {
        flexGrow: 1, // Allows scrolling when content overflows
        paddingBottom: 20, // Adds some space at the bottom to ensure smooth scrolling
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'left',
        marginBottom: 5,
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
        fontSize: 13,
        textAlign: 'left',
        color: '#888',
        marginBottom: 5
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
    audioCard: {
        padding: 15,
        backgroundColor: '#f9f9f9',
        borderRadius: 10,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#eee',
    },
    fixedListContainer: {
        height: 200, // Set a fixed height for the list
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
        padding: 4,
        fontWeight: 'bold',
    },
    audioDescription: {
        fontSize: 12,
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
