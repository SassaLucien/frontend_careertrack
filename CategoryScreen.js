import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const CategoryScreen = ({ navigation }) => {
  const categories = [
    {
      id: 'student',
      title: 'Étudiant',
      subtitle: 'Recherchez des stages',
      icon: 'school-outline',
      color: '#0056FF',
      bgColor: '#E8F0FF',
      route: 'StudentRegister'
    },
    {
      id: 'teacher',
      title: 'Professeur',
      subtitle: 'Accompagnez les étudiants',
      icon: 'people-outline',
      color: '#34C759',
      bgColor: '#E8F5E9',
      route: 'TeacherRegister'
    },
    {
      id: 'company',
      title: 'Entreprise',
      subtitle: 'Publiez des offres',
      icon: 'business-outline',
      color: '#FF9500',
      bgColor: '#FFF3E0',
      route: 'CompanyRegister'
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerSection}>
          <Text style={styles.title}>Bienvenue</Text>
          <Text style={styles.subtitle}>Choisissez votre profil pour commencer</Text>
        </View>

        <View style={styles.cardsContainer}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={styles.categoryCard}
              onPress={() => navigation.navigate(category.route)}
              activeOpacity={0.9}
            >
              <View style={[styles.iconContainer, { backgroundColor: category.bgColor }]}>
                <Ionicons name={category.icon} size={32} color={category.color} />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{category.title}</Text>
                <Text style={styles.cardSubtitle}>{category.subtitle}</Text>
              </View>
              <View style={styles.arrowContainer}>
                <Ionicons name="chevron-forward" size={22} color="#CCC" />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.loginButton} onPress={() => navigation.navigate('Login')}>
          <Ionicons name="arrow-back" size={18} color="#0056FF" />
          <Text style={styles.loginButtonText}>Retour à la connexion</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA'
  },
  scrollContent: {
    paddingBottom: 40
  },
  headerSection: {
    paddingHorizontal: 28,
    paddingTop: 60,
    paddingBottom: 32,
    backgroundColor: '#FFF'
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111',
    letterSpacing: -0.5,
    marginBottom: 8
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    fontWeight: '500',
    lineHeight: 22
  },
  cardsContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 14
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 18,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    gap: 16
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center'
  },
  cardContent: {
    flex: 1
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111',
    letterSpacing: -0.3,
    marginBottom: 4
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
    lineHeight: 18
  },
  arrowContainer: {
    padding: 4
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 32,
    marginHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#F0F4FF',
    borderWidth: 1.5,
    borderColor: '#0056FF30'
  },
  loginButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0056FF',
    letterSpacing: -0.2
  }
});

export default CategoryScreen;
