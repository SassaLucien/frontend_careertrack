import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, TextInput, Alert } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { register } from '../services/api';

const EmailVerificationScreen = ({ navigation, route }) => {
  const [code, setCode] = useState('');
  const [sentCode, setSentCode] = useState(null);
  const [loading, setLoading] = useState(false);

  const userData = route.params?.userData;

  const handleReceiveCode = () => {
    const fakeCode = '1234';
    setSentCode(fakeCode);
    Alert.alert('Code de vérification', `Votre code est: ${fakeCode}`, [{ text: 'OK' }]);
  };

  const handleVerify = async () => {
    if (code !== sentCode) {
      Alert.alert('Erreur', 'Code invalide. Veuillez réessayer.');
      return;
    }

    setLoading(true);

    const userForNavigation = {
      email: userData?.email,
      role: userData?.role,
      firstName: userData?.profile?.firstName || userData?.teacherProfile?.firstName || userData?.companyProfile?.companyName || '',
      lastName: userData?.profile?.lastName || userData?.teacherProfile?.lastName || ''
    };

    try {
      const registerData = {
        email: userData?.email,
        password: userData?.password,
        phone: userData?.phone,
        role: userData?.role,
        profilePhoto: userData?.profilePhoto,
        profile: userData?.profile,
        teacherProfile: userData?.teacherProfile,
        companyProfile: userData?.companyProfile
      };

      const result = await register(registerData);
      console.log('register result:', result);

      if (result.success && result.user) {
        const finalUser = { ...userForNavigation, ...result.user };
        console.log('Navigating to MainTabs/Profil with user:', finalUser);

        // Navigation vers MainTabs avec Profil comme écran cible
        navigation.navigate('MainTabs', {
          screen: 'Profil',
          params: {
            user: finalUser,
            profilePhoto: userData?.profilePhoto
          }
        });
      }
    } catch (error) {
      console.log('Registration error:', error);
      Alert.alert('Erreur', 'Échec de l\'inscription');
    } finally {
      setLoading(false);
    }
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
        <Text style={styles.title}>Vérification Email</Text>
        <Text style={styles.subtitle}>Entrez le code envoyé à votre email</Text>

        <TouchableOpacity style={styles.codeButton} onPress={handleReceiveCode}>
          <Text style={styles.codeButtonText}>Recevoir le code</Text>
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          placeholder="Entrez le code de vérification"
          placeholderTextColor="#999"
          value={code}
          onChangeText={setCode}
          keyboardType="numeric"
        />

        <TouchableOpacity
          style={[styles.button, (!sentCode || !code || loading) && styles.buttonDisabled]}
          onPress={handleVerify}
          disabled={!sentCode || !code || loading}
        >
          <Text style={styles.buttonText}>{loading ? 'En cours...' : 'Valider'}</Text>
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
    justifyContent: 'center'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#111',
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center'
  },
  input: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 15,
    fontSize: 15,
    color: '#111',
    borderWidth: 1,
    borderColor: '#ECECEC'
  },
  codeButton: {
    backgroundColor: '#0056FF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15
  },
  codeButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16
  },
  button: {
    backgroundColor: '#0056FF',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20
  },
  buttonDisabled: {
    opacity: 0.5
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

export default EmailVerificationScreen;