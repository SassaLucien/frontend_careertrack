import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ParametresScreen = ({ navigation, route }) => {
  const { user } = route.params || {};
  const isCompany = user?.role === 'COMPANY';

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Paramètres</Text>
      
      {isCompany && (
        <View style={styles.companyButtons}>
          <TouchableOpacity 
            style={styles.menuButton} 
            onPress={() => navigation.navigate('PosterStage')}
          >
            <Text style={styles.menuButtonText}>📌 Poster un stage</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuButton} 
            onPress={() => navigation.navigate('AccepterDemandes')}
          >
            <Text style={styles.menuButtonText}>✅ Accepter les demandes de stage</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 20,
    paddingTop: 50
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#111',
    textAlign: 'center'
  },
  companyButtons: {
    marginBottom: 30
  },
  menuButton: {
    backgroundColor: '#0056FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 15,
    alignItems: 'center'
  },
  menuButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16
  }
});

export default ParametresScreen;