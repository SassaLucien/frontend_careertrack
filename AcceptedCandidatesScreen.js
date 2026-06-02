import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, FlatList, Image, Alert, RefreshControl, ScrollView } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { getAcceptedCandidates, getEvaluationsByApplicant, getApplicationCounts } from '../services/api';

const getRoleLabel = (role) => {
  switch (role) {
    case 'STUDENT': return 'Étudiant';
    case 'TEACHER':
    case 'PROFESSOR': return 'Professeur';
    default: return role;
  }
};

const SectionHeader = ({ title, icon }) => (
  <View style={styles.sectionHeader}>
    <View style={styles.sectionIconContainer}>
      <Ionicons name={icon} size={18} color="#0056FF" />
    </View>
    <Text style={styles.sectionTitle}>{title}</Text>
  </View>
);

const AcceptedCandidatesScreen = ({ navigation, route }) => {
  const [candidates, setCandidates] = useState([]);
  const [counts, setCounts] = useState({ total: 0, pending: 0, accepted: 0, rejected: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [evaluations, setEvaluations] = useState([]);
  const internship = route.params?.internship;
  const internshipId = internship?.id || route.params?.internshipId;

  const fetchCandidates = useCallback(async () => {
    if (!internshipId) return;
    const result = await getAcceptedCandidates(internshipId);
    if (result.success) {
      setCandidates(result.candidates || []);
    } else {
      Alert.alert('Erreur', result.error || 'Échec du chargement');
    }
    const countResult = await getApplicationCounts(internshipId);
    if (countResult.success) {
      setCounts(countResult.counts);
    }
  }, [internshipId]);

  const loadEvaluations = async (applicantId) => {
    const result = await getEvaluationsByApplicant(applicantId);
    if (result.success) {
      setEvaluations(result.evaluations || []);
      setSelectedCandidate(
        candidates.find(c => (c.id || c.applicationId) === applicantId) || null
      );
    }
  };

  useFocusEffect(useCallback(() => { fetchCandidates(); }, [fetchCandidates]));

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCandidates();
    setRefreshing(false);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '-';
      return d.toLocaleDateString('fr-FR');
    } catch { return '-'; }
  };

  const renderCandidate = ({ item }) => {
    const firstName = item.firstName || item.first_name || item.student_first_name || item.teacher_first_name || '';
    const lastName = item.lastName || item.last_name || item.student_last_name || item.teacher_last_name || '';
    const profilePhoto = item.profilePhoto || item.profile_photo || item.student_profile_photo || item.teacher_profile_photo;
    const email = item.email || 'Non renseigné';
    const phone = item.phone || item.phoneNumber || '';
    const badgeLetter = (firstName?.[0] || '') + (lastName?.[0] || '') || '?';

    return (
      <TouchableOpacity style={styles.candidateCard} onPress={() => loadEvaluations(item.id || item.applicationId)}>
        <View style={styles.candidateHeader}>
          {profilePhoto ? (
            <Image source={{ uri: profilePhoto }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{badgeLetter}</Text>
            </View>
          )}
          <View style={styles.candidateInfo}>
            <Text style={styles.candidateName}>{firstName} {lastName}</Text>
            <View style={styles.emailRow}>
              <Ionicons name="mail-outline" size={14} color="#666" />
              <Text style={styles.candidateEmail}>{email}</Text>
            </View>
            {phone ? (
              <View style={styles.phoneRow}>
                <Ionicons name="call-outline" size={14} color="#666" />
                <Text style={styles.candidatePhone}>{phone}</Text>
              </View>
            ) : null}
            <View style={styles.badgeRow}>
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>{getRoleLabel(item.role)}</Text>
              </View>
              <View style={styles.statusBadge}>
                <Ionicons name="checkmark-circle" size={12} color="#2E7D32" />
                <Text style={styles.statusBadgeText}>Accepté</Text>
              </View>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#CCC" />
        </View>

        <View style={styles.progressWrapper}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '100%' }]} />
          </View>
          <Text style={styles.progressText}>Stage en cours</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{internship?.title || 'Candidats acceptés'}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.countsContainer}>
        <View style={[styles.countCard, { backgroundColor: '#E8F0FF' }]}>
          <Ionicons name="document-text-outline" size={18} color="#0056FF" />
          <Text style={styles.countNumber}>{counts.total}</Text>
          <Text style={styles.countLabel}>Total</Text>
        </View>
        <View style={[styles.countCard, { backgroundColor: '#FFF3E0' }]}>
          <Ionicons name="time-outline" size={18} color="#FF9500" />
          <Text style={styles.countNumber}>{counts.pending}</Text>
          <Text style={styles.countLabel}>En attente</Text>
        </View>
        <View style={[styles.countCard, { backgroundColor: '#E8F5E9' }]}>
          <Ionicons name="checkmark-circle-outline" size={18} color="#34C759" />
          <Text style={styles.countNumber}>{counts.accepted}</Text>
          <Text style={[styles.countLabel, { color: '#2E7D32' }]}>Acceptés</Text>
        </View>
        <View style={[styles.countCard, { backgroundColor: '#FFEBEE' }]}>
          <Ionicons name="close-circle-outline" size={18} color="#FF3B30" />
          <Text style={styles.countNumber}>{counts.rejected}</Text>
          <Text style={[styles.countLabel, { color: '#C62828' }]}>Rejetés</Text>
        </View>
      </View>

      <FlatList
        data={candidates}
        keyExtractor={(item) => (item.id || item.applicationId || item.userId).toString()}
        renderItem={renderCandidate}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color="#CCC" />
            <Text style={styles.emptyText}>Aucun candidat accepté pour ce stage</Text>
          </View>
        }
      />

      {selectedCandidate && (
        <View style={styles.evalPanel}>
          <View style={styles.evalPanelHeader}>
            <View style={styles.evalPanelTitleRow}>
              <Text style={styles.evalPanelTitle}>Candidat sélectionné</Text>
              <TouchableOpacity onPress={() => { setSelectedCandidate(null); setEvaluations([]); }} style={styles.closePanelButton}>
                <Ionicons name="close" size={20} color="#666" />
              </TouchableOpacity>
            </View>
            <Text style={styles.evalPanelSubtitle}>
              {selectedCandidate.firstName || selectedCandidate.student_first_name || selectedCandidate.teacher_first_name || ''} {selectedCandidate.lastName || selectedCandidate.student_last_name || selectedCandidate.teacher_last_name || ''}
            </Text>
            <View style={styles.inProgressRow}>
              <Ionicons name="briefcase-outline" size={16} color="#2E7D32" />
              <Text style={styles.inProgressLabel}>Statut du stage : En cours</Text>
            </View>
          </View>

          <FlatList
            data={evaluations}
            keyExtractor={(ev, idx) => ev.id ? ev.id.toString() : idx.toString()}
            ListEmptyComponent={<Text style={styles.noEvalText}>Aucune évaluation pour ce candidat</Text>}
            renderItem={({ item }) => (
              <View style={styles.evalCard}>
                <View style={styles.evalRow}>
                  <View style={styles.evalLabelRow}>
                    <Ionicons name="person-outline" size={14} color="#666" />
                    <Text style={styles.evalLabel}>Comportement</Text>
                  </View>
                  <View style={[styles.evalPill, { backgroundColor: item.behaviorRating === 'Excellent' ? '#E8F5E9' : item.behaviorRating === 'Good' ? '#E3F2FD' : '#FFF3E0' }]}>
                    <Text style={[styles.evalPillText, { color: item.behaviorRating === 'Excellent' ? '#2E7D32' : item.behaviorRating === 'Good' ? '#0056FF' : '#FF9500' }]}>{item.behaviorRating || 'Non évalué'}</Text>
                  </View>
                </View>
                <View style={styles.evalRow}>
                  <View style={styles.evalLabelRow}>
                    <Ionicons name="star-outline" size={14} color="#666" />
                    <Text style={styles.evalLabel}>Compétences</Text>
                  </View>
                  <View style={[styles.evalPill, { backgroundColor: item.skillsRating === 'Excellent' ? '#E8F5E9' : item.skillsRating === 'Good' ? '#E3F2FD' : '#FFF3E0' }]}>
                    <Text style={[styles.evalPillText, { color: item.skillsRating === 'Excellent' ? '#2E7D32' : item.skillsRating === 'Good' ? '#0056FF' : '#FF9500' }]}>{item.skillsRating || 'Non évalué'}</Text>
                  </View>
                </View>
                {item.comment && item.comment !== '' && (
                  <View style={styles.evalCommentBlock}>
                    <View style={styles.evalCommentLabelRow}>
                      <Ionicons name="chatbubble-outline" size={14} color="#666" />
                      <Text style={styles.evalCommentLabel}>Commentaire</Text>
                    </View>
                    <Text style={styles.evalCommentText}>{item.comment}</Text>
                  </View>
                )}
                <Text style={styles.evalDate}>Le {formatDate(item.evaluationDate)}</Text>
              </View>
            )}
          />
        </View>
      )}
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
  countsContainer: {
    flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 16,
    backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
    justifyContent: 'space-between', gap: 10
  },
  countCard: { borderRadius: 14, padding: 12, alignItems: 'center', minWidth: 70, flex: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1, borderWidth: 1, borderColor: '#F0F0F0' },
  countNumber: { fontSize: 22, fontWeight: '700', color: '#111', marginTop: 6 },
  countLabel: { fontSize: 11, color: '#666', marginTop: 2, textAlign: 'center', fontWeight: '500' },
  list: { padding: 16, paddingBottom: 20 },
  candidateCard: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: '#F0F0F0'
  },
  candidateHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 56, height: 56, borderRadius: 28, marginRight: 14 },
  avatarPlaceholder: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#0056FF', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  avatarText: { color: '#FFF', fontSize: 20, fontWeight: '700' },
  candidateInfo: { flex: 1 },
  candidateName: { fontSize: 16, fontWeight: '600', color: '#111', letterSpacing: -0.2 },
  emailRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  candidateEmail: { fontSize: 13, color: '#666', fontWeight: '500' },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  candidatePhone: { fontSize: 13, color: '#666', fontWeight: '500' },
  badgeRow: { flexDirection: 'row', marginTop: 8, gap: 8 },
  roleBadge: { backgroundColor: '#E8F0FF', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4 },
  roleBadgeText: { color: '#0056FF', fontSize: 11, fontWeight: '600' },
  statusBadge: { backgroundColor: '#E8F5E9', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4 },
  statusBadgeText: { color: '#2E7D32', fontSize: 11, fontWeight: '600' },
  progressWrapper: { marginTop: 12 },
  progressBar: { height: 8, borderRadius: 4, backgroundColor: '#E8F5E9', overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#34C759', borderRadius: 4 },
  progressText: { position: 'absolute', width: '100%', textAlign: 'center', fontSize: 10, color: '#2E7D32', fontWeight: '600', marginTop: 1 },
  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { textAlign: 'center', color: '#999', fontSize: 14, fontWeight: '500', marginTop: 12 },
  evalPanel: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingTop: 20, paddingHorizontal: 20, paddingBottom: 24, maxHeight: '60%',
    borderTopWidth: 1, borderTopColor: '#F0F0F0', shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 10
  },
  evalPanelHeader: { marginBottom: 16 },
  evalPanelTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  evalPanelTitle: { fontSize: 17, fontWeight: '700', color: '#111', letterSpacing: -0.3 },
  closePanelButton: { padding: 6, borderRadius: 10, backgroundColor: '#F8F9FA' },
  evalPanelSubtitle: { fontSize: 15, color: '#333', marginBottom: 10, fontWeight: '600', letterSpacing: -0.2 },
  inProgressRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  inProgressLabel: { fontSize: 13, color: '#2E7D32', fontWeight: '600' },
  noEvalText: { textAlign: 'center', color: '#999', fontSize: 14, paddingVertical: 24, fontWeight: '500' },
  evalCard: { backgroundColor: '#F9F9F9', padding: 16, borderRadius: 14, marginBottom: 12, borderWidth: 1, borderColor: '#F0F0F0' },
  evalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  evalLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  evalLabel: { fontSize: 13, color: '#666', fontWeight: '500' },
  evalValue: { fontSize: 13, fontWeight: '600', color: '#111' },
  evalPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  evalPillText: { fontSize: 12, fontWeight: '600' },
  evalCommentBlock: { marginTop: 10, backgroundColor: '#FFF', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#F0F0F0' },
  evalCommentLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  evalCommentLabel: { fontSize: 12, color: '#666', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },
  evalCommentText: { fontSize: 14, color: '#333', lineHeight: 20 },
  evalDate: { fontSize: 12, color: '#999', marginTop: 10, fontWeight: '500' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
  sectionIconContainer: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#E8F0FF', justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111', letterSpacing: -0.2 }
});

export default AcceptedCandidatesScreen;
