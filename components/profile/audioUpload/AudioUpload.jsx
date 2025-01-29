import { Audio } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import React, { useContext, useEffect, useState } from 'react';
import {
    Alert, Switch,
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { AppContext } from '../../../AppContext';
import { AntDesign, FontAwesome } from '@expo/vector-icons'; // Import icon library
import * as FileSystem from 'expo-file-system'
import Toast from 'react-native-toast-message';

const AudioUpload = () => {
    const { user, setIsLoggedIn, apiUrl } = useContext(AppContext);
    const token = user.token.access;
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [file, setFile] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [audioFiles, setAudioFiles] = useState([]);
    const [editingAudioId, setEditingAudioId] = useState(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const sound = React.useRef(new Audio.Sound());
    const [playingAudioId, setPlayingAudioId] = useState(null); // State to track the currently playing audio
    const [isGeneric, setIsGeneric] = useState(false);

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
        } else {
            console.error('Failed to fetch audio files. Status:', response.status);
            setAudioFiles([]);
        }
    };

    useEffect(() => {
        fetchAudioFiles();
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
            console.error("Error picking file:", error);
        }
    };
    function getFileExtension(filename) {
        const parts = filename.split('.');
        return parts.length > 1 ? parts.pop() : '';
    }
    const uploadFile = async () => {
        if (!file || !title || !description) {
            Alert.alert('Error', 'Please fill in all fields and select a file.');
            return;
        }
        const formData = new FormData();
        formData.append("file", {
            uri: file.uri,
            name: file.name,
            type: file.mimeType,
        });
        formData.append("title", title);
        formData.append("description", description);
        formData.append("is_generic", isGeneric);
        formData.append("audio_type", getFileExtension(file.name));

        const requestOptions = {
            method: 'POST',
            headers: {
                "Authorization": `Bearer ${token}`
            },
            body: formData,
        };
        try {
            const response = await fetch(`${apiUrl}/api/voice/upload-audio`, requestOptions);
            if (response.ok) {
                const data = await response.json();
                console.log('data', data);
                setModalVisible(false);
                Toast.show({
                    text1: 'File uploaded successfully!',
                    type: 'success',
                });
            }
            else {
                Alert.alert('error', 'File upload failed!');
            }
            fetchAudioFiles();
        } catch (error) {
            console.error('Error uploading file:', error.message);
            Alert.alert('Error', 'Error uploading file.');
        }
    };

    const playSound = async (audioPath, id) => {
        const cacheFilePath = `${FileSystem.cacheDirectory}temp-audio.mp3`;
        console.log('audioPath', audioPath);

        let payload = {
            file_path: `audio/${audioPath}`,
        };

        const requestOptions = {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(payload),
        };

        try {
            // Clear the cache file if it exists
            const fileInfo = await FileSystem.getInfoAsync(cacheFilePath);
            if (fileInfo.exists) {
                await FileSystem.deleteAsync(cacheFilePath, { idempotent: true });
            }

            // Fetch the audio file from the API
            const response = await fetch(`${apiUrl}/api/voice/audio/play`, requestOptions);
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
                            console.error('Error unloading sound:', err);
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
                        console.error('Error playing sound:', err);
                    }
                };

                fileReader.readAsDataURL(blob);
            } else {
                console.error('Error fetching audio file:', response.status);
            }
        } catch (error) {
            console.error('Error playing sound:', error);
        }
    };

    useEffect(() => {
        return () => {
            sound.current.unloadAsync().catch((err) =>
                console.error('Error unloading sound on unmount:', err)
            );
        };
    }, []);
    const stopSound = async () => {
        try {
            await sound.current.stopAsync();
            setIsLoaded(false);
            setPlayingAudioId(null); // Reset the currently playing audio ID
        } catch (error) {
            console.error("Error stopping sound:", error);
        }
    };
    const renderAudioItem = ({ item }) => (
        <View style={styles.tableRow}>
            <Text style={[styles.cell, styles.titleCell]}>{item.title}</Text>
            <Text style={[styles.cell, styles.descriptionCell]}>{item.description}</Text>
            <View style={styles.actionsCell}>
                <TouchableOpacity onPress={() => handleEdit(item)} style={styles.actionButton}>
                    <AntDesign name="edit" size={15} color="#007bff" />
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
        setFile({
            uri: audio.file_url,
            name: getFileNameFromUrl(audio.file_url), 
            type: getMimeTypeFromUrl(audio.file_url),  
        });
        setModalVisible(true);
    };

    return (
        <View style={styles.container}>
            <View style={styles.subContainer}>
                <Text style={styles.title}>Uploaded Audio Files</Text>
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

            <View style={styles.tableHeader}>
                <Text style={[styles.headerCell, styles.titleHeader]}>Title</Text>
                <Text style={[styles.headerCell, styles.descriptionHeader]}>Description</Text>
                <Text style={[styles.headerCell, styles.actionsHeader]}>Actions</Text>
            </View>

            <FlatList
                data={audioFiles}
                renderItem={renderAudioItem}
                keyExtractor={(item) => item.id.toString()}
                style={styles.table}
            />

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
                        <View style={styles.btnContainer}>
                            <TouchableOpacity style={styles.button} onPress={uploadFile}>
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
            </Modal>

        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
    },
    subContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 20,
        width: '70%',
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
    header: {
        fontWeight: 'bold',
        fontSize: 12,
        width: '30%',
    },
    createButton: {
        backgroundColor: '#007bff',
        padding: 5,
        width: '10%',
        borderRadius: 5,
        alignItems: 'center',
        marginBottom: 10,
        alignSelf: 'flex-start',
    },
    tableHeader: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        paddingVertical: 10,
    },
    headerCell: {
        fontWeight: 'bold',
        fontSize: 14,
    },
    titleHeader: {
        flex: 2,
    },
    descriptionHeader: {
        flex: 3,
    },
    actionsHeader: {
        flex: 1,
        textAlign: 'center',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        paddingVertical: 12,
        alignItems: 'center',
    },
    cell: {
        fontSize: 14,
    },
    titleCell: {
        flex: 2,
    },
    descriptionCell: {
        flex: 3,
    },
    actionsCell: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-around',
        gap: 5
    },
    actionButton: {
        padding: 5,
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
        backgroundColor: '#007bff',
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
});

export default AudioUpload;
