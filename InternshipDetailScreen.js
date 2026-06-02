import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Image, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { applyToInternship } from '../services/api';
import { getCurrentLoggedInUser } from '../services/tempStorage';

const InternshipDetailScreen = ({ route, navigation }) => {
  const { internship } = route.params;
  const [currentUser, setCurrentUser] = useState(null);
  const imageUrl = internship.imageUrl || internship.image_url;

  useEffect(() => {
    const user = getCurrentLoggedInUser();
    setCurrentUser(user);
  }, []);

  const handleApply = async () => {
    const result = await applyToInternship(internship.id, currentUser?.id, '');
    if (result.success) {
      Alert.alert('Postulation', 'Votre candidature a été envoyée avec succès !');
    } else {
      Alert.alert('Erreur', result.error || 'Échec de la postulation');
    }
  };

  const DetailItem = ({ icon, label, value }) => (
    <View style={styles.detailItem}>
      <View style={styles.detailIconContainer}>
        <Ionicons name={icon} size={18} color="#0056FF" />
      </View>
      <View style={styles.detailContent}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Détails du stage</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.heroImage} />
        ) : (
          <View style={styles.heroImagePlaceholder}>
            <Ionicons name="image-outline" size={64} color="#0056FF" />
            <Text style={styles.heroImageText}>Aucune image</Text>
          </View>
        )}

        <View style={styles.content}>
          <Text style={styles.title}>{internship.title}</Text>

          {internship.status && (
            <View style={styles.statusBadge}>
              <Ionicons name={internship.status === 'ACTIVE' ? 'checkmark-circle' : internship.status === 'EXPIRED' ? 'close-circle' : 'time'} size={14} color={internship.status === 'ACTIVE' ? '#34C759' : internship.status === 'EXPIRED' ? '#FF3B30' : '#8E8E93'} />
              <Text style={[styles.statusBadgeText, { color: internship.status === 'ACTIVE' ? '#34C759' : internship.status === 'EXPIRED' ? '#FF3B30' : '#8E8E93' }]}>
                {internship.status === 'ACTIVE' ? 'Actif' : internship.status === 'EXPIRED' ? 'Expiré' : 'Fermé'}
              </Text>
            </View>
          )}

          <View style={styles.companySection}>
            {internship.companyProfilePhoto ? (
              <Image source={{ uri: internship.companyProfilePhoto }} style={styles.companyLogo} />
            ) : (
              <View style={styles.companyLogoPlaceholder}>
                <Ionicons name="business" size={28} color="#FFF" />
              </View>
            )}
            <View style={styles.companyInfo}>
              <Text style={styles.companyName}>{internship.companyName}</Text>
              {internship.companySector && <Text style={styles.companySector}>{internship.companySector}</Text>}
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text-outline" size={18} color="#0056FF" />
              <Text style={styles.sectionTitle}>Description</Text>
            </View>
            <Text style={styles.sectionText}>{internship.description}</Text>
          </View>

          {internship.requirements && internship.requirements.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="list-outline" size={18} color="#0056FF" />
                <Text style={styles.sectionTitle}>Prérequis</Text>
              </View>
              {internship.requirements.map((req, index) => (
                <View key={index} style={styles.requirementItem}>
                  <View style={styles.bullet} />
                  <Text style={styles.requirementText}>{req}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.detailsGrid}>
            {internship.startDate && (
              <DetailItem icon="calendar-outline" label="Début" value={new Date(internship.startDate).toLocaleDateString('fr-FR')} />
            )}
            {internship.endDate && (
              <DetailItem icon="calendar-outline" label="Fin" value={new Date(internship.endDate).toLocaleDateString('fr-FR')} />
            )}
            {internship.location && (
              <DetailItem icon="location-outline" label="Lieu" value={internship.location} />
            )}
            {internship.expirationDate && (
              <DetailItem icon="time-outline" label="Expiration" value={new Date(internship.expirationDate).toLocaleDateString('fr-FR')} />
            )}
          </View>

          {currentUser?.role !== 'COMPANY' ? (
            <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
              <Ionicons name="send-outline" size={20} color="#FFF" />
              <Text style={styles.applyButtonText}>Postuler à ce stage</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.manageButton} onPress={() => navigation.navigate('AccepterDemandes', {
              companyId: currentUser?.id,
              internshipId: internship.id
            })}>
              <MaterialIcons name="assignment" size={20} color="#FFF" />
              <Text style={styles.applyButtonText}>Gérer les candidatures</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
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
  heroImage: { width: '100%', height: 220, resizeMode: 'cover' },
  heroImagePlaceholder: { width: '100%', height: 220, backgroundColor: '#F0F4FF', justifyContent: 'center', alignItems: 'center', gap: 12 },
  heroImageText: { fontSize: 15, color: '#666', fontWeight: '500' },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '700', color: '#111', letterSpacing: -0.5, marginBottom: 12 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 20 },
  statusBadgeText: { fontSize: 12, fontWeight: '600' },
  companySection: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, padding: 16, backgroundColor: '#FFF', borderRadius: 16, borderWidth: 1, borderColor: '#F0F0F0' },
  companyLogo: { width: 56, height: 56, borderRadius: 14, marginRight: 14 },
  companyLogoPlaceholder: { width: 56, height: 56, borderRadius: 14, backgroundColor: '#0056FF', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  companyInfo: { flex: 1 },
  companyName: { fontSize: 17, fontWeight: '700', color: '#111', letterSpacing: -0.3 },
  companySector: { fontSize: 13, color: '#666', marginTop: 2, fontWeight: '500' },
  section: { marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111', letterSpacing: -0.2 },
  sectionText: { fontSize: 15, color: '#444', lineHeight: 24 },
  requirementItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10, gap: 10 },
  bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#0056FF', marginTop: 7 },
  requirementText: { flex: 1, fontSize: 14, color: '#444', lineHeight: 20 },
  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  detailItem: { flex: 1, minWidth: '45%', backgroundColor: '#FFF', padding: 16, borderRadius: 14, borderWidth: 1, borderColor: '#F0F0F0', flexDirection: 'row', alignItems: 'center', gap: 12 },
  detailIconContainer: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#E8F0FF', justifyContent: 'center', alignItems: 'center' },
  detailContent: { flex: 1 },
  detailLabel: { fontSize: 12, color: '#666', fontWeight: '500', marginBottom: 2 },
  detailValue: { fontSize: 14, fontWeight: '600', color: '#111', letterSpacing: -0.2 },
  applyButton: { backgroundColor: '#0056FF', padding: 18, borderRadius: 14, alignItems: 'center', marginTop: 10, flexDirection: 'row', justifyContent: 'center', gap: 8, shadowColor: '#0056FF', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3 },
  manageButton: { backgroundColor: '#34C759', padding: 18, borderRadius: 14, alignItems: 'center', marginTop: 10, flexDirection: 'row', justifyContent: 'center', gap: 8, shadowColor: '#34C759', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3 },
  applyButtonText: { color: '#FFF', fontWeight: '600', fontSize: 16, letterSpacing: -0.2 }
});

export default InternshipDetailScreen;
