import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { getProfile, updateStudentProfile, updateTeacherProfile } from '../services/api';

const DEGREE_OPTIONS = ['BEPC', 'BAC', 'LICENCE', 'MASTER1', 'MASTER 2', 'DOCTORAT'];
const FILIERE_OPTIONS = ['Informatique', 'Mathématiques', 'Physique', 'Chimie', 'Biologie', 'Langues', 'Histoire', 'Gestion'];

const AcademicInfoScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const applicant = route.params?.applicant || route.params?.user || null;

  const [role, setRole] = useState(applicant?.role || '');
  const [firstName, setFirstName] = useState(applicant?.firstName || '');
  const [lastName, setLastName] = useState(applicant?.lastName || '');
  const [email, setEmail] = useState(applicant?.email || '');
  const [university, setUniversity] = useState(applicant?.university || '');
  const [graduationYear, setGraduationYear] = useState(applicant?.graduationYear || '');
  const [skills, setSkills] = useState(Array.isArray(applicant?.skills) ? applicant.skills.join(', ') : (applicant?.skills || ''));
  const [degree, setDegree] = useState(applicant?.degree || '');
  const [filiere, setFiliere] = useState(applicant?.filiere || '');
  const [experience, setExperience] = useState(applicant?.experience != null ? String(applicant.experience) : '');
  const [loading, setLoading] = useState(false);
  const [diplomaImage] = useState(applicant?.diplomaImage || null);

  const isStudent = role === 'STUDENT';
  const isTeacher = role === 'TEACHER';

  const handleSave = async () => {
    try {
      setLoading(true);
      if (!email) {
        Alert.alert('Erreur', 'Email requis');
        setLoading(false);
        return;
      }

      const profileResult = await getProfile(email);
      if (!profileResult.success) {
        Alert.alert('Erreur', profileResult.error || 'Profil introuvable');
        setLoading(false);
        return;
      }

      let result;
      if (isStudent) {
        const studentId = profileResult.profile?.studentId;
        if (!studentId) {
          Alert.alert('Erreur', 'Étudiant introuvable');
          setLoading(false);
          return;
        }
        result = await updateStudentProfile(studentId, {
          degree,
          diplomaImage,
        });
      } else if (isTeacher) {
        const teacherId = profileResult.profile?.teacherId;
        if (!teacherId) {
          Alert.alert('Erreur', 'Professeur introuvable');
          setLoading(false);
          return;
        }
        result = await updateTeacherProfile(teacherId, {
          filiere,
        });
      }

      if (result?.success) {
        Alert.alert('Succès', 'Informations enregistrées');
        navigation.goBack();
      } else {
        Alert.alert('Erreur', result?.error || 'Échec de l\'enregistrement');
      }
    } catch (error) {
      Alert.alert('Erreur', error.message || 'Échec de l\'enregistrement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (applicant) {
      setRole(applicant.role || '');
      setFirstName(applicant.firstName || '');
      setLastName(applicant.lastName || '');
      setEmail(applicant.email || '');
      setUniversity(applicant.university || '');
      setGraduationYear(applicant.graduationYear || '');
      setSkills(Array.isArray(applicant.skills) ? applicant.skills.join(', ') : (applicant.skills || ''));
      setDegree(applicant.degree || '');
      setFiliere(applicant.filiere || '');
      setExperience(applicant.experience != null ? String(applicant.experience) : '');
    }
  }, [applicant]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#111" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Parcours académique</Text>
          <View style={styles.headerSpacer} />
        </View>

        {isStudent && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informations étudiant</Text>
            <View style={styles.formCard}>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Nom complet</Text>
                <TextInput style={styles.input} value={`${firstName} ${lastName}`} editable={false} />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput style={styles.input} value={email} editable={false} />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Université</Text>
                <TextInput style={styles.input} value={university} onChangeText={setUniversity} placeholder="Université" />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Année de diplomation</Text>
                <TextInput style={styles.input} value={graduationYear} onChangeText={setGraduationYear} placeholder="2024" />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Niveau</Text>
                <View style={styles.chipRow}>
                  {DEGREE_OPTIONS.map(opt => (
                    <TouchableOpacity
                      key={opt}
                      style={[styles.chip, degree === opt && styles.chipActive]}
                      onPress={() => setDegree(opt)}
                    >
                      <Text style={[styles.chipText, degree === opt && styles.chipTextActive]}>{opt}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Compétences</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={skills}
                  onChangeText={setSkills}
                  placeholder="Ex: Java, Python, Gestion..."
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>
          </View>
        )}

        {isTeacher && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informations professeur</Text>
            <View style={styles.formCard}>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Nom complet</Text>
                <TextInput style={styles.input} value={`${firstName} ${lastName}`} editable={false} />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput style={styles.input} value={email} editable={false} />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Département</Text>
                <TextInput style={styles.input} value={applicant?.department || ''} editable={false} />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Matière</Text>
                <TextInput style={styles.input} value={applicant?.subject || ''} editable={false} />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Expérience (années)</Text>
                <TextInput style={styles.input} value={experience} onChangeText={setExperience} keyboardType="numeric" />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Filière enseignée</Text>
                <View style={styles.chipRow}>
                  {FILIERE_OPTIONS.map(opt => (
                    <TouchableOpacity
                      key={opt}
                      style={[styles.chip, filiere === opt && styles.chipActive]}
                      onPress={() => setFiliere(opt)}
                    >
                      <Text style={[styles.chipText, filiere === opt && styles.chipTextActive]}>{opt}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.saveButtonText}>Enregistrer</Text>
          )}
        </TouchableOpacity>
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
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111', letterSpacing: -0.3, flex: 1, textAlign: 'center', marginHorizontal: 12 },
  headerSpacer: { width: 40 },
  section: { marginTop: 24, marginHorizontal: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#666', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12, marginLeft: 4 },
  formCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#F0F0F0' },
  fieldGroup: { marginBottom: 18 },
  label: { fontSize: 13, fontWeight: '600', color: '#666', marginBottom: 8 },
  input: {
    backgroundColor: '#F5F7FA', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1, borderColor: '#E5E7EB', color: '#111', fontSize: 15
  },
  textArea: { height: 80, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, backgroundColor: '#F0F2F6', borderWidth: 1, borderColor: '#E5E7EB' },
  chipActive: { backgroundColor: '#0056FF', borderColor: '#0056FF' },
  chipText: { color: '#333', fontWeight: '600', fontSize: 13 },
  chipTextActive: { color: '#FFF' },
  saveButton: {
    backgroundColor: '#0056FF', paddingVertical: 18, borderRadius: 16, alignItems: 'center',
    marginHorizontal: 20, marginTop: 32, shadowColor: '#0056FF', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4
  },
  saveButtonDisabled: { opacity: 0.7 },
  saveButtonText: { color: '#FFF', fontWeight: '700', fontSize: 17, letterSpacing: -0.3 }
});

export default AcademicInfoScreen;
