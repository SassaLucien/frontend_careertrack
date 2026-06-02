import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, Dimensions, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

const BackgroundBlobs = () => (
  <Svg height={height} width={width} style={StyleSheet.absoluteFill}>
    <Path
      d={`M-50 -50 C 50 -150, 250 -80, 200 100 C 150 200, -50 150, -50 -50 Z`}
      fill="#0056FF"
    />
    <Path
      d={`M200 50 C 150 80, 150 150, 200 180 Z`}
      fill="rgba(225, 239, 255, 0.6)"
    />
  </Svg>
);

const IconPerson = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" style={{ marginRight: 12 }}>
    <Path fill="#999" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
  </Svg>
);

const IconEmail = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" style={{ marginRight: 12 }}>
    <Path fill="#999" d="M12 12.713l11.985-7.71L12 2.293 0 5l12 7.713zm0 2.574L0 7.572V19c0 1.105.895 2 2 2h20c1.104 0 2-.896 2-2V7.572l-12 7.725z"/>
  </Svg>
);

const IconLock = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" style={{ marginRight: 12 }}>
    <Path fill="#999" d="M18 10H6c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-8c0-1.1-.9-2-2-2zm0 10H6v-8h12v8zm-6-5a2.5 2.5 0 0 1-2.5-2.5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5A2.5 2.5 0 0 1 12 15z"/>
  </Svg>
);

const IconPhone = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" style={{ marginRight: 12 }}>
    <Path fill="#999" d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.11-.21c1.21.49 2.52.76 3.84.76a1 1 0 0 1 1 1v3.5a1 1 0 0 1-1 1C7.54 21 3 16.46 3 12a1 1 0 0 1 1-1c0-1.32.28-2.63.76-3.84a1 1 0 0 1 .21-1.11l-2.2-2.2z"/>
  </Svg>
);

const IconCode = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" style={{ marginRight: 12 }}>
    <Path fill="#999" d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-2 14H6v-4h12v4zm0-6H6V8h12v4z"/>
  </Svg>
);

const IconSkills = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" style={{ marginRight: 12 }}>
    <Path fill="#999" d="M9 21V7h6v14h5l-8 8-8-8h5zm2-16h2V3h-2v2z"/>
  </Svg>
);

const StudentRegisterScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [university, setUniversity] = useState('');
  const [skills, setSkills] = useState('');

  const handleNext = () => {
    if (!email || !password || !firstName || !lastName) {
      Alert.alert('Erreur', 'Veuillez remplir les champs obligatoires');
      return;
    }

    const userData = {
      email,
      password,
      phone,
      role: 'STUDENT',
      profile: {
        firstName,
        lastName,
        university,
        graduationYear: '',
        skills: skills ? skills.split(',').map(s => s.trim()) : []
      }
    };
    navigation.navigate('PhotoUpload', { userData });
  };

  return (
    <SafeAreaView style={styles.container}>
      <BackgroundBlobs />
      
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Inscription Étudiant</Text>
        
        <View style={styles.inputContainer}>
          <IconPerson />
          <TextInput 
            style={styles.input} 
            placeholder="Prénom" 
            placeholderTextColor="#999"
            value={firstName}
            onChangeText={setFirstName}
          />
        </View>
        
        <View style={styles.inputContainer}>
          <IconPerson />
          <TextInput 
            style={styles.input} 
            placeholder="Nom" 
            placeholderTextColor="#999"
            value={lastName}
            onChangeText={setLastName}
          />
        </View>
        
        <View style={styles.inputContainer}>
          <IconEmail />
          <TextInput 
            style={styles.input} 
            placeholder="Email" 
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address" 
          />
        </View>
        
        <View style={styles.inputContainer}>
          <IconLock />
          <TextInput 
            style={styles.input} 
            placeholder="Mot de passe" 
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry 
          />
        </View>
        
        <View style={styles.inputContainer}>
          <IconPhone />
          <TextInput 
            style={styles.input} 
            placeholder="Téléphone" 
            placeholderTextColor="#999"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad" 
          />
        </View>
        
        <View style={styles.inputContainer}>
          <IconCode />
          <TextInput 
            style={styles.input} 
            placeholder="Université" 
            placeholderTextColor="#999"
            value={university}
            onChangeText={setUniversity}
          />
        </View>
        
        <View style={styles.inputContainer}>
          <IconSkills />
          <TextInput 
            style={styles.input} 
            placeholder="Compétences (séparées par des virgules)" 
            placeholderTextColor="#999"
            value={skills}
            onChangeText={setSkills}
          />
        </View>
        
        <TouchableOpacity style={styles.button} onPress={handleNext}>
          <Text style={styles.buttonText}>Suivant</Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.cancelText}>Déjà un compte ? Se connecter</Text>
        </TouchableOpacity>
      </ScrollView>
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
    flexGrow: 1,
    paddingHorizontal: 28,
    justifyContent: 'center',
    paddingTop: 60,
    paddingBottom: 30
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: '#111'
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#DDD',
    paddingHorizontal: 15
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#111'
  },
  button: {
    backgroundColor: '#0056FF',
    padding: 18,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 10
  },
  buttonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16
  },
  cancelText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#0056FF',
    fontSize: 14
  }
});

export default StudentRegisterScreen;