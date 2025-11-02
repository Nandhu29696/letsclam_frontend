import { Audio } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import React, { useContext, useEffect, useRef, useState } from 'react';
import {
    Alert, Switch, Platform,
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View, ActivityIndicator
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { AppContext } from '../../../AppContext';
import { AntDesign, FontAwesome } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system'
import Toast, { BaseToast, ErrorToast } from 'react-native-toast-message';

// ✅ Toast configuration
const toastConfig = {
    success: (props) => (
        <BaseToast
            {...props}
            style={{ borderLeftColor: '#22c55e' }}
            contentContainerStyle={{ paddingHorizontal: 15 }}
            text1Style={{ fontSize: 15, fontWeight: '600' }}
        />
    ),
    error: (props) => (
        <ErrorToast
            {...props}
            style={{ borderLeftColor: '#ef4444' }}
            text1Style={{ fontSize: 15, fontWeight: '600' }}
            text2Style={{ fontSize: 13 }}
        />
    ),
};

const AudioUpload = () => {
    const { user, userToken, setIsLoggedIn, apiUrl } = useContext(AppContext);
    const token = userToken;
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [file, setFile] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [audioFiles, setAudioFiles] = useState([]);
    const [sentiments, setSentiments] = useState([]);
    const [editingAudioId, setEditingAudioId] = useState(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const sound = useRef(null);
    const webAudio = useRef(null);
    const [playingAudioId, setPlayingAudioId] = useState(null); // State to track the currently playing audio
    const [isGeneric, setIsGeneric] = useState(false);
    const [selectedSentiment, setSelectedSentiment] = useState('happy');
    const [filterSentiment, setfilterSentiment] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchSentiments = async () => {
        try {
            const response = await fetch(`${apiUrl}/api/voice/getsentimenttypes`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (data && Array.isArray(data)) {
                setSentiments(data);
            } else {
                Alert.alert('Error', 'Invalid data format');
            }
        } catch (error) {
            Alert.alert('Error', `Failed to load data: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const fetchAudioFiles = async () => {
        const response = await fetch(`${apiUrl}/api/voice/audio/all/${user.userID}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });
        if (response.ok) {
            const data = await response.json();
            setAudioFiles(data);
            setFilteredAudioFiles(data)
        } else {
            // //console.error('Failed to fetch audio files. Status:', response.status);
            setAudioFiles([]);
        }
    };

    useEffect(() => {
        fetchAudioFiles();
        fetchSentiments();
    }, []);

    const selectFile = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'audio/*',
            });
            if (result) {
                setFile(result.assets[0]);
            }
        } catch (error) {
            // //console.error("Error picking file:", error);
        }
    };

    function getFileExtension(filename) {
        const parts = filename.split('.');
        return parts.length > 1 ? parts.pop() : '';
    }

    const uploadFile = async () => {
        if (!file || !title || !description) {
            Toast.show({
                type: 'error',
                text1: 'Missing Fields',
                text2: 'Please fill in all fields and select a file.',
                position: 'top',
            });
            return;
        }

        const formData = new FormData();

        if (Platform.OS === 'web') {
            const response = await fetch(file.uri);
            const blob = await response.blob(); // Convert URI to Blob
            formData.append("file", blob, file.name);
        } else {
            // 📱 React Native: Use uri-based file object
            formData.append("file", {
                uri: file.uri,
                name: file.name,
                type: file.mimeType,
            });
        }
        formData.append("title", title);
        formData.append("description", description);
        formData.append("sentiment_type", selectedSentiment);
        formData.append("is_generic", isGeneric);
        formData.append("audio_type", getFileExtension(file.name));

        const requestOptions = {
            method: 'POST',
            headers: {
                "Authorization": `Bearer ${token}`,
                ...(Platform.OS === 'web' ? {} : { "Content-Type": "multipart/form-data" }) // Web handles `Content-Type` automatically
            },
            body: formData,
        };

        try {
            const response = await fetch(`${apiUrl}/api/voice/upload-audio`, requestOptions);
            if (response.ok) {
                const data = await response.json();
                setModalVisible(false);
                Toast.show({
                    text1: 'File uploaded successfully!',
                    type: 'success',
                });
            } else {
                Toast.show({
                    type: 'error',
                    text1: 'File upload Failed',
                    text2: 'File size may be too large or invalid format.',
                    position: 'top',
                    visibilityTime: 4000,
                });
            }

            fetchAudioFiles();
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'File upload Failed',
                text2: 'File size may be too large or invalid format.',
                position: 'top',
                visibilityTime: 4000,
            });
        }
    };

    useEffect(() => {
        return () => {
            if (sound.current && typeof sound.current.unloadAsync === "function") {
                sound.current.unloadAsync().catch((err) => {
                    console.error("Error unloading sound on unmount:", err);
                });
            }
        };
    }, []);

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
                if (webAudio.current) {
                    webAudio.current.pause(); // stop playback
                    webAudio.current.currentTime = 0; // reset time
                    URL.revokeObjectURL(webAudio.current.src); // cleanup URL
                    webAudio.current = null; // clear reference
                }

                setPlayingAudioId(null);
                setIsLoaded(false);
                return;
            }

            // --- ✅ Native (Android / iOS) ---
            if (sound.current) {
                const currentSound = sound.current;

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

                sound.current = null;
            }

            setPlayingAudioId(null);
            setIsLoaded(false);
        } catch (error) {
            console.log("Error stopping sound safely:", error);
        }
    };


    const renderAudioItem = ({ item }) => (
        <View style={styles.tableRow}>
            <Text style={[styles.cell, styles.titleHeader]}>{item.title}</Text>
            <Text style={[styles.cell, styles.sentimentheader]}>{item.sentiment_type}</Text>
            <Text style={[styles.cell, styles.descriptionHeader]}>{item.description}</Text>
            <View style={styles.actionsCell}>
                <TouchableOpacity onPress={() => handleEdit(item)} style={styles.actionButton}>
                    <AntDesign name="edit" size={15} color="#029fe4" />
                </TouchableOpacity>
                {/* <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.actionButton}>
                    <AntDesign name="delete" size={15} color="red" />
                </TouchableOpacity> */}
                {playingAudioId === item.id ? ( // Check if the current audio is playing
                    <TouchableOpacity onPress={stopSound} style={styles.actionButton}>
                        <Icon name="stop" size={15} color="red" />
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity onPress={() => playSound(item.file_name, item.id)} style={styles.actionButton}>
                        <Icon name="play-circle-outline" size={15} color="green" />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
    const getFileNameFromUrl = (url) => {
        return url.substring(url.lastIndexOf('/') + 1);
    };
    const getMimeTypeFromUrl = (url) => {
        const extension = url.substring(url.lastIndexOf('.') + 1).toLowerCase();
        const mimeTypes = {
            mp3: 'audio/mpeg',
            wav: 'audio/wav',
            m4a: 'audio/mp4',
        };
        return mimeTypes[extension] || 'application/octet-stream';
    };

    const handleEdit = (audio) => {
        setEditingAudioId(audio.id);
        setTitle(audio.title);
        setDescription(audio.description);
        setIsGeneric(audio.is_generic)
        setSelectedSentiment(audio.sentiment_type)
        setFile({
            uri: audio.file_url,
            name: getFileNameFromUrl(audio.file_url),
            type: getMimeTypeFromUrl(audio.file_url),
        });
        setModalVisible(true);
    };

    const updateAudio = async () => {
        if (!file || !title || !description) {
            Alert.alert('Error', 'Please fill in all fields and select a file.');
            return;
        }
        const formData = new FormData();
        formData.append("title", title);
        formData.append("description", description);
        formData.append("sentiment_type", selectedSentiment);
        formData.append("is_generic", isGeneric);

        const requestOptions = {
            method: 'PUT',
            headers: {
                "Authorization": `Bearer ${token}`
            },
            body: formData,
        };
        try {
            const response = await fetch(`${apiUrl}/api/voice/audio/edit/${editingAudioId}`, requestOptions);
            if (response.ok) {
                const data = await response.json();
                setModalVisible(false);
                Toast.show({
                    text1: 'Audio updated successfully!',
                    type: 'success',
                });
            }
            else {
                Toast.show({
                    type: 'error',
                    text1: 'File upload Failed',
                    text2: 'Please check your internet or try again later.',
                    position: 'top',
                    visibilityTime: 4000,
                });
            }
            fetchAudioFiles();
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'File upload Failed',
                text2: 'Please check your internet or try again later.',
                position: 'top',
                visibilityTime: 4000,
            });
        }
    }

    const [filteredAudioFiles, setFilteredAudioFiles] = useState([])
    const handleSentimentChange = (selectedValue) => {
        setSelectedSentiment(selectedValue);
        if (selectedValue === "All") {
            setFilteredAudioFiles(audioFiles);
        } else {
            // Filter based on selected sentiment type
            const filteredData = audioFiles.filter(
                (item) => item.sentiment_type === selectedValue
            );
            setFilteredAudioFiles(filteredData);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.subContainer}>
                <Text style={styles.title}>Manage Audio Files</Text>
                <TouchableOpacity
                    style={styles.createButton}
                    onPress={() => {
                        setModalVisible(true);
                        setEditingAudioId(null);
                        setTitle('');
                        setDescription('');
                        setFile(null);
                    }}>
                    <Icon name="add" size={24} color="#fff" />
                </TouchableOpacity>
            </View>
            {/* Sentiment Filter */}
            <View style={styles.filterContainer}>
                <Text style={styles.labelFilter}>Filter by Sentiment:</Text>
                <View style={styles.pickerWrapper}>
                    <Picker
                        selectedValue={selectedSentiment}
                        onValueChange={handleSentimentChange}
                        style={styles.picker}>
                        <Picker.Item label="All" value="All" style={styles.pickerValue} />
                        {sentiments.map((sentiment, index) => (
                            <Picker.Item key={index} label={sentiment.sentiment_type} value={sentiment.sentiment_type} style={styles.pickerValue} />
                        ))}
                    </Picker>
                </View>
            </View>
            <View style={styles.tableHeader}>
                <Text style={[styles.headerCell, styles.titleHeader]}>Title</Text>
                <Text style={[styles.headerCell, styles.sentimentheader]}>Sentiment</Text>
                <Text style={[styles.headerCell, styles.descriptionHeader]}>Description</Text>
                <Text style={[styles.headerCell, styles.actionsHeader]}>Actions</Text>
            </View>
            <View style={styles.fixedListContainer}>
                <FlatList
                    data={filteredAudioFiles}
                    renderItem={renderAudioItem}
                    keyExtractor={(item) => item.id.toString()}
                    style={styles.table}
                />
            </View>
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)} >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalView}>
                        <Text style={styles.modalTitle}>
                            {editingAudioId ? 'Edit Audio' : 'Upload Audio'}
                        </Text>

                        <TouchableOpacity style={styles.fileUploadButton} onPress={selectFile}>
                            <FontAwesome name="upload" size={20} color="#fff" style={{ marginRight: 10 }} />
                            <Text style={styles.fileUploadText}>
                                {file ? `Selected: ${file.name}` : 'Select Audio File'}
                            </Text>
                        </TouchableOpacity>

                        {file && (
                            <View style={styles.fileInfoCard}>
                                <FontAwesome name="file-audio-o" size={30} color="#1E90FF" />
                                <View style={styles.fileDetails}>
                                    <Text style={styles.fileName}>{file.name}</Text>
                                    <Text style={styles.fileMeta}>MIME: {file.mimeType}</Text>
                                    <Text style={styles.fileMeta}>Size: {(file.size / 1024).toFixed(2)} KB</Text>
                                </View>
                            </View>
                        )}

                        <TextInput
                            style={styles.input}
                            placeholder="Title"
                            value={title}
                            onChangeText={setTitle}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Description"
                            value={description}
                            onChangeText={setDescription}
                        />
                        <View style={styles.checkboxContainer}>
                            <Text style={styles.checkboxLabel}>Is Generic:</Text>
                            <Switch
                                value={isGeneric}
                                onValueChange={setIsGeneric}
                            />
                        </View>
                        <View style={styles.controlItem}>
                            <Text style={styles.label}>Select Sentiment:</Text>
                            <View style={styles.pickerWrapper}>
                                {loading ? (
                                    <ActivityIndicator size="small" color="#029fe4" />
                                ) : (
                                    <Picker
                                        selectedValue={selectedSentiment}
                                        onValueChange={(itemValue) => setSelectedSentiment(itemValue)}
                                        style={styles.picker}
                                        mode="dropdown" >
                                        {sentiments.map((sentiment, index) => (
                                            <Picker.Item
                                                key={index}
                                                label={sentiment.sentiment_type || sentiment}
                                                value={sentiment.sentiment_type || sentiment}
                                                style={styles.pickerValue}
                                            />
                                        ))}
                                    </Picker>
                                )}
                            </View>
                        </View>
                        <View style={styles.btnContainer}>
                            <TouchableOpacity style={styles.button} onPress={editingAudioId ? updateAudio : uploadFile}>
                                <Text style={styles.buttonText}>
                                    {editingAudioId ? 'Update' : 'Upload'}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Text style={styles.closeButton}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
                {/* ✅ Toast container must be rendered inside component tree */}
                <Toast config={toastConfig} />
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 10,
        backgroundColor: '#fff',
    },
    subContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    title: {
        fontSize: 20,
        width: '60%',
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
    },
    fixedListContainer: {
        height: 300,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        marginBottom: 20,
        overflow: 'hidden',
    },
    header: {
        fontWeight: 'bold',
        fontSize: 12,
        width: '30%',
    },
    createButton: {
        backgroundColor: '#029fe4',
        padding: 5,
        width: '10%',
        borderRadius: 5,
        alignItems: 'center',
        marginBottom: 10,
        alignSelf: 'flex-start',
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#f0f0f0',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    tableRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    headerCell: {
        fontWeight: 'bold',
        paddingHorizontal: 8,
        textAlign: 'left',
        fontSize: 12, // Reduced font size for header
    },
    titleHeader: {
        flex: 2,
    },
    sentimentheader: {
        flex: 2,
    },
    descriptionHeader: {
        flex: 2.5,
    },
    actionsHeader: {
        flex: 2,
        textAlign: 'center',
    },
    cell: {
        paddingHorizontal: 7,
        textAlign: 'left',
        fontSize: 11, // Reduced font size for table data
    },

    actionsCell: {
        flex: 2,
        flexDirection: 'row',
        justifyContent: 'center',
    },
    actionButton: {
        marginHorizontal: 5,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        alignItems: 'center',
    },
    fileName: {
        width: '30%',
    },
    audioFileName: {
        width: '50%',
        textAlign: 'center'
    },
    iconContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '20%',
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end', // Align modal at the bottom
        backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
    },
    modalView: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 5, // Shadow effect for Android
    },

    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 15,
        textAlign: 'center',
    },
    btnContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 20,
        gap: 15,
    },
    button: {
        backgroundColor: '#029fe4',
        padding: 10,
        borderRadius: 5,
        marginVertical: 5,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
    },
    input: {
        height: 45,
        borderColor: '#ddd',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 10,
        marginBottom: 10,
    },
    closeButton: {
        backgroundColor: 'red',
        padding: 10,
        borderRadius: 5,
        marginVertical: 5,
        color: '#fff',
        textAlign: 'center',
        fontSize: 16,
    },
    fileUploadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1E90FF',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
        marginBottom: 15,
    },

    fileUploadText: {
        color: '#fff',
        fontSize: 14,
        padding: 5,
        fontWeight: '600',
    },

    fileInfoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f9f9f9',
        padding: 10,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
        marginTop: 5,
        marginBottom: 10
    },

    fileDetails: {
        marginLeft: 10,
        flex: 1,
    },

    fileName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 5,
    },

    fileMeta: {
        fontSize: 14,
        color: '#555',
    },

    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    checkboxLabel: {
        marginRight: 10,
        fontSize: 16,
    },
    controlItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    label: {
        fontSize: 16,
        color: '#333',
    },
    filterContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 8,
        paddingHorizontal: 16,
    },
    labelFilter: {
        fontSize: 13,
        fontWeight: '600',
        color: '#333',
        marginRight: 10,
    },
    pickerWrapper: {
        width: 200, // reduced width
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ccc',
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    picker: {
        height: 30, // reduced height
        width: '100%',
        color: '#333',
        fontSize: 12,
        paddingHorizontal: 6,
    },
    pickerValue: {
        fontSize: 14,
    },
});

export default AudioUpload;
