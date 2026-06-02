import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import * as ImagePicker from 'expo-image-picker';

const PhotoUploadScreen = ({ navigation, route }) => {
  const [photo, setPhoto] = useState(null);
  const userData = route.params?.userData;
  const isCompany = userData?.role === 'COMPANY';

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission requise', 'Autorisez l\'accès à la galerie');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setPhoto(result.assets[0].uri);
    }
  };

  const handleNext = () => {
    const updatedUserData = { ...userData, profilePhoto: photo };
    if (isCompany && userData?.companyProfile) {
      updatedUserData.companyProfile = {
        ...updatedUserData.companyProfile,
        profilePhoto: photo
      };
    }
    navigation.navigate('EmailVerification', { userData: updatedUserData });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Svg height="100%" width="100%" style={StyleSheet.absoluteFill}>
        <Path
          d="M-50 -50 C 50 -150, 250 -80, 200 100 C 150 200, -50 150, -50 -50 Z"
          fill="#0056FF"
        />
      </Svg>

      <View style={styles.content}>
        <Text style={styles.title}>Photo de profil</Text>
        <Text style={styles.subtitle}>
          {isCompany ? 'Ajoutez le logo de votre entreprise (optionnel)' : 'Ajoutez une photo de profil (optionnel)'}
        </Text>

        <TouchableOpacity style={styles.avatarContainer} onPress={pickImage}>
          {photo ? (
            <Image source={{ uri: photo }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{isCompany ? '🏢' : '👤'}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleNext}>
          <Text style={styles.buttonText}>Continuer</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.cancelText}>Annuler</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden'
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'center',
    alignItems: 'center'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#111'
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 40
  },
  avatarContainer: {
    marginBottom: 40
  },
  avatar: {
    width: 140,
    height: 140,
    borderRadius: 70
  },
  avatarPlaceholder: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#E1F0FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0056FF',
    borderStyle: 'dashed'
  },
  avatarText: {
    fontSize: 60,
    color: '#0056FF'
  },
  button: {
    backgroundColor: '#0056FF',
    paddingVertical: 16,
    paddingHorizontal: 50,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 20
  },
  buttonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16
  },
  cancelText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14
  }
});

export default PhotoUploadScreen;