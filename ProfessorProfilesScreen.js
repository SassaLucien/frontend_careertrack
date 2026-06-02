import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, FlatList, RefreshControl, Image, ActivityIndicator, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { searchPeople, markFeatured } from '../services/api';
import FeaturedSuggestionModal from '../components/FeaturedSuggestionModal';

const DEGREE_LIST = ['BEPC', 'BAC', 'LICENCE', 'MASTER1', 'MASTER 2', 'DOCTORAT'];
const FILIERE_LIST = ['Informatique', 'Mathématiques', 'Physique', 'Chimie', 'Biologie', 'Langues', 'Histoire', 'Gestion'];

const ProfessorProfilesScreen = ({ navigation }) => {
  const [people, setPeople] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFeaturedModal, setShowFeaturedModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [typeFilter, setTypeFilter] = useState('');
  const [keyword, setKeyword] = useState('');
  const [degreeFilter, setDegreeFilter] = useState('');
  const [filiereFilter, setFiliereFilter] = useState('');

  // Afficher le modal à chaque fois que l'écran est focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setRefreshKey(k => k + 1);
      setShowFeaturedModal(true);
    });
    return unsubscribe;
  }, [navigation]);

  const fetchPeople = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await searchPeople({
        keyword,
        type: typeFilter || undefined,
        degree: degreeFilter || undefined,
        filiere: filiereFilter || undefined,
      });
      if (result.success) {
        setPeople(result.results || []);
        setFiltered(result.results || []);
      } else {
        setPeople([]);
        setFiltered([]);
        setError(result.error || 'Erreur de chargement');
      }
    } catch (err) {
      setError(err.message || 'Erreur réseau');
      setPeople([]);
      setFiltered([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPeople();
  }, []);

  useEffect(() => {
    const run = async () => {
      if (!keyword && !typeFilter && !degreeFilter && !filiereFilter) {
        setFiltered(people);
        return;
      }
      const result = await searchPeople({
        keyword,
        type: typeFilter || undefined,
        degree: degreeFilter || undefined,
        filiere: filiereFilter || undefined,
      });
      if (result.success) setFiltered(result.results || []);
    };
    run();
  }, [keyword, typeFilter, degreeFilter, filiereFilter]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPeople();
  };

  const toggleType = (value) => setTypeFilter(prev => (prev === value ? '' : value));

  const toInitials = (firstName = '', lastName = '') =>
    `${firstName?.[0] || ''}${lastName?.[0] || ''}`.trim();

  const renderItem = ({ item }) => {
    const firstName = item.firstName || item.teacherFirstName || '';
    const lastName = item.lastName || item.teacherLastName || '';
    const fullName = `${firstName} ${lastName}`.trim();
    const name = fullName || (item.type === 'TEACHER' ? 'Professeur' : 'Étudiant');
    const photo = item.profilePhoto || item.teacherProfilePhoto || '';
    const isTeacher = item.type === 'TEACHER';

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => {
const applicant = {
             userId: item.userId || item.id,
             role: isTeacher ? 'TEACHER' : 'STUDENT',
             firstName: firstName,
             lastName: lastName,
             email: item.email,
             phone: item.phone,
             profilePhoto: photo,
             university: item.university,
             graduationYear: item.graduationYear,
             skills: item.skills,
             department: item.department,
             subject: item.subject,
             experience: item.experience,
             filiere: item.filiere,
             degree: item.degree,
             diplomaImage: item.diplomaImage,
             status: null,
           };
          navigation.navigate('ProfilCandidat', { applicant });
        }}
      >
        <View style={styles.cardBody}>
          {photo ? (
            <Image source={{ uri: photo }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{toInitials(firstName, lastName)}</Text>
            </View>
          )}
          <View style={styles.details}>
            <Text style={styles.name}>{name}</Text>
            {!!item.email && <Text style={styles.sub}>{item.email}</Text>}
            {isTeacher && !!item.department && <Text style={styles.sub}>{item.department}</Text>}
            {!isTeacher && !!item.university && <Text style={styles.sub}>{item.university}</Text>}
            {!isTeacher && item.degree ? <Text style={styles.badge}>{item.degree}</Text> : null}
            {isTeacher && item.filiere ? <Text style={styles.badge}>{item.filiere}</Text> : null}
          </View>
          <Ionicons name="chevron-forward" size={18} color="#CCC" />
        </View>
      </TouchableOpacity>
    );
  };

  const degreeOptions = useMemo(() => {
    if (!people.length) return [];
    const set = new Set(people.filter(p => p.type === 'STUDENT').map(p => p.degree).filter(Boolean));
    return Array.from(set);
  }, [people]);

  const filiereOptions = useMemo(() => {
    if (!people.length) return [];
    const set = new Set(people.filter(p => p.type === 'TEACHER').map(p => p.filiere).filter(Boolean));
    return Array.from(set);
  }, [people]);

  const handleFeaturedProfilePress = (person) => {
    navigation.navigate('ProfilCandidat', { applicant: person });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Professeurs & Étudiants</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.searchBlock}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color="#999" />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher par nom..."
              placeholderTextColor="#999"
              value={keyword}
              onChangeText={setKeyword}
            />
            {!!keyword && (
              <TouchableOpacity onPress={() => setKeyword('')}>
                <Ionicons name="close-circle" size={18} color="#999" />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.chipRow}>
            {['', 'STUDENT', 'TEACHER'].map(t => {
              const label = t === 'STUDENT' ? 'Étudiant' : t === 'TEACHER' ? 'Professeur' : 'Tous';
              const active = typeFilter === t;
              return (
                <TouchableOpacity
                  key={t || 'ALL'}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => toggleType(t)}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {!!degreeOptions.length && (
            <View style={styles.chipRow}>
              {degreeOptions.map(d => {
                const active = degreeFilter === d;
                return (
                  <TouchableOpacity
                    key={d}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => setDegreeFilter(prev => (prev === d ? '' : d))}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{d}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {!!degreeFilter && (
            <TouchableOpacity style={styles.resetRow} onPress={() => setDegreeFilter('')}>
              <Text style={styles.resetText}>Réinitialiser le filtre diplôme</Text>
            </TouchableOpacity>
          )}

          {!!filiereOptions.length && (
            <View style={styles.chipRow}>
              {filiereOptions.map(f => {
                const active = filiereFilter === f;
                return (
                  <TouchableOpacity
                    key={f}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => setFiliereFilter(prev => (prev === f ? '' : f))}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{f}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {!!filiereFilter && (
            <TouchableOpacity style={styles.resetRow} onPress={() => setFiliereFilter('')}>
              <Text style={styles.resetText}>Réinitialiser le filtre filière</Text>
            </TouchableOpacity>
          )}
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#0056FF" />
            <Text style={styles.loadingText}>Chargement...</Text>
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchPeople}>
              <Text style={styles.retryButtonText}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color="#CCC" />
            <Text style={styles.emptyText}>Aucun résultat</Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            renderItem={renderItem}
            keyExtractor={item => `${item.type}-${item.id}`}
            contentContainerStyle={styles.list}
            scrollEnabled={false}
          />
        )}
      </ScrollView>

<FeaturedSuggestionModal
         visible={showFeaturedModal}
         onClose={() => setShowFeaturedModal(false)}
         onProfilePress={handleFeaturedProfilePress}
         refreshTrigger={refreshKey}
       />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#FFF',
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0'
  },
  backButton: { padding: 8, borderRadius: 12, backgroundColor: '#F8F9FA' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111', letterSpacing: -0.3, flex: 1, textAlign: 'center', marginHorizontal: 12 },
  headerSpacer: { width: 40 },
  scrollContent: { flexGrow: 1 },
  searchBlock: { padding: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F5F7FA', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  searchInput: { flex: 1, color: '#111', fontSize: 15 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 },
  chip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, backgroundColor: '#F0F2F6', borderWidth: 1, borderColor: '#E5E7EB' },
  chipActive: { backgroundColor: '#0056FF', borderColor: '#0056FF' },
  chipText: { color: '#333', fontWeight: '600', fontSize: 13 },
  chipTextActive: { color: '#FFF' },
  resetRow: { marginTop: 12, alignItems: 'center' },
  resetText: { color: '#FF3B30', fontWeight: '600', fontSize: 13 },
  list: { padding: 16, paddingBottom: 20 },
  card: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: '#F0F0F0'
  },
  cardBody: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 52, height: 52, borderRadius: 26, marginRight: 14 },
  avatarPlaceholder: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#0056FF', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  avatarText: { color: '#FFF', fontSize: 20, fontWeight: '700' },
  details: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600', color: '#111', letterSpacing: -0.2 },
  sub: { fontSize: 12, color: '#666', fontWeight: '500', marginTop: 2 },
  badge: { marginTop: 6, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: '#E8F0FF' },
  badgeText: { color: '#0056FF', fontSize: 11, fontWeight: '700' },
  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { textAlign: 'center', color: '#999', fontSize: 14, fontWeight: '500', marginTop: 12 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, color: '#666', marginTop: 8 },
  errorText: { fontSize: 14, color: '#FF3B30', textAlign: 'center', marginBottom: 12 },
  retryButton: { backgroundColor: '#0056FF', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  retryButtonText: { color: '#FFF', fontWeight: '600', fontSize: 14 }
});

export default ProfessorProfilesScreen;