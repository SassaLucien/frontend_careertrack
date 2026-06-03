import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Image, ScrollView, TouchableOpacity, Alert, Modal, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { updateApplicationStatus, deleteApplication, getEvaluationsByInternship, getEvaluationsByUser, createEvaluation, getCompanyById, getCompaniesWithEvaluations } from '../services/api';
import { getCurrentLoggedInUser } from '../services/tempStorage';

const ProfilCandidatScreen = ({ route, navigation }) => {
  const { applicant } = route.params || {};
  
  if (!applicant) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#111" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Erreur</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#666' }}>Aucun candidat spécifié</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentUser = getCurrentLoggedInUser();
  const [evaluations, setEvaluations] = useState([]);
  const [showEvalModal, setShowEvalModal] = useState(false);
  const [behaviorRating, setBehaviorRating] = useState('');
  const [skillsRating, setSkillsRating] = useState('');
  const [evalComment, setEvalComment] = useState('');
  const [company, setCompany] = useState(null);
  const [companiesWithEvaluations, setCompaniesWithEvaluations] = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const internshipId = applicant.internshipId || applicant.internship_id;
  const companyId = applicant.companyId;
  const applicantUserId = applicant.userId || applicant.user?.id || applicant.applicantUserId;
  const effectiveUserId = applicantUserId || applicant.userId;

  const getRoleLabel = (role) => {
    switch (role) {
      case 'STUDENT': return 'Étudiant';
      case 'TEACHER':
      case 'PROFESSOR': return 'Professeur';
      default: return role || 'Inconnu';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'PENDING': return 'En attente';
      case 'ACCEPTED': return 'Accepté';
      case 'REJECTED': return 'Rejeté';
      default: return status || 'En attente';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return '#FF9500';
      case 'ACCEPTED': return '#34C759';
      case 'REJECTED': return '#FF3B30';
      default: return '#8E8E93';
    }
  };

  const role = applicant.role;
  const firstName = applicant.firstName || applicant.first_name || applicant.student_first_name || applicant.teacher_first_name || '';
  const lastName = applicant.lastName || applicant.last_name || applicant.student_last_name || applicant.teacher_last_name || '';
  const profilePhoto = applicant.profilePhoto || applicant.profile_photo || applicant.student_profile_photo || applicant.teacher_profile_photo;
  const email = applicant.email || 'Non renseigné';
  const phone = applicant.phone || applicant.phoneNumber || '';
  const university = applicant.university;
  const graduationYear = applicant.graduationYear || applicant.graduation_year;
  const skills = applicant.skills;
  const department = applicant.department;
  const subject = applicant.subject;
  const experience = applicant.experience;
  const applicationDate = applicant.appliedAt || applicant.applied_at || applicant.applicationDate || applicant.created_at;
  const applicationId = applicant.id || applicant.applicationId;

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return null;
      return d.toLocaleDateString('fr-FR');
    } catch {
      return null;
    }
  };

  const getRoleIcon = () => {
    switch (role) {
      case 'STUDENT': return 'school-outline';
      case 'TEACHER': return 'people-outline';
      default: return 'person-outline';
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    if (!applicationId) return;
    Alert.alert(
      'Confirmer',
      `Voulez-vous ${newStatus === 'ACCEPTED' ? 'accepter' : 'rejeter'} cette candidature ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            const result = await updateApplicationStatus(applicationId, newStatus);
            if (result.success) {
              Alert.alert('Succès', `Candidature ${newStatus === 'ACCEPTED' ? 'acceptée' : 'rejetée'} avec succès`);
              navigation.goBack();
            } else {
              Alert.alert('Erreur', result.error || 'Échec de la mise à jour');
            }
          }
        }
      ]
    );
  };

  const handleDelete = async () => {
    if (!applicationId) return;
    Alert.alert(
      'Confirmer la suppression',
      'Êtes-vous sûr de vouloir supprimer cette candidature ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteApplication(applicationId);
            if (result.success) {
              Alert.alert('Succès', 'Candidature supprimée');
              navigation.goBack();
            } else {
              Alert.alert('Erreur', result.error || 'Échec de la suppression');
            }
          }
        }
      ]
    );
  };

  const loadEvaluations = async () => {
    if (applicationId && internshipId) {
      const result = await getEvaluationsByInternship(internshipId);
      if (result.success) {
        setEvaluations(result.evaluations || []);
      }
    } else if (effectiveUserId) {
      const result = await getEvaluationsByUser(effectiveUserId);
      if (result.success) {
        setEvaluations(result.evaluations || []);
      }
    }
  };

  const handleSubmitEvaluation = async () => {
    if (!internshipId || !applicationId) {
      Alert.alert('Erreur', 'Données manquantes pour l\'évaluation');
      return;
    }
const result = await createEvaluation({
       internshipId,
       applicantId: applicationId,
       companyId: currentUser?.companyId || companyId || currentUser?.id,
       behaviorRating,
       skillsRating,
       comment: evalComment
     });
    if (result.success) {
      Alert.alert('Succès', 'Évaluation enregistrée');
      setShowEvalModal(false);
      setBehaviorRating('');
      setSkillsRating('');
      setEvalComment('');
      loadEvaluations();
    } else {
      Alert.alert('Erreur', result.error || 'Échec de l\'évaluation');
    }
  };

  useEffect(() => {
    const fetchCompany = async () => {
      if (!companyId) {
        setCompany(null);
        return;
      }
      const result = await getCompanyById(companyId);
      if (result.success) {
        setCompany(result.company || null);
      } else {
        setCompany(null);
      }
    };
    fetchCompany();
  }, [companyId]);

useEffect(() => {
     loadEvaluations();
   }, [applicationId, effectiveUserId]);

   useEffect(() => {
     const fetchCompaniesWithEvaluations = async () => {
       if (!effectiveUserId) return;
       setLoadingCompanies(true);
       const result = await getCompaniesWithEvaluations(effectiveUserId);
       if (result.success) {
         setCompaniesWithEvaluations(result.companies || []);
       }
       setLoadingCompanies(false);
     };
     fetchCompaniesWithEvaluations();
   }, [effectiveUserId]);

  const InfoSection = ({ icon, title, children }) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIconContainer}>
          <Ionicons name={icon} size={18} color="#0056FF" />
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );

  const InfoRow = ({ label, value, icon }) => (
    <View style={styles.infoRow}>
      {icon && <Ionicons name={icon} size={16} color="#666" style={styles.infoIcon} />}
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profil candidat</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileCard}>
          <View style={styles.avatarSection}>
            {profilePhoto ? (
              <Image source={{ uri: profilePhoto }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={48} color="#FFF" />
              </View>
            )}
            <View style={styles.roleBadge}>
              <Ionicons name={getRoleIcon()} size={14} color="#0056FF" />
              <Text style={styles.roleBadgeText}>{getRoleLabel(role)}</Text>
            </View>
          </View>

          <View style={styles.nameSection}>
            <Text style={styles.name}>{firstName} {lastName}</Text>
            {applicant.status && (
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(applicant.status) + '20' }]}>
                <Ionicons name={applicant.status === 'ACCEPTED' ? 'checkmark-circle' : applicant.status === 'REJECTED' ? 'close-circle' : 'time'} size={14} color={getStatusColor(applicant.status)} />
                <Text style={[styles.statusBadgeText, { color: getStatusColor(applicant.status) }]}>
                  {getStatusLabel(applicant.status)}
                </Text>
              </View>
            )}
          </View>
        </View>

        <InfoSection icon="mail-outline" title="Contact">
          <InfoRow icon="mail-outline" label="Email" value={email} />
          {phone && <InfoRow icon="call-outline" label="Téléphone" value={phone} />}
        </InfoSection>

        {role === 'STUDENT' && (
          <InfoSection icon="school-outline" title="Parcours étudiant">
            {university && <InfoRow icon="business" label="Université" value={university} />}
            {applicant.degree && <InfoRow icon="school" label="Niveau" value={applicant.degree} />}
            {graduationYear && <InfoRow icon="calendar" label="Année de diplomation" value={graduationYear} />}
            {skills && (
              <View style={styles.skillsContainer}>
                <Text style={styles.skillsLabel}>Compétences</Text>
                <View style={styles.skillsList}>
                  {(Array.isArray(skills) ? skills : [skills]).map((skill, idx) => (
                    <View key={idx} style={styles.skillChip}>
                      <Text style={styles.skillText}>{skill}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
            {applicant.diplomaImage && (
              <Image source={{ uri: applicant.diplomaImage }} style={styles.diplomaPreview} />
            )}
          </InfoSection>
        )}

        {role === 'TEACHER' && (
          <InfoSection icon="desk-outline" title="Informations professionnelles">
            {department && <InfoRow icon="business" label="Département" value={department} />}
            {subject && <InfoRow icon="book-outline" label="Matière" value={subject} />}
            {applicant.filiere && <InfoRow icon="library" label="Filière" value={applicant.filiere} />}
            {experience != null && <InfoRow icon="time-outline" label="Expérience" value={`${experience} ans`} />}
          </InfoSection>
        )}

        {applicant.internshipTitle && (
          <InfoSection icon="briefcase-outline" title="Stage postulé">
            <View style={styles.internshipCard}>
              <Text style={styles.internshipTitle}>{applicant.internshipTitle}</Text>
            </View>
          </InfoSection>
        )}

<InfoSection icon="calendar-outline" title="Candidature">
          <InfoRow label="Date de candidature" value={formatDate(applicationDate) || 'Non renseignée'} />
        </InfoSection>

        {loadingCompanies ? (
          <InfoSection icon="business-outline" title="Entreprises">
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#0056FF" />
              <Text style={styles.loadingText}>Chargement des entreprises...</Text>
            </View>
          </InfoSection>
        ) : (
          <InfoSection icon="business-outline" title="Entreprises ayant accepté la candidature">
            {companiesWithEvaluations.length > 0 ? (
              companiesWithEvaluations.map((comp, compIdx) => (
                <View key={`company-${comp.companyId || comp.id || compIdx}`} style={styles.companyCard}>
                  <View style={styles.companyHeader}>
                    {comp.profilePhoto ? (
                      <Image source={{ uri: comp.profilePhoto }} style={styles.companyAvatar} />
                    ) : (
                      <View style={styles.companyAvatarPlaceholder}>
                        <Ionicons name="business" size={28} color="#FFF" />
                      </View>
                    )}
                    <View style={styles.companyInfo}>
                      <Text style={styles.companyName}>{comp.companyName || comp.company_name || 'Entreprise'}</Text>
                      {comp.sector && <Text style={styles.companySector}>{comp.sector}</Text>}
                    </View>
                  </View>

                  {comp.applications && comp.applications.filter(app => app.behaviorRating || app.skillsRating).length > 0 && (
                    <View style={styles.evalSummaryBlock}>
                      <Text style={styles.evalSummaryTitle}>Évaluations</Text>
                      {comp.applications.filter(app => app.behaviorRating || app.skillsRating).map((app, innerIdx) => (
                        <View key={`eval-${app.applicationId || app.internshipId || innerIdx}`} style={styles.evalPillsRow}>
                          <View style={[styles.evalPill, { backgroundColor: app.behaviorRating === 'Excellent' ? '#E8F5E9' : app.behaviorRating === 'Good' ? '#E3F2FD' : '#FFF3E0' }]}>
                            <Text style={[styles.evalPillText, { color: app.behaviorRating === 'Excellent' ? '#2E7D32' : app.behaviorRating === 'Good' ? '#0056FF' : '#FF9500' }]}>
                              Comportement : {app.behaviorRating || 'Non évalué'}
                            </Text>
                          </View>
                          <View style={[styles.evalPill, { backgroundColor: app.skillsRating === 'Excellent' ? '#E8F5E9' : app.skillsRating === 'Good' ? '#E3F2FD' : '#FFF3E0' }]}>
                            <Text style={[styles.evalPillText, { color: app.skillsRating === 'Excellent' ? '#2E7D32' : app.skillsRating === 'Good' ? '#0056FF' : '#FF9500' }]}>
                              Compétences : {app.skillsRating || 'Non évalué'}
                            </Text>
                          </View>
                          {app.comment && (
                            <Text style={styles.evalCommentText}>{app.comment}</Text>
                          )}
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ))
            ) : applicantUserId ? (
              <View style={styles.emptyCompanies}>
                <Ionicons name="business-outline" size={32} color="#CCC" />
                <Text style={styles.emptyCompaniesText}>Aucune entreprise n'a accepté votre candidature</Text>
              </View>
            ) : null}
          </InfoSection>
        )}

{(applicationId || applicantUserId) && evaluations.length > 0 && (
          <View style={styles.evaluationsList}>
            {evaluations.map((ev, idx) => (
              <View key={idx} style={styles.evalCard}>
                <View style={styles.evalHeader}>
                  <Text style={styles.evalTitle}>Évaluation #{idx + 1}</Text>
                  <Text style={styles.evalDate}>{formatDate(ev.evaluationDate) || '-'}</Text>
                </View>
                <View style={styles.evalRow}>
                  <View style={styles.evalLabelRow}>
                    <Ionicons name="person-outline" size={14} color="#666" />
                    <Text style={styles.evalLabel}>Comportement</Text>
                  </View>
                  <View style={[styles.evalPill, { backgroundColor: ev.behaviorRating === 'Excellent' ? '#E8F5E9' : ev.behaviorRating === 'Good' ? '#E3F2FD' : '#FFF3E0' }]}>
                    <Text style={[styles.evalPillText, { color: ev.behaviorRating === 'Excellent' ? '#2E7D32' : ev.behaviorRating === 'Good' ? '#0056FF' : '#FF9500' }]}>
                      {ev.behaviorRating || 'Non évalué'}
                    </Text>
                  </View>
                </View>
                <View style={styles.evalRow}>
                  <View style={styles.evalLabelRow}>
                    <Ionicons name="star-outline" size={14} color="#666" />
                    <Text style={styles.evalLabel}>Compétences</Text>
                  </View>
                  <View style={[styles.evalPill, { backgroundColor: ev.skillsRating === 'Excellent' ? '#E8F5E9' : ev.skillsRating === 'Good' ? '#E3F2FD' : '#FFF3E0' }]}>
                    <Text style={[styles.evalPillText, { color: ev.skillsRating === 'Excellent' ? '#2E7D32' : ev.skillsRating === 'Good' ? '#0056FF' : '#FF9500' }]}>
                      {ev.skillsRating || 'Non évalué'}
                    </Text>
                  </View>
                </View>
                {ev.comment && ev.comment !== '' && (
                  <View style={styles.evalCommentBlock}>
                    <View style={styles.evalCommentLabelRow}>
                      <Ionicons name="chatbubble-outline" size={14} color="#666" />
                      <Text style={styles.evalCommentLabel}>Commentaire</Text>
                    </View>
                    <Text style={styles.evalCommentText}>{ev.comment}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      <Modal visible={showEvalModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nouvelle évaluation</Text>
              <TouchableOpacity onPress={() => setShowEvalModal(false)} style={styles.modalCloseButton}>
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
                <TextInput
                  style={styles.commentInput}
                  placeholder="Commentaire..."
                  placeholderTextColor="#999"
                  value={evalComment}
                  onChangeText={setEvalComment}
                  multiline
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowEvalModal(false)}>
                <Text style={styles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSubmit} onPress={handleSubmitEvaluation}>
                <Ionicons name="checkmark" size={16} color="#FFF" />
                <Text style={styles.modalSubmitText}>Enregistrer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  scrollContent: { paddingBottom: 40 },
  profileCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 28, marginHorizontal: 20, marginTop: 20, alignItems: 'center', borderWidth: 1, borderColor: '#F0F0F0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  avatarSection: { alignItems: 'center', marginBottom: 16 },
  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 12 },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#0056FF', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F0F4FF' },
  roleBadgeText: { fontSize: 13, fontWeight: '600', color: '#0056FF' },
  nameSection: { alignItems: 'center' },
  name: { fontSize: 22, fontWeight: '700', color: '#111', letterSpacing: -0.3, marginBottom: 10 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  statusBadgeText: { fontSize: 12, fontWeight: '600' },
  section: { marginTop: 20, marginHorizontal: 20, backgroundColor: '#FFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#F0F0F0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  diplomaPreview: { width: '100%', height: 180, borderRadius: 16, marginTop: 12, borderWidth: 1, borderColor: '#F0F0F0' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  sectionIconContainer: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#E8F0FF', justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111', letterSpacing: -0.2 },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F5F5F5', gap: 10 },
  infoIcon: { width: 20, textAlign: 'center' },
  infoLabel: { fontSize: 13, color: '#666', fontWeight: '500', width: 120 },
  infoValue: { flex: 1, fontSize: 14, color: '#111', fontWeight: '600', letterSpacing: -0.2 },
  skillsContainer: { marginTop: 4 },
  skillsLabel: { fontSize: 13, color: '#666', fontWeight: '500', marginBottom: 8 },
  skillsList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skillChip: { backgroundColor: '#E8F0FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  skillText: { fontSize: 12, color: '#0056FF', fontWeight: '600' },
  internshipCard: { backgroundColor: '#F8F9FA', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#F0F0F0' },
  internshipTitle: { fontSize: 15, fontWeight: '600', color: '#111', letterSpacing: -0.2 },
  actionsSection: { flexDirection: 'row', gap: 12, marginTop: 24, marginHorizontal: 20 },
  acceptButton: { flex: 1, backgroundColor: '#34C759', padding: 16, borderRadius: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, shadowColor: '#34C759', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3 },
  rejectButton: { flex: 1, backgroundColor: '#FF3B30', padding: 16, borderRadius: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, shadowColor: '#FF3B30', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3 },
  deleteButton: { backgroundColor: '#8E8E93', padding: 16, borderRadius: 14, alignItems: 'center', marginTop: 12, marginHorizontal: 20, flexDirection: 'row', justifyContent: 'center', gap: 8 },
  buttonText: { color: '#FFF', fontWeight: '600', fontSize: 15, letterSpacing: -0.2 },
  evalSection: { flexDirection: 'row', gap: 12, marginTop: 20, marginHorizontal: 20 },
  viewEvalButton: { flex: 1, backgroundColor: '#F0F4FF', padding: 14, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: '#D0DCFF' },
  viewEvalButtonText: { color: '#0056FF', fontWeight: '600', fontSize: 14 },
  addEvalButton: { flex: 1, backgroundColor: '#0056FF', padding: 14, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, shadowColor: '#0056FF', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3 },
  addEvalButtonText: { color: '#FFF', fontWeight: '600', fontSize: 14 },
  evaluationsList: { marginTop: 20, marginHorizontal: 20, gap: 12 },
  evalCard: { backgroundColor: '#FFF', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#F0F0F0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  evalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  evalTitle: { fontSize: 14, fontWeight: '700', color: '#111', letterSpacing: -0.2 },
  evalDate: { fontSize: 12, color: '#999', fontWeight: '500' },
  evalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  evalLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  evalLabel: { fontSize: 13, color: '#666', fontWeight: '500' },
  evalPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  evalPillText: { fontSize: 12, fontWeight: '600' },
  evalCommentBlock: { marginTop: 10, backgroundColor: '#F8F9FA', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#F0F0F0' },
  evalCommentLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  evalCommentLabel: { fontSize: 12, color: '#666', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },
  evalCommentText: { fontSize: 14, color: '#333', lineHeight: 20 },
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
  modalSubmitText: { color: '#FFF', fontWeight: '600' },
  companyCard: { backgroundColor: '#F8F9FA', borderRadius: 16, padding: 16, marginTop: 12, borderWidth: 1, borderColor: '#F0F0F0' },
  companyHeader: { flexDirection: 'row', alignItems: 'center' },
  companyAvatar: { width: 56, height: 56, borderRadius: 28, marginRight: 14 },
  companyAvatarPlaceholder: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#0056FF', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  companyInfo: { flex: 1 },
  companyName: { fontSize: 16, fontWeight: '700', color: '#111', letterSpacing: -0.2 },
  companySector: { fontSize: 13, color: '#666', fontWeight: '500', marginTop: 2 },
  evalSummaryBlock: { marginTop: 14 },
  evalSummaryTitle: { fontSize: 13, color: '#666', fontWeight: '600', marginBottom: 8 },
  evalPillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  loadingContainer: { padding: 20, alignItems: 'center' },
  loadingText: { marginTop: 8, fontSize: 14, color: '#666' },
  emptyCompanies: { padding: 20, alignItems: 'center' },
  emptyCompaniesText: { marginTop: 8, fontSize: 14, color: '#999', textAlign: 'center' }
});

export default ProfilCandidatScreen;