import React, { useState, useCallback, useFocusEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, FlatList, RefreshControl, Alert, Image, ScrollView, TextInput } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { getApplicants, updateApplicationStatus, deleteApplication, createEvaluation } from '../services/api';
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

const EvaluationModal = ({ visible, onClose, applicantId, internshipId, internshipCompanyId, onSave }) => {
  const [behaviorRating, setBehaviorRating] = useState('');
  const [skillsRating, setSkillsRating] = useState('');
  const [comment, setComment] = useState('');
  const currentUser = getCurrentLoggedInUser();

  const handleSave = async () => {
    if (!behaviorRating || !skillsRating) {
      Alert.alert('Erreur', 'Veuillez sélectionner les notes de comportement et de compétences');
      return;
    }
    if (!currentUser) {
      Alert.alert('Erreur', 'Utilisateur non connecté');
      return;
    }
    if (currentUser.id !== internshipCompanyId) {
      Alert.alert("Erreur", "Vous n'êtes pas autorisé à évaluer ce candidat");
      return;
    }
    const result = await createEvaluation({
      internshipId,
      applicantId,
      companyId: internshipCompanyId,
      behaviorRating,
      skillsRating,
      comment
    });
    if (result.success) {
      Alert.alert('Succès', 'Évaluation enregistrée');
      onClose();
      onSave();
    } else {
      Alert.alert('Erreur', result.error || 'Échec de l\'évaluation');
    }
  };

  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Nouvelle évaluation</Text>
          <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
            <Ionicons name="close" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.formGroup}>
          <View style={styles.labelRow}>
            <Ionicons name="person-outline" size={16} color="#0056FF" />
            <Text style={styles.label}>Comportement</Text>
          </View>
          <View style={styles.ratingRow}>
            {['Excellent', 'Good', 'Average', 'Poor'].map((r) => (
              <TouchableOpacity
                key={r}
                style={[styles.ratingChip, behaviorRating === r && { backgroundColor: '#0056FF', borderColor: '#0056FF' }]}
                onPress={() => setBehaviorRating(r)}
              >
                <Text style={[styles.ratingChipText, behaviorRating === r && styles.ratingChipTextActive]}>{r}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.formGroup}>
          <View style={styles.labelRow}>
            <Ionicons name="star-outline" size={16} color="#0056FF" />
            <Text style={styles.label}>Compétences</Text>
          </View>
          <View style={styles.ratingRow}>
            {['Excellent', 'Good', 'Average', 'Poor'].map((r) => (
              <TouchableOpacity
                key={r}
                style={[styles.ratingChip, skillsRating === r && { backgroundColor: '#0056FF', borderColor: '#0056FF' }]}
                onPress={() => setSkillsRating(r)}
              >
                <Text style={[styles.ratingChipText, skillsRating === r && styles.ratingChipTextActive]}>{r}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.formGroup}>
          <View style={styles.labelRow}>
            <Ionicons name="chatbubble-outline" size={16} color="#0056FF" />
            <Text style={styles.label}>Commentaire (optionnel)</Text>
          </View>
          <View style={styles.commentInputWrapper}>
            <TextInput style={styles.commentInput} placeholder="Commentaire..." value={comment} onChangeText={setComment} multiline />
          </View>
        </View>

        <View style={styles.modalActions}>
          <TouchableOpacity style={styles.modalCancel} onPress={onClose}>
            <Text style={styles.modalCancelText}>Annuler</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.modalSubmit} onPress={handleSave}>
            <Ionicons name="checkmark" size={16} color="#FFF" />
            <Text style={styles.modalSubmitText}>Enregistrer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};
const ApplicantsScreen = ({ navigation, route }) => {
  const [applicants, setApplicants] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showEvalModal, setShowEvalModal] = useState(false);
  const [selectedApplicantId, setSelectedApplicantId] = useState(null);
  const internship = route.params?.internship;
  const internshipId = internship?.id || route.params?.internshipId;
  const currentUser = getCurrentLoggedInUser();

  const fetchApplicants = useCallback(async () => {
    if (!internshipId) return;
    const result = await getApplicants(internshipId);
    if (result.success) {
      setApplicants(result.applicants);
    } else {
      Alert.alert('Erreur', result.error || 'Échec du chargement des candidatures');
    }
  }, [internshipId]);

  useFocusEffect(useCallback(() => { fetchApplicants(); }, [fetchApplicants]));

  const onRefresh = async () => { setRefreshing(true); await fetchApplicants(); setRefreshing(false); };

  const handleAccept = async (applicantId) => {
    const result = await updateApplicationStatus(applicantId, 'ACCEPTED', internship?.companyId || currentUser?.id);
    if (result.success) {
      Alert.alert('Succès', 'Candidature acceptée');
      fetchApplicants();
    } else {
      Alert.alert('Erreur', result.error || 'Échec');
    }
  };

  const handleReject = async (applicantId) => {
    const result = await updateApplicationStatus(applicantId, 'REJECTED', internship?.companyId || currentUser?.id);
    if (result.success) {
      Alert.alert('Succès', 'Candidature rejetée');
      fetchApplicants();
    } else {
      Alert.alert('Erreur', result.error || 'Échec');
    }
  };

  const handleDelete = async (applicantId) => {
    Alert.alert('Confirmer', 'Supprimer cette candidature ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => {
        const result = await deleteApplication(applicantId);
        if (result.success) { fetchApplicants(); }
      }}
    ]);
  };

  const openEvaluation = (applicantId) => { setSelectedApplicantId(applicantId); setShowEvalModal(true); };

  const renderApplicant = ({ item }) => {
    const firstName = item.firstName || item.first_name || item.student_first_name || item.teacher_first_name || '';
    const lastName = item.lastName || item.last_name || item.student_last_name || item.teacher_last_name || '';
    const profilePhoto = item.profilePhoto || item.profile_photo || item.student_profile_photo || item.teacher_profile_photo;
    const email = item.email || '';
    const phone = item.phone || item.phoneNumber || '';
    const applicationDate = item.appliedAt || item.applied_at || item.created_at;
    const badgeLetter = (firstName?.[0] || '') + (lastName?.[0] || '') || '?';

   return (
      <View style={styles.applicantCard}>
        <TouchableOpacity style={styles.applicantMain} onPress={() => navigation.navigate('ProfilCandidat', { applicant: item })}>
          <View style={styles.applicantHeader}>
            {profilePhoto ? <Image source={{ uri: profilePhoto }} style={styles.avatarImage} /> : <View style={styles.avatarPlaceholder}><Text style={styles.avatarText}>{badgeLetter}</Text></View>}
            <View style={styles.applicantInfo}>
              <Text style={styles.applicantName}>{firstName} {lastName}</Text>
              <View style={styles.emailRow}>
                <Ionicons name="mail-outline" size={13} color="#666" />
                <Text style={styles.applicantEmail}>{email}</Text>
              </View>
              {phone ? (
                <View style={styles.phoneRow}>
                  <Ionicons name="call-outline" size={13} color="#666" />
                  <Text style={styles.applicantPhone}>{phone}</Text>
                </View>
              ) : null}
              <View style={styles.badgeRow}>
                <View style={styles.roleBadge}>
                  <Ionicons name="person-outline" size={11} color="#0056FF" />
                  <Text style={styles.roleBadgeText}>{item.role === 'STUDENT' ? 'Étudiant' : item.role === 'TEACHER' || item.role === 'PROFESSOR' ? 'Professeur' : item.role}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                  <Ionicons name={item.status === 'ACCEPTED' ? 'checkmark-circle' : item.status === 'REJECTED' ? 'close-circle' : 'time'} size={12} color={getStatusColor(item.status)} />
                  <Text style={[styles.statusBadgeText, { color: getStatusColor(item.status) }]}>{getStatusLabel(item.status)}</Text>
                </View>
              </View>
              <Text style={styles.applicantDate}>{(() => { const d = new Date(applicationDate); return isNaN(d.getTime()) ? '' : 'Postulé le: ' + d.toLocaleDateString(); })()}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#CCC" />
          </View>
          {item.message && <Text style={styles.applicantMessage} numberOfLines={2}>{item.message}</Text>}
        </TouchableOpacity>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.viewProfileButton} onPress={() => navigation.navigate('ProfilCandidat', { applicant: item })}>
            <MaterialIcons name="perm-identity" size={13} color="#FFF" />
            <Text style={styles.actionText}>Profil</Text>
          </TouchableOpacity>
          {item.status === 'PENDING' && (
            <>
              <TouchableOpacity style={styles.acceptButton} onPress={() => handleAccept(item.id)}>
                <Ionicons name="checkmark" size={13} color="#FFF" />
                <Text style={styles.actionText}>Accepter</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.rejectButton} onPress={() => handleReject(item.id)}>
                <Ionicons name="close" size={13} color="#FFF" />
                <Text style={styles.actionText}>Rejeter</Text>
              </TouchableOpacity>
            </>
          )}
          {item.status === 'ACCEPTED' && <TouchableOpacity style={styles.evalButton} onPress={() => openEvaluation(item.id)}>
            <Ionicons name="create-outline" size={13} color="#FFF" />
            <Text style={styles.actionText}>Évaluer</Text>
          </TouchableOpacity>}
          <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item.id)}>
            <MaterialIcons name="delete-outline" size={13} color="#FFF" />
            <Text style={styles.actionText}>Supprimer</Text>
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
        <Text style={styles.headerTitle} numberOfLines={1}>{internship?.title || 'Candidatures'}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <FlatList
        data={applicants}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderApplicant}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={48} color="#CCC" />
            <Text style={styles.emptyText}>Aucune candidature pour ce stage</Text>
          </View>
        }
      />

      <EvaluationModal visible={showEvalModal} onClose={() => setShowEvalModal(false)} applicantId={selectedApplicantId} internshipId={internshipId} internshipCompanyId={internship?.companyId} onSave={fetchApplicants} />
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
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#111', letterSpacing: -0.3, flex: 1, textAlign: 'center', marginHorizontal: 12 },
  headerSpacer: { width: 40 },
  list: { padding: 16, paddingBottom: 20 },
  applicantCard: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: '#F0F0F0'
  },
  applicantMain: { marginBottom: 12 },
  applicantHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  avatarPlaceholder: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#0056FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarImage: { width: 44, height: 44, borderRadius: 22, marginRight: 12 },
  avatarText: { color: '#FFF', fontSize: 17, fontWeight: '700' },
  applicantInfo: { flex: 1 },
  applicantName: { fontSize: 15, fontWeight: '600', color: '#111', letterSpacing: -0.2 },
  emailRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  applicantEmail: { fontSize: 13, color: '#666', fontWeight: '500' },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  applicantPhone: { fontSize: 13, color: '#666', fontWeight: '500' },
  badgeRow: { flexDirection: 'row', marginTop: 8, gap: 8 },
  roleBadge: { backgroundColor: '#E8F0FF', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4 },
  roleBadgeText: { color: '#0056FF', fontSize: 11, fontWeight: '600' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4 },
  statusBadgeText: { fontSize: 11, fontWeight: '600' },
  applicantMessage: { fontSize: 14, color: '#333', marginBottom: 8, fontStyle: 'italic', lineHeight: 20 },
  applicantDate: { fontSize: 12, color: '#999', marginTop: 4, fontWeight: '500' },
  actionButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  viewProfileButton: { backgroundColor: '#0056FF', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4 },
  acceptButton: { backgroundColor: '#34C759', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4 },
  rejectButton: { backgroundColor: '#FF3B30', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4 },
  evalButton: { backgroundColor: '#FF9500', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4 },
  deleteButton: { backgroundColor: '#8E8E93', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionText: { color: '#FFF', fontWeight: '600', fontSize: 12 },
  emptyContainer: { alignItems: 'center', paddingVertical: 80 },
  emptyText: { textAlign: 'center', color: '#999', fontSize: 14, fontWeight: '500', marginTop: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111', letterSpacing: -0.3 },
  modalCloseButton: { padding: 6, borderRadius: 10, backgroundColor: '#F8F9FA' },
  formGroup: { marginBottom: 16 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  label: { fontSize: 14, fontWeight: '600', color: '#333' },
  ratingRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  ratingChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: '#F5F5F5', borderWidth: 1.5, borderColor: '#E0E0E0' },
  ratingChipActive: { backgroundColor: '#0056FF', borderColor: '#0056FF' },
  ratingChipText: { fontSize: 13, color: '#666', fontWeight: '500' },
  ratingChipTextActive: { color: '#FFF', fontWeight: '600' },
  commentInputWrapper: { backgroundColor: '#F8F9FA', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#F0F0F0', maxHeight: 120 },
  commentInput: { fontSize: 15, color: '#111', minHeight: 80, textAlignVertical: 'top' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 24 },
  modalCancel: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, backgroundColor: '#F8F9FA' },
  modalCancelText: { color: '#666', fontWeight: '600' },
  modalSubmit: { backgroundColor: '#0056FF', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 6 },
  modalSubmitText: { color: '#FFF', fontWeight: '600' }
});

export default ApplicantsScreen;
