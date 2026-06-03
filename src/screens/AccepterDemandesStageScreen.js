import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, FlatList, Alert, Image, RefreshControl, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getCompanyApplications, updateApplicationStatus, deleteApplication } from '../services/api';
import { getCurrentLoggedInUser } from '../services/tempStorage';

const getStatusLabel = (status) => {
  switch (status) {
    case 'PENDING': return 'En attente';
    case 'ACCEPTED': return 'Accepté';
    case 'REJECTED': return 'Rejeté';
    default: return 'En attente';
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case 'PENDING': return '#FF9500';
    case 'ACCEPTED': return '#34C759';
    case 'REJECTED': return '#FF3B30';
    default: return '#FF9500';
  }
};

const getStatusBg = (status) => {
  switch (status) {
    case 'PENDING': return '#FFF3E0';
    case 'ACCEPTED': return '#E8F5E9';
    case 'REJECTED': return '#FFEBEE';
    default: return '#FFF3E0';
  }
};

const getRoleLabel = (role) => {
  switch (role) {
    case 'STUDENT': return 'Étudiant';
    case 'TEACHER':
    case 'PROFESSOR': return 'Professeur';
    default: return role;
  }
};

const StatusBadge = ({ status }) => (
  <View style={[styles.statusBadge, { backgroundColor: getStatusBg(status) }]}>
    <Ionicons name={status === 'ACCEPTED' ? 'checkmark-circle' : status === 'REJECTED' ? 'close-circle' : 'time'} size={12} color={getStatusColor(status)} />
    <Text style={[styles.statusBadgeText, { color: getStatusColor(status) }]}>{getStatusLabel(status)}</Text>
  </View>
);

const AccepterDemandesStageScreen = ({ navigation, route }) => {
  const [requests, setRequests] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const currentUser = getCurrentLoggedInUser();
  const internshipId = route.params?.internshipId;

  const fetchApplications = useCallback(async () => {
    if (!currentUser?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const companyId = route.params?.companyId || currentUser.companyId || currentUser.id;
    console.log('Fetching apps for companyId:', companyId);
    const result = await getCompanyApplications(companyId);
    console.log('Result:', result);
    if (result.success) {
      console.log('Applications:', result.applications);
      setRequests(result.applications);
    }
    setLoading(false);
  }, [currentUser?.id, route.params?.companyId]);

  useFocusEffect(useCallback(() => { fetchApplications(); }, [fetchApplications]));

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchApplications();
    setRefreshing(false);
  };

  const handleAccept = async (id) => {
    const result = await updateApplicationStatus(id, 'ACCEPTED', currentUser?.id);
    if (result.success) {
      setRequests(requests.map(r => r.id === id ? { ...r, status: 'ACCEPTED' } : r));
      if (internshipId) {
        route.params?.triggerRefresh && route.params.triggerRefresh();
      }
      Alert.alert('Succès', 'Candidature acceptée');
    } else {
      Alert.alert('Erreur', result.error || 'Échec de l\'acceptation');
    }
  };

  const handleReject = async (id) => {
    const result = await updateApplicationStatus(id, 'REJECTED', currentUser?.id);
    if (result.success) {
      setRequests(requests.map(r => r.id === id ? { ...r, status: 'REJECTED' } : r));
      if (internshipId) {
        route.params?.triggerRefresh && route.params.triggerRefresh();
      }
      Alert.alert('Info', 'Candidature rejetée');
    } else {
      Alert.alert('Erreur', result.error || 'Échec du rejet');
    }
  };

  const handleDelete = async (id) => {
    Alert.alert(
      'Confirmer la suppression',
      'Êtes-vous sûr de vouloir supprimer cette candidature ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteApplication(id);
            if (result.success) {
              setRequests(requests.filter(r => r.id !== id));
            } else {
              Alert.alert('Erreur', result.error || 'Échec de la suppression');
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }) => {
    const firstName = item.firstName || item.first_name || item.student_first_name || item.teacher_first_name || '';
    const lastName = item.lastName || item.last_name || item.student_last_name || item.teacher_last_name || '';
    const profilePhoto = item.profilePhoto || item.profile_photo || item.student_profile_photo || item.teacher_profile_photo;
    const email = item.email || '';
    const phone = item.phone || item.phoneNumber || '';
    const applicationDate = item.appliedAt || item.applied_at || item.applicationDate || item.created_at;
    const badgeLetter = (firstName?.[0] || '') + (lastName?.[0] || '') || '?';

    return (
      <View style={styles.requestCard}>
        <View style={styles.cardHeader}>
          <View style={styles.applicantHeader}>
            {profilePhoto ? (
              <Image source={{ uri: profilePhoto }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{badgeLetter}</Text>
              </View>
            )}
            <View style={styles.applicantInfo}>
              <Text style={styles.studentName}>{firstName} {lastName}</Text>
              {item.internship_title && (
                <View style={styles.internshipRow}>
                  <Ionicons name="briefcase-outline" size={12} color="#0056FF" />
                  <Text style={styles.internshipTitle}>{item.internship_title}</Text>
                </View>
              )}
            </View>
          </View>
          <StatusBadge status={item.status} />
        </View>

        <View style={styles.contactInfo}>
          <View style={styles.contactRow}>
            <Ionicons name="mail-outline" size={14} color="#666" />
            <Text style={styles.contactText}>{email || 'Non renseigné'}</Text>
          </View>
          {phone ? (
            <View style={styles.contactRow}>
              <Ionicons name="call-outline" size={14} color="#666" />
              <Text style={styles.contactText}>{phone}</Text>
            </View>
          ) : null}
          {applicationDate && (
            <View style={styles.contactRow}>
              <Ionicons name="calendar-outline" size={14} color="#666" />
              <Text style={styles.contactText}>{(() => { const d = new Date(applicationDate); return isNaN(d.getTime()) ? 'Date inconnue' : 'Postulé le: ' + d.toLocaleDateString(); })()}</Text>
            </View>
          )}
        </View>

        <View style={styles.badgeRow}>
          <View style={styles.roleBadge}>
            <Ionicons name="person-outline" size={12} color="#0056FF" />
            <Text style={styles.roleText}>{getRoleLabel(item.role)}</Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.viewProfileBtn} onPress={() => navigation.navigate('ProfilCandidat', { applicant: item })}>
            <MaterialIcons name="perm-identity" size={14} color="#FFF" />
            <Text style={styles.btnText}>Profil</Text>
          </TouchableOpacity>
          {item.status === 'PENDING' && (
            <>
              <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAccept(item.id)}>
                <Ionicons name="checkmark" size={14} color="#FFF" />
                <Text style={styles.btnText}>Accepter</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReject(item.id)}>
                <Ionicons name="close" size={14} color="#FFF" />
                <Text style={styles.btnText}>Rejeter</Text>
              </TouchableOpacity>
            </>
          )}
          <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)}>
            <MaterialIcons name="delete-outline" size={14} color="#FFF" />
            <Text style={styles.btnText}>Supprimer</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Candidatures reçues</Text>
        <View style={styles.headerSpacer} />
      </View>

      <FlatList
        data={requests}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={48} color="#CCC" />
            <Text style={styles.emptyText}>Aucune candidature reçue</Text>
          </View>
        }
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
  requestCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: '#F0F0F0' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  applicantHeader: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: { width: 48, height: 48, borderRadius: 24, marginRight: 12 },
  avatarPlaceholder: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#0056FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  applicantInfo: { flex: 1 },
  studentName: { fontSize: 15, fontWeight: '600', color: '#111', letterSpacing: -0.2 },
  internshipRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  internshipTitle: { fontSize: 12, color: '#0056FF', fontWeight: '600' },
  contactInfo: { marginBottom: 12, gap: 4 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  contactText: { fontSize: 13, color: '#666', fontWeight: '500' },
  badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  roleBadge: { backgroundColor: '#E8F0FF', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4 },
  roleText: { color: '#0056FF', fontSize: 11, fontWeight: '600' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4 },
  statusBadgeText: { fontSize: 11, fontWeight: '600' },
  actionButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  viewProfileBtn: { backgroundColor: '#0056FF', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4 },
  acceptBtn: { backgroundColor: '#34C759', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4 },
  rejectBtn: { backgroundColor: '#FF3B30', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4 },
  deleteBtn: { backgroundColor: '#8E8E93', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4 },
  btnText: { color: '#FFF', fontWeight: '600', fontSize: 12 },
  emptyContainer: { alignItems: 'center', paddingVertical: 80 },
  emptyText: { textAlign: 'center', color: '#999', fontSize: 14, fontWeight: '500', marginTop: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
  sectionIconContainer: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#E8F0FF', justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111', letterSpacing: -0.2 }
});

export default AccepterDemandesStageScreen;
