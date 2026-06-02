import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, FlatList, RefreshControl, Alert, Image, ScrollView } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getCompanyInternships, deleteInternship, updateInternship, getApplicants } from '../services/api';
import FeaturedSuggestionModal from '../components/FeaturedSuggestionModal';

const getStatusLabel = (status) => {
  switch (status) {
    case 'ACTIVE': return 'Actif';
    case 'EXPIRED': return 'Expiré';
    case 'CLOSED': return 'Fermé';
    default: return 'Actif';
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case 'ACTIVE': return '#34C759';
    case 'EXPIRED': return '#FF3B30';
    case 'CLOSED': return '#8E8E93';
    default: return '#34C759';
  }
};

const InternshipCard = ({ item, userId, navigation, onDelete, onClose, onViewAccepted, refreshKey }) => {
  const [counts, setCounts] = useState({ total: 0, pending: 0, accepted: 0, rejected: 0 });

  useEffect(() => {
    const loadCounts = async () => {
      try {
        const result = await getApplicants(item.id);
        if (result.success) {
          const applicants = result.applicants;
          const total = applicants.length;
          const accepted = applicants.filter(app => app.status === 'ACCEPTED').length;
          const rejected = applicants.filter(app => app.status === 'REJECTED').length;
          const pending = applicants.filter(app => app.status === 'PENDING').length;
          setCounts({ total, accepted, rejected, pending });
        } else {
          setCounts({ total: 0, accepted: 0, rejected: 0, pending: 0 });
        }
      } catch (error) {
        setCounts({ total: 0, accepted: 0, rejected: 0, pending: 0 });
      }
    };
    loadCounts();
  }, [item.id, refreshKey]);

  const startDate = item.start_date || item.startDate;
  const endDate = item.end_date || item.endDate;
  const internshipImageUrl = item.imageUrl || item.image_url;

  return (
    <View style={styles.card}>
      <TouchableOpacity onPress={() => navigation.navigate('InternshipDetail', { internship: item, user: { id: userId, role: 'COMPANY' } })}>
        {internshipImageUrl ? (
          <Image source={{ uri: internshipImageUrl }} style={styles.cardImage} />
        ) : (
          <View style={styles.cardImagePlaceholder}>
            <Ionicons name="image-outline" size={40} color="#0056FF" />
          </View>
        )}
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
              <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
            </View>
          </View>

          <Text style={styles.cardDescription} numberOfLines={2}>{item.description}</Text>

          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={14} color="#666" />
            <Text style={styles.infoValue}>{item.location || 'Non précisé'}</Text>
          </View>

          {startDate && (
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={14} color="#666" />
              <Text style={styles.infoValue}>Début: {new Date(startDate).toLocaleDateString()}</Text>
            </View>
          )}

          {endDate && (
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={14} color="#666" />
              <Text style={styles.infoValue}>Fin: {new Date(endDate).toLocaleDateString()}</Text>
            </View>
          )}

          <View style={styles.countsRow}>
            <View style={[styles.countPill, { backgroundColor: '#F0F0F0' }]}>
              <Text style={styles.countPillText}>Total: {counts.total || 0}</Text>
            </View>
            <View style={[styles.countPill, { backgroundColor: '#FFF3E0' }]}>
              <Text style={[styles.countPillText, { color: '#E65100' }]}>En attente: {counts.pending}</Text>
            </View>
            <View style={[styles.countPill, { backgroundColor: '#E8F5E9' }]}>
              <Text style={[styles.countPillText, { color: '#2E7D32' }]}>Acceptés: {counts.accepted}</Text>
            </View>
            <View style={[styles.countPill, { backgroundColor: '#FFEBEE' }]}>
              <Text style={[styles.countPillText, { color: '#C62828' }]}>Rejetés: {counts.rejected}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.viewAcceptedButton}
            onPress={() => onViewAccepted(item)}
          >
            <Ionicons name="people-outline" size={16} color="#FFF" />
            <Text style={styles.viewAcceptedButtonText}>Voir les candidats acceptés</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => navigation.navigate('PosterStage', { internship: item, userId })}
        >
          <Ionicons name="create-outline" size={16} color="#FFF" />
          <Text style={styles.editButtonText}>Modifier</Text>
        </TouchableOpacity>

        {item.status !== 'CLOSED' && (
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => onClose(item)}
          >
            <Ionicons name="lock-outline" size={16} color="#FFF" />
            <Text style={styles.closeButtonText}>Fermer</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => onDelete(item.id)}
        >
          <MaterialIcons name="delete-outline" size={16} color="#FFF" />
          <Text style={styles.deleteButtonText}>Supprimer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const CompanyInternshipsScreen = ({ navigation, route }) => {
  const [internships, setInternships] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showFeaturedModal, setShowFeaturedModal] = useState(false);
  const userId = route.params?.userId || route.params?.companyId;
  const refreshParam = route.params?.refresh;

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowFeaturedModal(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (refreshParam) {
      setRefreshKey(k => k + 1);
    }
  }, [refreshParam]);

  const fetchInternships = useCallback(async () => {
    const result = await getCompanyInternships(userId);
    if (result.success) setInternships(result.internships);
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      fetchInternships();
    }, [fetchInternships])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    setRefreshKey(k => k + 1);
    await fetchInternships();
    setRefreshing(false);
  };

  const handleDelete = async (internshipId) => {
    Alert.alert('Confirmer la suppression', 'Êtes-vous sûr de vouloir supprimer ce stage ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer', style: 'destructive',
        onPress: async () => {
          const result = await deleteInternship(internshipId, userId);
          if (result.success) {
            setInternships(prev => prev.filter(i => i.id !== internshipId));
            setRefreshKey(k => k + 1);
            Alert.alert('Succès', 'Stage supprimé avec succès');
          } else {
            Alert.alert('Erreur', result.error || 'Échec de la suppression');
          }
        }
      }
    ]);
  };

  const handleClose = async (internship) => {
    const result = await updateInternship(internship.id, { ...internship, status: 'CLOSED' });
    if (result.success) {
      setInternships(prev => prev.map(i => i.id === internship.id ? { ...i, status: 'CLOSED' } : i));
    } else {
      Alert.alert('Erreur', result.error || 'Échec de la mise à jour');
    }
  };

  const handleViewAccepted = (internship) => {
    navigation.navigate('AcceptedCandidates', { internship, internshipId: internship.id });
  };

  const renderInternship = ({ item }) => (
    <InternshipCard
      item={item}
      userId={userId}
      navigation={navigation}
      onDelete={handleDelete}
      onClose={handleClose}
      onViewAccepted={handleViewAccepted}
      refreshKey={refreshKey}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mes stages publiés</Text>
        <View style={styles.headerSpacer} />
      </View>

      <FlatList
        data={internships}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderInternship}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="briefcase-outline" size={48} color="#CCC" />
            <Text style={styles.emptyText}>Aucun stage publié</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('PosterStage', { userId })}>
        <Ionicons name="add" size={28} color="#FFF" />
      </TouchableOpacity>

      <FeaturedSuggestionModal
        visible={showFeaturedModal}
        onClose={() => setShowFeaturedModal(false)}
        onProfilePress={(person) => {
          navigation.navigate('ProfilCandidat', { applicant: person });
          setShowFeaturedModal(false);
        }}
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
  list: { padding: 16, paddingBottom: 20 },
  card: {
    backgroundColor: '#FFF', borderRadius: 16, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 2, borderWidth: 1, borderColor: '#F0F0F0', overflow: 'hidden'
  },
  cardImage: { width: '100%', height: 160, resizeMode: 'cover' },
  cardImagePlaceholder: { width: '100%', height: 160, backgroundColor: '#F0F4FF', justifyContent: 'center', alignItems: 'center' },
  cardContent: { padding: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#111', flex: 1, marginRight: 10, letterSpacing: -0.3 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  statusText: { fontSize: 11, color: '#FFF', fontWeight: '600' },
  cardDescription: { fontSize: 14, color: '#666', marginBottom: 12, lineHeight: 20 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 8 },
  infoValue: { fontSize: 13, color: '#555', fontWeight: '500' },
  countsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 12 },
  countPill: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  countPillText: { fontSize: 11, fontWeight: '600', color: '#333' },
  viewAcceptedButton: {
    backgroundColor: '#0056FF', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 8,
    flexDirection: 'row', justifyContent: 'center', gap: 8
  },
  viewAcceptedButtonText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  cardActions: { flexDirection: 'row', justifyContent: 'flex-end', padding: 12, borderTopWidth: 1, borderTopColor: '#F0F0F0', gap: 8 },
  editButton: { backgroundColor: '#0056FF', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4 },
  editButtonText: { color: '#FFF', fontSize: 13, fontWeight: '600' },
  closeButton: { backgroundColor: '#FF9500', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4 },
  closeButtonText: { color: '#FFF', fontSize: 13, fontWeight: '600' },
  deleteButton: { backgroundColor: '#FF3B30', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4 },
  deleteButtonText: { color: '#FFF', fontSize: 13, fontWeight: '600' },
  emptyContainer: { alignItems: 'center', paddingVertical: 80 },
  emptyText: { textAlign: 'center', color: '#999', fontSize: 14, fontWeight: '500', marginTop: 12 },
  fab: {
    position: 'absolute', bottom: 30, right: 30, backgroundColor: '#0056FF',
    width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 4,
    shadowColor: '#0056FF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8
  }
});

export default CompanyInternshipsScreen;
