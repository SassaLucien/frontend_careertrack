import React, { useState } from 'react';
import {
  Text, TextInput, StyleSheet, TouchableOpacity,
  SafeAreaView, Alert, Dimensions, View
} from 'react-native';
import Svg, { Ellipse, Path } from 'react-native-svg';
import { login } from '../services/api';
import { setCurrentLoggedInUser } from '../services/tempStorage';

const { width, height } = Dimensions.get('window');

const ConnexionBackground = () => (
  <Svg height={height} width={width} style={StyleSheet.absoluteFill}>
    <Path
      d={`M-150 -150 C -50 -200, ${width * 0.5} -150, ${width * 0.45} 100 C ${width * 0.4} 280, -80 300, -120 150 C -160 50, -200 -80, -150 -150 Z`}
      fill="#0056FF"
    />
    <Ellipse cx={width * 0.25} cy={120} rx={80} ry={80} fill="#DAEAFF" />
    <Path
      d={`M${width + 60} 80 C ${width + 20} 40, ${width - 80} 100, ${width - 60} 280 C ${width - 20} 320, ${width + 80} 300, ${width + 100} 180 C ${width + 120} 120, ${width + 100} 60, ${width + 60} 80 Z`}
      fill="#0056FF"
    />
    <Ellipse cx={width * 0.25} cy={height + 10} rx={120} ry={70} fill="#DAEAFF" />
  </Svg>
);

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    setLoading(true);

    try {
      const result = await login(email, password);
      console.log('Login result:', result);

      if (result.success) {
        const user = result.user;
        setCurrentLoggedInUser(user);
        navigation.navigate('MainTabs', {
          screen: 'Profile',
          params: {
            user: user,
            profilePhoto: null
          }
        });
      } else {
        Alert.alert('Erreur', result.error || 'Échec de la connexion');
      }
    } catch (error) {
      console.log('Login error:', error);
      Alert.alert('Erreur', 'Échec de la connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ConnexionBackground />
      <View style={styles.topSpace} />
      <View style={styles.formCard}>
        <Text style={styles.title}>Login</Text>
        <Text style={styles.subtitle}>Welcome back! </Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Connexion...' : 'Sign In'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.registerLink}>Sign Up</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  topSpace: {
    height: height * 0.35,
  },
  formCard: {
    flex: 1,
    paddingHorizontal: 28,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 14,
    fontSize: 15,
    color: '#111',
    borderWidth: 1,
    borderColor: '#ECECEC',
  },
  button: {
    backgroundColor: '#0056FF',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    elevation: 5,
  },
  buttonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  registerLink: {
    textAlign: 'center',
    marginTop: 18,
    color: '#0056FF',
    fontWeight: '600',
    fontSize: 15,
  },
});

export default LoginScreen;