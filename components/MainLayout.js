import React, { useContext, useState, useCallback  } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, TouchableWithoutFeedback, Modal } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { AppContext } from '../AppContext';
import { useFocusEffect } from '@react-navigation/native';


const MainLayout = ({ children, navigation }) => {
  const { user, setIsLoggedIn } = useContext(AppContext);

  const [isSidebarVisible, setSidebarVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const toggleSidebar = () => {
    setSidebarVisible(!isSidebarVisible);
  };

  const closeSidebar = () => {
    setSidebarVisible(false);
  };

  const navigateToScreen = (screen) => {
    if (screen === 'Logout') {
      closeSidebar();
      setModalVisible(true);
    } else {
      navigation.navigate(screen);
      closeSidebar();
    }
  };
  useFocusEffect(
    useCallback(() => {
      refreshPage();
    }, [])
  );
  const refreshPage = () => {
    console.log('Screen refreshed!');
  };
  const handleLogout = async () => {
    try {
      setIsLoggedIn(false);
      await AsyncStorage.removeItem('userProfile');
      Toast.show({
        text1: 'Logout Successful',
        text2: 'You have been logged out.',
        type: 'success',
      });
      setModalVisible(false);
      navigation.replace('Login');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const menuOptions = [
    { title: 'Home', icon: 'home-outline', screen: 'Home' },
    { title: 'About App', icon: 'information-circle-outline', screen: 'About' },
    // { title: 'Upload Audio', icon: 'musical-notes', screen: 'AudioUpload' },
    // { title: 'Upload Video', icon: 'videocam', screen: 'VideoUpload' },
    { title: 'Profile', icon: 'person', screen: 'My Profile' },
    { title: 'Logout', icon: 'log-out-outline', screen: 'Logout' }
  ];

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.hamburgerMenu} onPress={toggleSidebar}>
        <Ionicons name="menu-outline" size={32} color="black" />
      </TouchableOpacity>

      {isSidebarVisible && (
        <TouchableWithoutFeedback onPress={closeSidebar}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>
      )}

      {isSidebarVisible && (
        <View style={styles.sidebar}>
          {/* <Text style={styles.greetingText}>Hello, {user.fullName}</Text> */}
          <ScrollView>
            {menuOptions.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={styles.menuItem}
                onPress={() => navigateToScreen(option.screen)}>
                <Ionicons name={option.icon} size={24} color="#000" style={styles.icon} />
                <Text style={styles.menuText}>{option.title}</Text>
                <Ionicons name="chevron-forward-outline" size={24} color="#000" style={styles.chevronIcon} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Logout confirmation modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>Are you sure you want to log out?</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelButton}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                <Text style={styles.buttonText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.mainContent}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  hamburgerMenu: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 0,
  },
  sidebar: {
    width: 250,
    backgroundColor: '#f9f9f9',
    padding: 20,
    borderRightWidth: 1,
    borderRightColor: '#ccc',
    position: 'absolute',
    top: 25,
    left: 0,
    height: '100%',
    zIndex: 1,
  },
  greetingText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  icon: {
    marginRight: 10,
  },
  menuText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  chevronIcon: {
    marginLeft: 'auto',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
  },
  modalText: {
    fontSize: 18,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    backgroundColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  logoutButton: {
    backgroundColor: '#f00',
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default MainLayout;
