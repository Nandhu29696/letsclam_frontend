// import React, { useState, useEffect, useContext } from 'react';
// import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
// import { Audio } from 'expo-av';
// import FontAwesome from 'react-native-vector-icons/FontAwesome';
// import { AppContext } from '../../AppContext';

// const VoiceRecordingScreen = () => {
//     const [recording, setRecording] = useState(null);
//     const [isRecording, setIsRecording] = useState(false);
//     const [loading, setLoading] = useState(false);
//     const [intervalId, setIntervalId] = useState(null);
//     const { user, setIsLoggedIn, apiUrl } = useContext(AppContext);
//     const token = user.token.access;

//     const recordingOptions = {
//         android: {
//             extension: '.wav',
//             outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_PCM_16BIT,
//             audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_PCM_16BIT,
//             sampleRate: 44100,
//             numberOfChannels: 2,
//             bitRate: 128000,
//         },
//         ios: {
//             extension: '.wav',
//             audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
//             sampleRate: 44100,
//             numberOfChannels: 2,
//             bitRate: 128000,
//             linearPCMBitDepth: 16,
//             linearPCMIsBigEndian: false,
//             linearPCMIsFloat: false,
//         },
//     };

//     useEffect(() => {
//         const initializeRecording = async () => {
//             const { granted } = await Audio.requestPermissionsAsync();
//             if (granted) {
//                 await startRecording();
//             } else {
//                 Alert.alert('Permission required', 'Microphone permission is required.');
//             }
//         };
//         initializeRecording();

//         return () => {
//             cleanupRecording();
//         };
//     }, []);

//     const cleanupRecording = async () => {
//         if (recording) {
//             try {
//                 await recording.stopAndUnloadAsync();
//             } catch (error) {
//                 //console.error('Error during cleanup:', error);
//             }
//         }
//         clearInterval(intervalId);
//         setRecording(null);
//     };

//     const startRecording = async () => {
//         try {
//             const { granted } = await Audio.requestPermissionsAsync();
//             if (!granted) {
//                 Alert.alert('Permission required', 'Microphone permission is required.');
//                 return;
//             }
//             await cleanupRecording();
//             setIsRecording(true);
//             const { recording: newRecording } = await Audio.Recording.createAsync(recordingOptions);
//             setRecording(newRecording);
//             const id = setInterval(async () => {
//                 //console.log('1-minute interval reached. Stopping recording...');
//                 await handlePauseAndSave(newRecording);
//             }, 60000);
//             setIntervalId(id);
//         } catch (error) {
//             //console.error('Error starting recording:', error);
//             setIsRecording(false);
//         }
//     };

//     const stopRecording = async () => {
//         try {
//             setIsRecording(false);
//             clearInterval(intervalId);
//             if (recording) {
//                 await recording.stopAndUnloadAsync();
//                 const uri = recording.getURI();
//                 //console.log('Final recording saved at:', uri);
//                 await transcribeAudio(uri);
//                 setRecording(null);
//             }
//         } catch (error) {
//             //console.error('Error stopping recording:', error);
//         }
//     };

//     const handlePauseAndSave = async (currentRecording) => {
//         try {
//             if (currentRecording) {
//                 //console.log('Pausing and saving the current recording...');
//                 const status = await currentRecording.getStatusAsync();
//                 if (status.isRecording) {
//                     await currentRecording.stopAndUnloadAsync();
//                     const uri = currentRecording.getURI();
//                     //console.log('Recording saved at:', uri);
//                     await transcribeAudio(uri);
//                 }
//                 setRecording(null);
//                 if (intervalId) {
//                     clearInterval(intervalId);
//                     setIntervalId(null);
//                 }
//                 setTimeout(async () => {
//                     //console.log('Starting a new recording...');
//                     const { recording: newRecording } = await Audio.Recording.createAsync(recordingOptions);
//                     setRecording(newRecording);
//                     const newIntervalId = setInterval(async () => {
//                         //console.log('1-minute interval reached. Stopping recording...');
//                         handlePauseAndSave(newRecording);
//                     }, 60000);
//                     setIntervalId(newIntervalId);
//                 }, 500);
//             } else {
//                 //console.log('No recording to pause and save.');
//             }
//         } catch (error) {
//             //console.error('Error during pause and save:', error);
//         }
//     };


//     const transcribeAudio = async (uri) => {
//         try {
//             setLoading(true);
//             const formData = new FormData();
//             formData.append('file', {
//                 uri,
//                 name: `audio-${Date.now()}.wav`,
//                 type: 'audio/wav',
//             });
//             // const response = await fetch(`${apiUrl}/api/voice/transcribe`, {
//             //     method: 'POST',
//             //     headers: {
//             //         'Content-Type': 'multipart/form-data',
//             //         "Authorization": `Bearer ${token}`
//             //     },
//             //     body: formData,
//             // });
//             // const data = await response.json();
//             // //console.log('API Response:', data);
//         } catch (error) {
//             //console.error('Error uploading file:', error.message);
//         } finally {
//             setLoading(false);
//         }
//     };
    
//     return (
//         <View style={styles.container}>
//             <Text style={styles.title}>Continuous Voice Recorder</Text>
//             <TouchableOpacity
//                 style={[styles.recordButton, isRecording ? styles.recording : styles.notRecording]}
//                 onPress={isRecording ? stopRecording : startRecording}
//                 disabled={loading}
//             >
//                 <FontAwesome name={isRecording ? 'stop' : 'microphone'} size={30} color="#fff" />
//                 <Text style={styles.buttonText}>{isRecording ? 'Stop' : 'Start'}</Text>
//             </TouchableOpacity>
//             {loading && <ActivityIndicator size="large" color="#007bff" style={styles.loader} />}
//         </View>
//     );
// };

// const styles = StyleSheet.create({
//     container: {
//         flex: 1,
//         justifyContent: 'center',
//         alignItems: 'center',
//         backgroundColor: '#f5f5f5',
//         padding: 20,
//     },
//     title: {
//         fontSize: 24,
//         fontWeight: 'bold',
//         marginBottom: 20,
//     },
//     recordButton: {
//         width: 150,
//         height: 150,
//         borderRadius: 75,
//         justifyContent: 'center',
//         alignItems: 'center',
//         elevation: 5,
//     },
//     recording: {
//         backgroundColor: '#ff4d4d',
//     },
//     notRecording: {
//         backgroundColor: '#007bff',
//     },
//     buttonText: {
//         fontSize: 16,
//         fontWeight: 'bold',
//         color: '#fff',
//         marginTop: 10,
//     },
//     loader: {
//         marginTop: 20,
//     },
// });

// export default VoiceRecordingScreen;
