import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

const AboutScreen = () => {
  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.description}>
          Dear User,{"\n\n"}

          I would like to thank you for downloading and using LetsCalm - Happiness driving mobile application.{"\n\n"}

          LetsCalm is about calming down tense or argumentative situations that can lead to a negative atmosphere. It may be especially important for families during domestic arguments.{"\n\n"}

          Particularly, it can help calm down stressful situations, prevent negative emotions, and bring a more positive atmosphere to families, workplaces, and people's relationships in general.{"\n\n"}

          This application has a great potential to save marriages, friendships, and other types of relationships. It has all the potential to change people’s lives for the better.{"\n\n"}

          A preventive or distraction algorithm of LetsCalm solves real problems in real-time human relations. LetsCalm stays alert for any peaks of emotions to cautiously interfere based on its behavior preset.{"\n\n"}

          When a peak is detected based on user settings or default anger management policies/algorithms, a distraction is enabled.{"\n\n"}

          Distractions can be customized and can actually be anything from a soothing tune or the user's kid's voice to a riddle or a joke, randomly selected and read out by LetsCalm's smart algorithm.{"\n\n"}

          Please go ahead and use application settings to preset your preferred song, audio, or video media to play and calm down the negative atmosphere.{"\n\n"}

          Copyright © LetsCalm.com LLC Proprietary. All rights reserved.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    marginTop: 30,
    padding: 20,
  },
  description: {
    fontSize: 16,
    textAlign: 'left',
    marginTop: 20,
    lineHeight: 24,
  },
});
export default AboutScreen;