import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, TextInput, Alert, Image, Platform, Modal, Keyboard, ScrollView } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { postInternship, updateInternship } from '../services/api';

const PosterStageScreen = ({ navigation, route }) => {
  const internship = route.params?.internship;
  const userId = route.params?.userId;
  const companyId = route.params?.companyId;
  const isEditMode = !!internship;

  const actualCompanyId = companyId || userId;

  const [title, setTitle] = React.useState(internship?.title || '');
  const [description, setDescription] = React.useState(internship?.description || '');
  const [requirements, setRequirements] = React.useState(internship?.requirements?.join(', ') || '');
  const [location, setLocation] = React.useState(internship?.location || '');
  const [duration, setDuration] = React.useState(internship?.duration || '');
  const [imageUrl, setImageUrl] = React.useState(internship?.imageUrl || internship?.image_url || null);
  const [companySector, setCompanySector] = React.useState(internship?.companySector || '');
  const [startDate, setStartDate] = React.useState(internship?.start_date || internship?.startDate ? new Date(internship.start_date || internship.startDate) : new Date());
  const [endDate, setEndDate] = React.useState(internship?.end_date || internship?.endDate ? new Date(internship.end_date || internship.endDate) : new Date());
  const [showStartPicker, setShowStartPicker] = React.useState(false);
  const [showEndPicker, setShowEndPicker] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission requise', 'Autorisez l\'accès à la galerie');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.3,
      base64: true,
    });

    if (!result.canceled) {
      const base64 = result.assets[0].base64;
      if (base64) {
        setImageUrl(`data:image/jpeg;base64,${base64}`);
      } else {
        // Fallback to URI if base64 is not available
        setImageUrl(result.assets[0].uri);
      }
    }
  };

  const handleSubmit = async () => {
    if (!title || !description || !location) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires (titre, description, lieu)');
      return;
    }

    setLoading(true);
    try {
      const internshipData = {
        companyId: actualCompanyId,
        title,
        description,
        requirements: requirements ? requirements.split(',').map(r => r.trim()) : [],
        location,
        duration,
        imageUrl,
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
        expirationDate: formatDate(endDate),
        companySector
      };

      let result;
      if (isEditMode) {
        result = await updateInternship(internship.id, internshipData);
        if (result.success) {
Alert.alert('Succès', 'Stage modifié avec succès !', [
             { text: 'OK', onPress: () => navigation.navigate('CompanyInternships', { userId: actualCompanyId }) }
           ]);
        }
      } else {
        result = await postInternship(internshipData);
        if (result.success) {
Alert.alert('Succès', 'Stage publié avec succès !', [
             { text: 'OK', onPress: () => navigation.navigate('CompanyInternships', { userId: actualCompanyId }) }
           ]);
        }
      }

      if (!result?.success) {
        Alert.alert('Erreur', result.error || 'Échec de la publication. Veuillez réessayer.');
      }
    } catch (error) {
      Alert.alert('Erreur de connexion', 'Impossible de publier le stage. Vérifiez votre connexion internet et réessayez.');
    } finally {
      setLoading(false);
    }
  };

  const FormField = ({ icon, label, children }) => (
    <View style={styles.formGroup}>
      <View style={styles.labelRow}>
        <Ionicons name={icon} size={16} color="#0056FF" />
        <Text style={styles.label}>{label}</Text>
      </View>
      {children}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollContainer} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#111" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isEditMode ? 'Modifier le stage' : 'Publier un stage'}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.formContainer}>
          <FormField icon="create-outline" label="Titre du stage *">
            <TextInput
              style={styles.input}
              placeholder="Ex: Stage en développement web"
              placeholderTextColor="#999"
              value={title}
              onChangeText={setTitle}
            />
          </FormField>

          <FormField icon="document-text-outline" label="Description *">
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Décrivez le stage, les missions, les compétences requises..."
              placeholderTextColor="#999"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
            />
          </FormField>

          <FormField icon="business-outline" label="Secteur">
            <TextInput
              style={styles.input}
              placeholder="Ex: Technologie, Finance, Santé..."
              placeholderTextColor="#999"
              value={companySector}
              onChangeText={setCompanySector}
            />
          </FormField>

          <FormField icon="time-outline" label="Durée">
            <TextInput
              style={styles.input}
              placeholder="Ex: 3 mois, 6 mois..."
              placeholderTextColor="#999"
              value={duration}
              onChangeText={setDuration}
            />
          </FormField>

          <FormField icon="list-outline" label="Prérequis (séparés par des virgules)">
            <TextInput
              style={styles.input}
              placeholder="Ex: HTML, CSS, JavaScript, Communication..."
              placeholderTextColor="#999"
              value={requirements}
              onChangeText={setRequirements}
            />
          </FormField>

          <FormField icon="location-outline" label="Lieu *">
            <TextInput
              style={styles.input}
              placeholder="Ex: Paris, Remote, Hybride..."
              placeholderTextColor="#999"
              value={location}
              onChangeText={setLocation}
            />
          </FormField>

          <FormField icon="calendar-outline" label="Date de début">
            <TouchableOpacity style={styles.datePicker} onPress={() => setShowStartPicker(true)}>
              <Text style={styles.datePickerText}>{formatDate(startDate) || 'Sélectionner une date'}</Text>
            </TouchableOpacity>
          </FormField>

          <FormField icon="calendar-outline" label="Date de fin">
            <TouchableOpacity style={styles.datePicker} onPress={() => setShowEndPicker(true)}>
              <Text style={styles.datePickerText}>{formatDate(endDate) || 'Sélectionner une date'}</Text>
            </TouchableOpacity>
          </FormField>

          <FormField icon="image-outline" label="Image du stage">
            <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
              {imageUrl ? (
                <Image source={{ uri: imageUrl }} style={styles.previewImage} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="image-outline" size={40} color="#0056FF" />
                  <Text style={styles.imagePlaceholderText}>Appuyez pour ajouter une image</Text>
                </View>
              )}
            </TouchableOpacity>
          </FormField>

          <TouchableOpacity style={[styles.submitButton, loading && styles.submitButtonDisabled]} onPress={handleSubmit} disabled={loading}>
{loading ? (
               <Text style={styles.submitButtonText}>Publication...</Text>
             ) : (
               <>
                 <Ionicons name="send-outline" size={20} color="#FFF" />
                 <Text style={styles.submitButtonText}>{isEditMode ? 'Enregistrer' : 'Publier le stage'}</Text>
               </>
             )}
          </TouchableOpacity>

          <View style={{ height: 32 }} />
        </View>
      </ScrollView>

      {showStartPicker && (
        <Modal transparent animationType="fade" visible={showStartPicker} onRequestClose={() => setShowStartPicker(false)}>
          <View style={styles.pickerModalOverlay}>
            <View style={styles.pickerModalContent}>
              <DateTimePicker
                value={startDate}
                mode="date"
                display="spinner"
                onChange={(event, selectedDate) => {
                  if (event.type === 'dismissed' || event.type === 'neutral') {
                    setShowStartPicker(false);
                  } else if (selectedDate) {
                    setStartDate(selectedDate);
                  }
                }}
                minimumDate={new Date()}
                textColor="#111"
                themeVariant="light"
              />
              <View style={styles.pickerActions}>
                <TouchableOpacity style={styles.pickerCancelBtn} onPress={() => setShowStartPicker(false)}>
                  <Text style={styles.pickerCancelText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.pickerConfirmBtn} onPress={() => setShowStartPicker(false)}>
                  <Text style={styles.pickerConfirmText}>Confirmer</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {showEndPicker && (
        <Modal transparent animationType="fade" visible={showEndPicker} onRequestClose={() => setShowEndPicker(false)}>
          <View style={styles.pickerModalOverlay}>
            <View style={styles.pickerModalContent}>
              <DateTimePicker
                value={endDate}
                mode="date"
                display="spinner"
                onChange={(event, selectedDate) => {
                  if (event.type === 'dismissed' || event.type === 'neutral') {
                    setShowEndPicker(false);
                  } else if (selectedDate) {
                    setEndDate(selectedDate);
                  }
                }}
                minimumDate={startDate}
                textColor="#111"
                themeVariant="light"
              />
              <View style={styles.pickerActions}>
                <TouchableOpacity style={styles.pickerCancelBtn} onPress={() => setShowEndPicker(false)}>
                  <Text style={styles.pickerCancelText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.pickerConfirmBtn} onPress={() => setShowEndPicker(false)}>
                  <Text style={styles.pickerConfirmText}>Confirmer</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  scrollContainer: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#FFF',
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0'
  },
  backButton: { padding: 8, borderRadius: 12, backgroundColor: '#F8F9FA' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#111', letterSpacing: -0.3, flex: 1, textAlign: 'center', marginHorizontal: 12 },
  headerSpacer: { width: 40 },
  formContainer: { paddingHorizontal: 20, paddingTop: 24, gap: 8 },
  formGroup: { marginBottom: 20 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  label: { fontSize: 14, fontWeight: '600', color: '#333' },
  input: { backgroundColor: '#FFF', paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12, fontSize: 15, color: '#111', borderWidth: 1, borderColor: '#F0F0F0' },
  textArea: { height: 120, textAlignVertical: 'top' },
  datePicker: { backgroundColor: '#FFF', paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#F0F0F0' },
  datePickerText: { fontSize: 15, color: '#111', fontWeight: '500' },
  imagePicker: { height: 180, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: '#F0F0F0', overflow: 'hidden' },
  previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  imagePlaceholder: { flex: 1, backgroundColor: '#F8F9FA', justifyContent: 'center', alignItems: 'center', gap: 10 },
  imagePlaceholderText: { fontSize: 14, color: '#666', fontWeight: '500' },
  submitButton: { backgroundColor: '#0056FF', padding: 18, borderRadius: 14, alignItems: 'center', marginHorizontal: 20, marginTop: 10, flexDirection: 'row', justifyContent: 'center', gap: 8, shadowColor: '#0056FF', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3 },
  submitButtonDisabled: { backgroundColor: '#CCC' },
  submitButtonText: { color: '#FFF', fontWeight: '600', fontSize: 16, letterSpacing: -0.2 },
  pickerModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  pickerModalContent: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, alignItems: 'center', minWidth: 300 },
  pickerActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  pickerCancelBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, backgroundColor: '#F5F5F5' },
  pickerCancelText: { color: '#666', fontWeight: '600' },
  pickerConfirmBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, backgroundColor: '#0056FF' },
  pickerConfirmText: { color: '#FFF', fontWeight: '600' }
});

export default PosterStageScreen;