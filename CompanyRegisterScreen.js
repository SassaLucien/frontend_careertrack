import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

const CompanyRegisterScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [sector, setSector] = useState('');
  const [website, setWebsite] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');

  const handleNext = () => {
    if (!email || !password || !companyName || !sector) {
      Alert.alert('Erreur', 'Veuillez remplir les champs obligatoires');
      return;
    }

    const userData = {
      email,
      password,
      phone,
      role: 'COMPANY',
      companyProfile: {
        companyName,
        email,
        sector,
        address,
        website,
        description
      }
    };
    navigation.navigate('PhotoUpload', { userData });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Svg height="100%" width="100%" style={StyleSheet.absoluteFill}>
        <Path
          d="M-50 -50 C 50 -150, 250 -80, 200 100 C 150 200, -50 150, -50 -50 Z"
          fill="#0056FF"
        />
      </Svg>
      
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Inscription Entreprise</Text>
        
        <View style={styles.inputContainer}>
          <Text style={styles.inputIcon}>🏢</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Nom de l'entreprise" 
            placeholderTextColor="#999"
            value={companyName}
            onChangeText={setCompanyName}
          />
        </View>
        
        <View style={styles.inputContainer}>
          <Text style={styles.inputIcon}>📧</Text>
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
          <Text style={styles.inputIcon}>🔒</Text>
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
          <Text style={styles.inputIcon}>📱</Text>
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
          <Text style={styles.inputIcon}>🏢</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Secteur d'activité" 
            placeholderTextColor="#999"
            value={sector}
            onChangeText={setSector}
          />
        </View>
        
        <View style={styles.inputContainer}>
          <Text style={styles.inputIcon}>🌐</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Site web (optionnel)" 
            placeholderTextColor="#999"
            value={website}
            onChangeText={setWebsite}
          />
        </View>
        
        <View style={styles.textAreaContainer}>
          <TextInput 
            style={styles.textArea} 
            placeholder="Adresse" 
            placeholderTextColor="#999"
            value={address}
            onChangeText={setAddress}
            multiline
          />
        </View>
        
        <View style={styles.textAreaContainer}>
          <TextInput 
            style={styles.textArea} 
            placeholder="Description (optionnel)" 
            placeholderTextColor="#999"
            value={description}
            onChangeText={setDescription}
            multiline
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
  inputIcon: {
    marginRight: 12,
    fontSize: 18
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#111'
  },
  textAreaContainer: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#DDD',
    paddingHorizontal: 15
  },
  textArea: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#111',
    minHeight: 80,
    textAlignVertical: 'top'
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

export default CompanyRegisterScreen;