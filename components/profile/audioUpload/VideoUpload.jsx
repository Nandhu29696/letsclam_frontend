import { AntDesign, FontAwesome } from '@expo/vector-icons'; // Import icon library
import { Video } from 'expo-av'; // Import Video from expo-av
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { Alert, FlatList, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { LinearProgress, Switch } from 'react-native-elements';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { AppContext } from '../../../AppContext';
import Toast from 'react-native-toast-message';
import { ActivityIndicator } from 'react-native-web';
import { Picker } from '@react-native-picker/picker';


const VideoUpload = () => {
    const { user, setIsLoggedIn, apiUrl } = useContext(AppContext);
    const token = user.token.access;
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [file, setFile] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [videoFiles, setVideoFiles] = useState([]);
    const [editingVideoId, setEditingVideoId] = useState(null);
    const [videoUri, setVideoUri] = useState(null);
    const [playingVideoId, setPlayingVideoId] = useState(null);
    const videoRef = useRef(null);
    const [loading, setLoading] = useState(false); // State for loading indicator
    const [isGeneric, setIsGeneric] = useState(false);
    const [selectedSentiment, setSelectedSentiment] = useState('');
    const [sentiments, setSentiments] = useState([]);

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

    const fetchVideoFiles = async () => {
        try {
            const response = await fetch(`${apiUrl}/api/voice/video/all/${user.userID}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setVideoFiles(data);
            } else {
                setVideoFiles([])
            }

        } catch (error) {
            //console.error('Error fetching videos:', error);
        }
    };

    useEffect(() => {
        fetchVideoFiles();
        fetchSentiments();
    }, []);

    const selectFile = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: "video/*",
            });
            if (result) {
                const selectedFile = result.assets[0];
                setFile(selectedFile);
            }
        } catch (error) {
            //console.error('Error picking file:', error);
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
        formData.append('title', title);
        formData.append('description', description);
        formData.append("sentiment_type", selectedSentiment);
        formData.append("is_generic", isGeneric);
        formData.append("video_type", getFileExtension(file.name));
        const requestOptions = {
            method: 'POST',
            headers: {
                "Authorization": `Bearer ${token}`
            },
            body: formData,
        };
        try {
            const response = await fetch(`${apiUrl}/api/voice/upload-video`, requestOptions);
            if (response.ok) {
                Toast.show({
                    text1: 'File uploaded successfully!',
                    type: 'success',
                });
                fetchVideoFiles();
                setModalVisible(false);
            } else {
                Alert.alert('Error', 'File upload failed!');
            }
        } catch (error) {
            //console.error('Error uploading file:', error);
            Alert.alert('Error', 'Error uploading file.');
        }
    };

    const playVideo = async (videoPath, id) => {
        const cacheFilePath = `${FileSystem.cacheDirectory}temp-video.mp4`;
        setLoading(true);

        let payload = {
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
            if (response.ok) {
                const blob = await response.blob();
                const fileReader = new FileReader();
                fileReader.onload = async () => {
                    const base64data = fileReader.result.split(',')[1];
                    await FileSystem.writeAsStringAsync(cacheFilePath, base64data, {
                        encoding: FileSystem.EncodingType.Base64,
                    });
                    //console.log('File saved at:', cacheFilePath);
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

    useEffect(() => {
        return () => {
            if (videoRef.current) {
                videoRef.current.unloadAsync().catch((err) =>
                    console.error('Error unloading video on unmount:', err)
                );
            }
        };
    }, []);

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
    const handleEdit = (video) => {
        setEditingVideoId(video.id);
        setTitle(video.title);
        setDescription(video.description);
        setSelectedSentiment(audio.sentiment_type)
        setIsGeneric(video.is_generic)
        setFile({
            uri: video.file_url,
            name: getFileNameFromUrl(video.file_url),
            type: getMimeTypeFromUrl(video.file_url),
        });
        setModalVisible(true);
    };

    const renderVideoItem = ({ item }) => (
        <View style={styles.tableRow}>
            <Text style={[styles.cell, styles.titleCell]}>{item.title}</Text>
            <Text style={[styles.cell, styles.descriptionCell]}>{item.description}</Text>
            <View style={styles.actionsCell}>
                {/* <TouchableOpacity onPress={() => handleEdit(item)} style={styles.actionButton}>
                    <AntDesign name="edit" size={15} color="#007bff" />
                </TouchableOpacity> */}
                {playingVideoId === item.id ? (
                    <TouchableOpacity onPress={() => stopVideo()} style={styles.actionButton}>
                        <Icon name="stop" size={15} color="red" />
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        onPress={() => playVideo(item.file_name, item.id)}
                        style={styles.actionButton}
                    >
                        <Icon name="play-circle-outline" size={15} color="green" />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.subContainer}>
                <Text style={styles.title}>Manage Video Files</Text>
                <TouchableOpacity
                    style={styles.createButton}
                    onPress={() => {
                        setModalVisible(true);
                        setTitle('');
                        setDescription('');
                        setFile(null);
                    }}
                >
                    <Icon name="add" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            <View style={styles.tableHeader}>
                <Text style={[styles.headerCell, styles.titleHeader]}>Title</Text>
                <Text style={[styles.headerCell, styles.descriptionHeader]}>Description</Text>
                <Text style={[styles.headerCell, styles.actionsHeader]}>Actions</Text>
            </View>
            <View style={styles.fixedListContainer}>
                <FlatList
                    data={videoFiles}
                    renderItem={renderVideoItem}
                    keyExtractor={(item) => item.id.toString()}
                    style={styles.table}
                />
            </View>
            <Modal animationType="slide" transparent={true} visible={modalVisible}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalView}>
                        <Text style={styles.modalTitle}>Upload Video</Text>
                        <TouchableOpacity style={styles.fileUploadButton} onPress={selectFile}>
                            <FontAwesome name="upload" size={20} color="#fff" style={{ marginRight: 10 }} />
                            <Text style={styles.fileUploadText}>
                                {file ? `Selected: ${file.name}` : 'Select Video File'}
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
                                    <ActivityIndicator size="small" color="#007bff" />
                                ) : (
                                    <Picker
                                        selectedValue={selectedSentiment}
                                        onValueChange={(itemValue) => setSelectedSentiment(itemValue)}
                                        style={styles.picker}
                                        mode="dropdown"
                                    >
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
                            <TouchableOpacity style={styles.button} onPress={uploadFile}>
                                <Text style={styles.buttonText}>
                                    {editingVideoId ? 'Update' : 'Upload'}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Text style={styles.closeButton}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {videoUri && (
                <Modal animationType="slide" transparent={false} visible={!!videoUri}>
                    <View style={styles.videoContainer}>
                        {loading && <LinearProgress color="green" style={styles.progressBar} />}

                        <Video
                            ref={videoRef}
                            source={{ uri: videoUri }}
                            style={styles.video}
                            useNativeControls
                            resizeMode="contain"
                            shouldPlay
                            onLoadStart={() => setLoading(true)}
                            onReadyForDisplay={() => setLoading(false)}
                        />
                        <TouchableOpacity style={styles.stopButton} onPress={stopVideo}>
                            <Text style={styles.stopButtonText}>Stop Video</Text>
                        </TouchableOpacity>
                    </View>
                </Modal>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    videoContainer: {
        flex: 1,
        justifyContent: 'center',
        display: 'flex',
        alignItems: 'center',
        backgroundColor: '#000',
    },
    video: {
        width: '100%',
        height: '80%',
    },
    closeButton: {
        padding: 10,
        backgroundColor: 'red',
        marginTop: 20,
        borderRadius: 5,
    },
    closeButtonText: {
        color: '#fff',
        textAlign: 'center',
        fontSize: 16,
    },
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
    fixedListContainer: {
        height: 200, // Set a fixed height for the list
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
        width: '50px'
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
    loader: {
        position: 'absolute',
        zIndex: 1,
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    checkboxLabel: {
        marginRight: 10,
        fontSize: 16,
    }, pickerWrapper: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        overflow: 'hidden',
        width: 190,
        justifyContent: 'center',
    }, label: {
        fontSize: 16,
        color: '#333',
    },
    picker: {
        width: '100%',
    },
    pickerValue: {
        fontSize: 12,
    }
});

export default VideoUpload;
