import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, ActivityIndicator, Alert, Modal, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getFeaturedProfiles, searchPeople, API_BASE_URL, SERVER_BASE_URL } from '../services/api';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.55;
const SPACING = 8;

const FeaturedSuggestionModal = ({ visible, onClose, onProfilePress, refreshTrigger }) => {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible) {
      setLoading(true);
      loadFeatured();
    }
  }, [visible]);

  const loadFeatured = async () => {
    try {
      const result = await getFeaturedProfiles();
      if (result.success) {
        setFeatured(result.profiles || []);
      }
    } catch (error) {
      console.error('Error loading featured profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCardPress = (person) => {
    if (onProfilePress) {
      const firstName = person.firstName || person.teacherFirstName || '';
      const lastName = person.lastName || person.teacherLastName || '';
      const photo = person.profilePhoto || person.teacherProfilePhoto || '';
      const applicant = {
        userId: person.userId || person.id,
        role: person.type === 'TEACHER' ? 'TEACHER' : 'STUDENT',
        firstName: firstName,
        lastName: lastName,
        email: person.email,
        phone: person.phone,
        profilePhoto: photo,
        university: person.university,
        graduationYear: person.graduationYear,
        skills: person.skills,
        department: person.department,
        subject: person.subject,
        experience: person.experience,
        filiere: person.filiere,
        degree: person.degree,
        diplomaImage: person.diplomaImage,
        status: null,
      };
      onProfilePress(applicant);
    }
    onClose();
  };

  const renderCard = (person) => {
    const isStudent = person.type === 'STUDENT';
    const firstName = person.firstName || person.teacherFirstName || '';
    const lastName = person.lastName || person.teacherLastName || '';
    const fullName = (firstName + ' ' + lastName).trim() || 'Inconnu';
    const subtitle = isStudent
      ? (person.degree || 'Étudiant')
      : (person.filiere || person.subject || 'Professeur');
    const avatarUrl = person.profilePhoto
      ? (person.profilePhoto.startsWith('http') 
          ? person.profilePhoto 
          : (person.profilePhoto.startsWith('file://') ? person.profilePhoto : `${SERVER_BASE_URL}${person.profilePhoto}`))
      : person.teacherProfilePhoto
        ? (person.teacherProfilePhoto.startsWith('http') 
            ? person.teacherProfilePhoto 
            : (person.teacherProfilePhoto.startsWith('file://') ? person.teacherProfilePhoto : `${SERVER_BASE_URL}${person.teacherProfilePhoto}`))
        : null;

    return (
      <TouchableOpacity
        key={`${person.type}-${person.id}`}
        style={styles.card}
        onPress={() => handleCardPress(person)}
        activeOpacity={0.85}
      >
        <View style={styles.cardInner}>
          <View style={styles.crownBadge}>
            <Ionicons name="diamond" size={12} color="#FFD700" />
          </View>

          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarInitial}>
                {fullName[0] || '?'}
              </Text>
            </View>
          )}

          <View style={styles.badge}>
            <Ionicons name={isStudent ? 'school-outline' : 'desk-outline'} size={10} color="#FFD700" />
          </View>

          <Text style={styles.name} numberOfLines={1}>
            {fullName}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>

          <View style={styles.chevronRow}>
            <Ionicons name="chevron-forward" size={12} color="#FFD700" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.backdrop} />
        <View style={styles.modalContainer}>
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <Ionicons name="star" size={22} color="#FFD700" />
              <Text style={styles.headerTitle}>Profils en vedette</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={22} color="#111" />
            </TouchableOpacity>
          </View>

<Text style={styles.headerSubtitle}>
             Ces profils peuvent vous intéresser
           </Text>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#0056FF" />
            </View>
          ) : featured.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={40} color="#CCC" />
              <Text style={styles.emptyText}>Aucun profil en vedette pour le moment</Text>
              <TouchableOpacity style={styles.suggestButton} onPress={onClose}>
                <Text style={styles.suggestButtonText}>Découvrir les profils</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              snapToInterval={CARD_WIDTH + SPACING * 2}
              decelerationRate="fast"
              contentContainerStyle={styles.carouselContent}
            >
              {featured.map(renderCard)}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  modalContainer: {
    width: width * 0.92,
    maxHeight: '80%',
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 6,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#888',
    marginBottom: 18,
    textAlign: 'center',
    marginTop: 4,
  },
  carouselContent: {
    alignItems: 'center',
    paddingHorizontal: SPACING,
    gap: SPACING,
  },
  card: {
    width: CARD_WIDTH,
    marginHorizontal: SPACING / 2,
    borderRadius: 20,
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
  cardInner: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  crownBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFF8E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: '#FFD700',
  },
  avatarPlaceholder: {
    backgroundColor: '#FFF3CD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFD700',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#FFF8E1',
    marginBottom: 8,
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111',
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: 10,
  },
  chevronRow: {
    marginTop: 4,
  },
  loadingContainer: {
    paddingVertical: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    marginTop: 10,
    marginBottom: 16,
  },
  suggestButton: {
    backgroundColor: '#0056FF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 16,
  },
  suggestButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 13,
  },
});

export default FeaturedSuggestionModal;
