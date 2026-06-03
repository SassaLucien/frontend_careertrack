import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Image, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { getCurrentLoggedInUser, setCurrentLoggedInUser } from '../services/tempStorage';
import { getProfile, API_BASE_URL, SERVER_BASE_URL } from '../services/api';

const ProfileSkeleton = () => (
  <View style={[styles.profileCard, { alignItems: 'center', paddingVertical: 32 }]}>
    <View style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: '#E9ECEF' }} />
    <View style={{ marginTop: 16, height: 14, width: 160, borderRadius: 4, backgroundColor: '#E9ECEF' }} />
    <View style={{ marginTop: 8, height: 12, width: 220, borderRadius: 4, backgroundColor: '#E9ECEF' }} />
  </View>
);

const isValidUri = (value) => {
  if (!value || typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return false;
  return true;
};

const toInitials = (firstName = '', lastName = '') =>
  `${firstName?.[0] || ''}${lastName?.[0] || ''}`.trim();

const ProfilScreen = ({ route, navigation }) => {
  const [photo, setPhoto] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const showAcademicButtonRef = React.useRef(false);

  const mergeUser = (u, profilePhoto) => {
    if (!u) return;
    setUser(u);
    if (profilePhoto) setPhoto(profilePhoto);
  };

  const cachedUser = getCurrentLoggedInUser();

  useFocusEffect(
    useCallback(() => {
      const parentState = navigation.getState();
      const parentRoute = parentState?.routes?.find(r => r.name === 'MainTabs');
      const navigationParams = parentRoute?.params || route.params;

      if (navigationParams?.screen === 'Profil' && navigationParams?.params?.user) {
        setLoading(false);
        return mergeUser(navigationParams.params.user, navigationParams.params.profilePhoto);
      }

      if (navigationParams?.user) {
        setLoading(false);
        return mergeUser(navigationParams.user, navigationParams.profilePhoto);
      }

      const cached = getCurrentLoggedInUser();
      if (cached) {
        setLoading(false);
        const enrich = async () => {
          if (!cached.studentId && !cached.teacherId && cached.email) {
            const result = await getProfile(cached.email);
            if (result.success) {
              const merged = { ...cached, ...result.profile };
              setUser(merged);
              setCurrentLoggedInUser(merged);
              return;
            }
          }
          setUser(cached);
        };
        enrich();
        return;
      }

      setLoading(true);
    }, [route.params, navigation])
  );

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission requise', "Autorisez l'accès à la galerie");
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

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Vous êtes déconnecté(e)', [
      { text: 'OK', onPress: () => navigation.navigate('Login') }
    ]);
  };

  const getRoleLabel = () => {
    switch (user?.role) {
      case 'STUDENT': return 'Étudiant';
      case 'TEACHER': return 'Professeur';
      case 'COMPANY': return 'Entreprise';
      default: return '';
    }
  };

  const getRoleIcon = () => {
    switch (user?.role) {
      case 'STUDENT': return 'school-outline';
      case 'TEACHER': return 'people-outline';
      case 'COMPANY': return 'business-outline';
      default: return 'person-outline';
    }
  };

  const avatarUri = isValidUri(photo) ? photo : null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#111" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mon Profil</Text>
          <View style={styles.headerSpacer} />
        </View>

        {loading ? (
          <ProfileSkeleton />
        ) : !user ? (
          <View style={[styles.profileCard, { alignItems: 'center', paddingVertical: 32 }]}>
            <Text style={{ color: '#666' }}>Aucun utilisateur connecté.</Text>
          </View>
        ) : (
          <View style={styles.profileCard}>
            <View style={styles.avatarSection}>
              <TouchableOpacity style={styles.avatarWrapper} onPress={pickImage}>
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.avatar} onError={() => setPhoto(null)} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarPlaceholderText}>{toInitials(user?.firstName, user?.lastName)}</Text>
                  </View>
                )}
                <View style={styles.editBadge}>
                  <MaterialIcons name="photo-camera" size={16} color="#FFF" />
                </View>
              </TouchableOpacity>
              <View style={styles.roleBadge}>
                <Ionicons name={getRoleIcon()} size={14} color="#0056FF" />
                <Text style={styles.roleBadgeText}>{getRoleLabel()}</Text>
              </View>
            </View>

            <View style={styles.userInfo}>
              <Text style={styles.name}>{user?.firstName || ''} {user?.lastName || ''}</Text>
              <View style={styles.emailRow}>
                <Ionicons name="mail-outline" size={16} color="#666" />
                <Text style={styles.email}>{user?.email || ''}</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.actionsSection}>
            {user?.role === 'COMPANY' && (
              <>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => navigation.navigate('CompanyInternships', { userId: user?.companyId || user?.id })}
                >
                  <MaterialIcons name="work" size={22} color="#0056FF" />
                  <Text style={styles.actionButtonText}>Mes stages</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => navigation.navigate('CompanyStatistics', { userId: user?.companyId || user?.id })}
                >
                  <MaterialIcons name="bar-chart" size={22} color="#0056FF" />
                  <Text style={styles.actionButtonText}>Statistiques</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => navigation.navigate('PosterStage', { companyId: user?.id })}
                >
                  <MaterialIcons name="add-business" size={22} color="#0056FF" />
                  <Text style={styles.actionButtonText}>Poster stage</Text>
                </TouchableOpacity>
              </>
            )}

            {(user?.role === 'STUDENT' || user?.role === 'TEACHER') && (
              <>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => navigation.navigate('AcademicInfo', {
                    applicant: {
                      role: user?.role,
                      firstName: user?.firstName,
                      lastName: user?.lastName,
                      email: user?.email,
                      university: user?.university,
                      graduationYear: user?.graduationYear,
                      skills: user?.skills,
                      department: user?.department,
                      subject: user?.subject,
                      experience: user?.experience,
                      filiere: user?.filiere,
                      degree: user?.degree,
                      diplomaImage: user?.diplomaImage,
                    }
                  })}
                >
                  <MaterialIcons name="school" size={22} color="#0056FF" />
                  <Text style={styles.actionButtonText}>
                    {user?.role === 'TEACHER' ? 'Filière' : 'Diplôme'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => navigation.navigate('Payment', {
                    userId: user.id,
                    userName: `${user.firstName || ''} ${user.lastName || ''}`,
                  })}
                >
                  <MaterialIcons name="star" size={22} color="#FFD700" />
                  <Text style={styles.actionButtonText}>Premium</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <MaterialIcons name="logout" size={20} color="#FFF" />
            <Text style={styles.logoutButtonText}>Déconnexion</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  scrollContent: { paddingBottom: 40 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#FFF',
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0'
  },
  backButton: { padding: 8, borderRadius: 12, backgroundColor: '#F8F9FA' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#111', letterSpacing: -0.3 },
  headerSpacer: { width: 40 },
  profileCard: {
    backgroundColor: '#FFF', borderRadius: 20, padding: 28, marginHorizontal: 20, marginTop: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: '#F0F0F0', alignItems: 'center'
  },
  avatarSection: { alignItems: 'center', marginBottom: 20 },
  avatarWrapper: { position: 'relative', marginBottom: 16 },
  avatar: { width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: '#0056FF' },
  avatarPlaceholder: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#F0F4FF', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#0056FF', borderStyle: 'dashed' },
  avatarPlaceholderText: { fontSize: 32, fontWeight: '700', color: '#0056FF' },
  editBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#0056FF', borderRadius: 20, width: 36, height: 36, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#FFF', shadowColor: '#0056FF', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 3 },
  roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F0F4FF', alignSelf: 'center' },
  roleBadgeText: { fontSize: 13, fontWeight: '600', color: '#0056FF' },
  userInfo: { alignItems: 'center', width: '100%' },
  name: { fontSize: 22, fontWeight: '700', color: '#111', letterSpacing: -0.3, marginBottom: 8 },
  emailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  email: { fontSize: 14, color: '#666', fontWeight: '500' },
  section: { marginTop: 24, marginHorizontal: 20 },
  actionsSection: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 12, 
    justifyContent: 'center',
    marginBottom: 20 
  },
  actionButton: { 
    width: 100, 
    height: 80, 
    backgroundColor: '#FFF', 
    borderRadius: 16, 
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.06, 
    shadowRadius: 8, 
    elevation: 2, 
    borderWidth: 1, 
    borderColor: '#F0F0F0'
  },
  actionButtonText: { 
    fontSize: 12, 
    fontWeight: '600', 
    color: '#111', 
    marginTop: 6,
    textAlign: 'center'
  },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#FF3B30', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 14, shadowColor: '#FF3B30', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3 },
  logoutButtonText: { color: '#FFF', fontWeight: '600', fontSize: 15, letterSpacing: -0.2 }
});

export default ProfilScreen;