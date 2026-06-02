import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

const RegisterBackground = () => (
  <Svg height={height} width={width} style={StyleSheet.absoluteFill}>
    <Path
      d={`M${width * 0.45} -40 C ${width * 0.6} -80 ${width + 60} -60 ${width + 80} 100 C ${width + 100} 220 ${width + 20} 320 ${width * 0.7} 280 C ${width * 0.45} 240 ${width * 0.3} 120 ${width * 0.45} -40 Z`}
      fill="#0056FF"
    />
    <Path
      d="M-80 -20 C -20 -40 80 20 60 120 C 40 220 -60 240 -100 160 C -140 80 -140 20 -80 -20 Z"
      fill="#D6E8FF"
    />
  </Svg>
);

const RegisterScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <RegisterBackground />

      <View style={styles.content}>
        <Text style={styles.title}>Créer un{'\n'}compte</Text>
        
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Category')}>
          <Text style={styles.buttonText}>S'inscrire</Text>
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
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 40,
    textAlign: 'center',
    lineHeight: 40,
  },
  button: {
    backgroundColor: '#0056FF',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 6,
    shadowColor: '#0056FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelText: {
    textAlign: 'center',
    marginTop: 18,
    color: '#888',
    fontSize: 14,
  }
});

export default RegisterScreen;