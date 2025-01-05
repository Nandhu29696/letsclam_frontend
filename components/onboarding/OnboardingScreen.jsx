import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions } from 'react-native';
import LottieView from 'lottie-react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const onboardingData = [
  {
    id: 1,
    title: 'LetsCalm',
    description: 'Stops Conflict-Promotes Happiness. This Application improves your quality of life by fostering healthier interpersonal relationships.',
    animationName: require('../../assets/json/anim1.json'),
    buttonColor: '#FFD700',
    buttonTitle: 'Next',
  },
  {
    id: 2,
    title: 'Calm down tense or argumentative situations',
    description: 'LetsCalm aids in calming down tense or argumentative situations that can create a negative atmosphere in any environment.',
    animationName: require('../../assets/json/anim2.json'),
    buttonColor: '#FFD700',
    buttonTitle: 'Next',
  },
  {
    id: 3,
    title: 'Calm down stressful situations',
    description: 'The Application aids in promoting healthier interpersonal relationships. This has potential to change people\'s lives for the better.',
    animationName: require('../../assets/json/anim3.json'),
    buttonColor: '#FFD700',
    buttonTitle: 'Next',
  },
  {
    id: 4,
    title: 'A preventive or distraction algorithm of LetsCalm',
    description: 'A proprietary algorithm of LetsCalm developed by our scientists and engineers stays alert to detect peaks of emotions and cautiously interferes based on the tone detected.',
    animationName: require('../../assets/json/anim4.json'),
    buttonColor: '#FFD700',
    buttonTitle: 'Get Started',
  },
];

const OnboardingScreen = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef(null);
  const navigation = useNavigation();

  const [outText, setOutText] = useState(null);
  const fetchData = async () => {
    try {
      const response = await fetch('https://testapi12.free.beeceptor.com')
      if (response.ok) {
        const data = await response.text();
        setOutText(data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleNext = async () => {
    if (currentIndex < onboardingData.length - 1) {
      scrollViewRef.current.scrollTo({ x: (currentIndex + 1) * width, animated: true });
      setCurrentIndex(currentIndex + 1);
    } else {
      navigateToAppropriateScreen();
    }
  };

  const handleSkip = async () => {
    await navigateToAppropriateScreen();
  };

  const navigateToAppropriateScreen = async () => {
    const userToken = await AsyncStorage.getItem('userToken');
    if (userToken) {
      navigation.replace('Home');
    } else {
      navigation.replace('Login');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipButtonText}>Skip</Text>
      </TouchableOpacity>

      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {onboardingData.map((item, index) => (
          <View key={index} style={styles.slide}>
            <LottieView
              source={item.animationName}
              autoPlay
              loop
              style={styles.animation}
            />
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.description}>{item.description}</Text>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: item.buttonColor }]}
              onPress={handleNext} >
              <Text style={styles.buttonText}>{item.buttonTitle}</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      <View style={styles.dotsContainer}>
        {onboardingData.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              currentIndex === index ? styles.activeDot : styles.inactiveDot,
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  slide: {
    width: width,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  animation: {
    width: '100%',
    height: height * 0.4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
  },
  button: {
    width: '90%',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 20,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  activeDot: {
    backgroundColor: '#FFD700',
  },
  inactiveDot: {
    backgroundColor: '#ccc',
  },
  skipButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    padding: 10,
    zIndex: 1,
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007bff',
  },
});

export default OnboardingScreen;
