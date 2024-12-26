import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SidebarScreen = ({ navigation }) => {
  const [isSidebarVisible, setSidebarVisible] = useState(false);

  const toggleSidebar = () => {
    setSidebarVisible(!isSidebarVisible);
  };

  const closeSidebar = () => {
    setSidebarVisible(false);
  };

  const menuOptions = [
    { title: 'Home', icon: 'home-outline', screen: 'Home' },
    { title: 'About App', icon: 'information-circle-outline', screen: 'About' },
  ];

  const navigateToScreen = (screen) => {
    navigation.navigate(screen);
    closeSidebar();
  };

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
          <Text style={styles.greetingText}>Hello User!</Text>
          <ScrollView>
            {menuOptions.map((option, index) => (
              <TouchableOpacity key={index} style={styles.menuItem} onPress={() => navigateToScreen(option.screen)}>
                <Ionicons name={option.icon} size={24} color="#000" style={styles.icon} />
                <Text style={styles.menuText}>{option.title}</Text>
                <Ionicons name="chevron-forward-outline" size={24} color="#000" style={styles.chevronIcon} />
              </TouchableOpacity>
            ))}
          </ScrollView>
          <Text style={styles.versionText}>Version 1.1</Text>
        </View>
      )}

      <View style={styles.mainContent}>
        <Text style={styles.mainContentText}>Your main content goes here.</Text>
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
    top: 0,
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
  versionText: {
    marginTop: 20,
    fontSize: 14,
    color: '#888',
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainContentText: {
    fontSize: 24,
  },
});

export default SidebarScreen;
