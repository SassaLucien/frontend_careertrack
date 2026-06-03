import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Modal, TextInput, FlatList, ActivityIndicator, Animated, Easing, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import * as Speech from 'expo-speech';
import { getAllInternships, searchPeople, getFeaturedProfiles } from '../services/api';

const GROQ_API_KEY = process.env.GROQ_API_KEY;

const groqClient = axios.create({
  baseURL: 'https://api.groq.com/openai/v1',
  headers: {
    'Authorization': `Bearer ${GROQ_API_KEY}`,
    'Content-Type': 'application/json',
  },
});

const speak = (text) => {
  Speech.speak(text, {
    language: 'fr-FR',
    pitch: 1.1,
    rate: 0.85,
  });
};

const isInternshipQuery = (text) => {
  const lowerText = text.toLowerCase();
  // Si contient étudiant/professeur mais pas stage, ce n'est PAS une question de stage
  if ((lowerText.includes('étudiant') || lowerText.includes('professeur')) && !lowerText.includes('stage')) {
    return false;
  }
  const keywords = [
    'stage', 'stages', 'stage disponible', 'disponible', 'trouver', 'recherche', 'où', 
    'liste', 'offre', 'offres', 'nombre', 'y a t il', 'montre', 'afficher', 'récent', 'populaire',
    'distance', 'remote', 'à distance', 'entreprise', 'rémunéré', 'rémunérés', 'assistant'
  ];
  return keywords.some(keyword => lowerText.includes(keyword));
};

const filterInternships = (internships, text) => {
  const lowerText = text.toLowerCase();
  return internships.filter(item => {
    if (lowerText.includes('distance') || lowerText.includes('remote') || lowerText.includes('à distance')) {
      return item.location?.toLowerCase().includes('distance') || 
             item.location?.toLowerCase().includes('remote') ||
             item.location?.toLowerCase().includes('à distance');
    }
    if (lowerText.includes('informatique')) {
      return item.title?.toLowerCase().includes('informatique') || 
             item.description?.toLowerCase().includes('informatique') ||
             item.title?.toLowerCase().includes('développeur') ||
             item.title?.toLowerCase().includes('développement');
    }
    if (lowerText.includes('marketing')) {
      return item.title?.toLowerCase().includes('marketing') || 
             item.description?.toLowerCase().includes('marketing');
    }
    if (lowerText.includes('finance')) {
      return item.title?.toLowerCase().includes('finance') || 
             item.description?.toLowerCase().includes('finance') ||
             item.title?.toLowerCase().includes('comptabilité');
    }
    if (lowerText.includes('design')) {
      return item.title?.toLowerCase().includes('design') || 
             item.title?.toLowerCase().includes('ui') ||
             item.title?.toLowerCase().includes('ux');
    }
    return true;
  });
};

const getInternshipContextInfo = (text) => {
  const lowerText = text.toLowerCase();
  if (lowerText.includes('combien') || lowerText.includes('nombre')) {
    return 'count';
  }
  if (lowerText.includes('afficher') || lowerText.includes('montre') || lowerText.includes('liste')) {
    return 'list';
  }
  return 'general';
};

const isProfileQuery = (text) => {
  const lowerText = text.toLowerCase();
  // Si contient étudiant/professeur mais pas stage, c'est une question de profil
  if ((lowerText.includes('étudiant') || lowerText.includes('professeur')) && !lowerText.includes('stage')) {
    return true;
  }
  const keywords = ['personne', 'personnes', 'profil', 'profils', 'meilleur', 'meilleurs', 'recommandé', 'recommandés',
    'maths', 'mathématiques', 'physique', 'chimie', 'biologie', 'langues', 'histoire', 'gestion',
    'licence', 'master', 'doctorat', 'bac', 'université', 'chercher', 'trouver', 'département', 'filière'];
  return keywords.some(keyword => lowerText.includes(keyword));
};

const filterProfiles = (profiles, text) => {
  const lowerText = text.toLowerCase();
  return profiles.filter(item => {
    if (lowerText.includes('étudiant') && !lowerText.includes('professeur')) {
      return item.type === 'STUDENT';
    }
    if (lowerText.includes('professeur') && !lowerText.includes('étudiant')) {
      return item.type === 'TEACHER';
    }
    if (lowerText.includes('meilleur') || lowerText.includes('recommandé')) {
      return item.featured === true;
    }
    if (lowerText.includes('maths') || lowerText.includes('mathématiques')) {
      return item.filiere?.toLowerCase().includes('mathématiques') || item.department?.toLowerCase().includes('mathématiques');
    }
    if (lowerText.includes('physique')) {
      return item.filiere?.toLowerCase().includes('physique') || item.department?.toLowerCase().includes('physique');
    }
    if (lowerText.includes('chimie')) {
      return item.filiere?.toLowerCase().includes('chimie') || item.department?.toLowerCase().includes('chimie');
    }
    if (lowerText.includes('biologie')) {
      return item.filiere?.toLowerCase().includes('biologie') || item.department?.toLowerCase().includes('biologie');
    }
    if (lowerText.includes('langues')) {
      return item.filiere?.toLowerCase().includes('langues') || item.department?.toLowerCase().includes('langues');
    }
    if (lowerText.includes('histoire')) {
      return item.filiere?.toLowerCase().includes('histoire') || item.department?.toLowerCase().includes('histoire');
    }
    if (lowerText.includes('gestion')) {
      return item.filiere?.toLowerCase().includes('gestion') || item.department?.toLowerCase().includes('gestion');
    }
    if (lowerText.includes('licence')) {
      return item.degree?.toLowerCase().includes('licence');
    }
    if (lowerText.includes('master')) {
      return item.degree?.toLowerCase().includes('master');
    }
    if (lowerText.includes('doctorat')) {
      return item.degree?.toLowerCase().includes('doctorat');
    }
    return true;
  });
};

const getProfileContextInfo = (text) => {
  const lowerText = text.toLowerCase();
  if (lowerText.includes('combien')) {
    return 'count';
  }
  if (lowerText.includes('meilleur') || lowerText.includes('recommandé')) {
    return 'featured';
  }
  return 'general';
};

const AIScreen = ({ navigation, route }) => {
  const [isAnimating, setAnimating] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const pulseAnim = useState(new Animated.Value(1))[0];
  const moveAnim = useState(new Animated.Value(1))[0];

  useEffect(() => {
    if (isAnimating) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.4,
            duration: 1000,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();
      return () => pulseAnimation.stop();
    }
  }, [isAnimating, pulseAnim]);

  useEffect(() => {
    if (modalVisible) {
      Animated.timing(moveAnim, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(moveAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }).start();
    }
  }, [modalVisible, moveAnim]);

  const handleCirclePress = () => {
    const greetingMessage = { role: 'assistant', content: 'Bonjour ! Je m\'appelle ATEBA, que puis-je faire pour vous ?' };
    setMessages([greetingMessage]);
    setAnimating(true);
    setModalVisible(true);
    speak(greetingMessage.content);
  };

  const closeModal = () => {
    Speech.stop();
    setAnimating(false);
    setModalVisible(false);
  };

  const fetchInternships = async () => {
    const result = await getAllInternships();
    if (result.success) {
      return result.internships || [];
    }
    return [];
  };

  const fetchProfiles = async () => {
    const result = await getFeaturedProfiles();
    if (result.success) {
      return result.profiles || [];
    }
    return [];
  };

  const sendMessage = async () => {
    if (!inputText.trim() || loading) return;

    const userMessage = { role: 'user', content: inputText };
    const currentInput = inputText;
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputText('');
    setLoading(true);

    try {
      let responseContent = '';
      const lowerInput = currentInput.toLowerCase();
      
      // Check for profile queries FIRST (before internship queries)
      if (isProfileQuery(currentInput) && !isInternshipQuery(currentInput)) {
        const allProfiles = await fetchProfiles();
        const profiles = filterProfiles(allProfiles, currentInput);
        const count = profiles.length;
        
        if (lowerInput.includes('combien')) {
          if (lowerInput.includes('étudiant')) {
            const studentCount = profiles.filter(p => p.type === 'STUDENT').length;
            responseContent = `Il y a actuellement ${studentCount} étudiant${studentCount > 1 ? 's' : ''} inscrit${studentCount > 1 ? 's' : ''} sur CareerTrack.`;
          } else if (lowerInput.includes('professeur')) {
            const teacherCount = profiles.filter(p => p.type === 'TEACHER').length;
            responseContent = `Il y a actuellement ${teacherCount} professeur${teacherCount > 1 ? 's' : ''} inscrit${teacherCount > 1 ? 's' : ''} sur CareerTrack.`;
          } else {
            responseContent = `Il y a actuellement ${count} profil${count > 1 ? 's' : ''} inscrit${count > 1 ? 's' : ''} sur CareerTrack.`;
          }
        } else if (lowerInput.includes('meilleur') || lowerInput.includes('recommandé')) {
          responseContent = `Voici les profils les plus recommandés (${count} au total):`;
        } else {
          responseContent = `J'ai trouvé ${count} profil${count > 1 ? 's' : ''} correspondant à votre recherche.`;
        }
        
        setMessages([...newMessages, { role: 'assistant', content: responseContent, profiles: profiles.slice(0, 5) }]);
      } else if (isInternshipQuery(currentInput)) {
        const allInternships = await fetchInternships();
        const internships = filterInternships(allInternships, currentInput);
        const count = internships.length;
        
        const context = getInternshipContextInfo(currentInput);
        
        if (context === 'count' || lowerInput.includes('combien')) {
          responseContent = `Il y a actuellement ${count} stage${count > 1 ? 's' : ''} disponible${count > 1 ? 's' : ''} sur CareerTrack.`;
        } else if (context === 'list' || lowerInput.includes('afficher') || lowerInput.includes('montre') || lowerInput.includes('liste')) {
          responseContent = `Voici ${count} stage${count > 1 ? 's' : ''} disponible${count > 1 ? 's' : ''}:`;
        } else if (lowerInput.includes('distance') || lowerInput.includes('remote')) {
          responseContent = `J'ai trouvé ${count} stage${count > 1 ? 's' : ''} à distance.`;
        } else if (lowerInput.includes('informatique')) {
          responseContent = `J'ai trouvé ${count} stage${count > 1 ? 's' : ''} en informatique.`;
        } else if (lowerInput.includes('marketing')) {
          responseContent = `J'ai trouvé ${count} stage${count > 1 ? 's' : ''} en marketing.`;
        } else if (lowerInput.includes('finance')) {
          responseContent = `J'ai trouvé ${count} stage${count > 1 ? 's' : ''} en finance.`;
        } else if (lowerInput.includes('design')) {
          responseContent = `J'ai trouvé ${count} stage${count > 1 ? 's' : ''} en design.`;
        } else {
          responseContent = `J'ai trouvé ${count} stage${count > 1 ? 's' : ''} disponible${count > 1 ? 's' : ''} sur CareerTrack.`;
        }
        
        setMessages([...newMessages, { role: 'assistant', content: responseContent, internships: internships.slice(0, 5) }]);
      } else {
        const response = await groqClient.post('/chat/completions', {
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: 'Tu es ATEBA, un assistant IA helpful pour CareerTrack.' },
            ...newMessages.map(m => ({ role: m.role, content: m.content }))
          ],
          temperature: 0.7,
          max_tokens: 500,
        });

        const aiResponse = response.data.choices?.[0]?.message;
        responseContent = aiResponse?.content || 'Désolé, une erreur s\'est produite.';
        setMessages([...newMessages, { role: 'assistant', content: responseContent }]);
      }
      speak(responseContent);
    } catch (error) {
      const errorMsg = 'Désolé, une erreur s\'est produite.';
      setMessages([...newMessages, { role: 'assistant', content: errorMsg }]);
      speak(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const renderInternshipCard = ({ item }) => {
    const imageUrl = item.imageUrl || item.image_url;
    return (
      <View style={styles.internshipCard}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.internshipImage} />
        ) : (
          <View style={styles.internshipImagePlaceholder}>
            <Ionicons name="briefcase-outline" size={20} color="#0056FF" />
          </View>
        )}
        <View style={styles.internshipContent}>
          <Text style={styles.internshipTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.internshipCompany}>{item.companyName}</Text>
          <Text style={styles.internshipLocation} numberOfLines={1}>{item.location || 'Non précisé'}</Text>
        </View>
      </View>
    );
  };

  const renderProfileCard = ({ item }) => {
    const imageUrl = item.profilePhoto || item.teacherProfilePhoto || '';
    const isTeacher = item.type === 'TEACHER';
    const name = item.name || `${item.firstName || ''} ${item.lastName || ''}`.trim();
    const subtitle = isTeacher ? item.department : item.university;
    const degree = item.degree || item.filiere;
    
    return (
      <View style={styles.profileCard}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.profileImage} />
        ) : (
          <View style={styles.profileImagePlaceholder}>
            <Ionicons name={isTeacher ? "school-outline" : "person-outline"} size={20} color="#0056FF" />
          </View>
        )}
        <View style={styles.profileContent}>
          <Text style={styles.profileName} numberOfLines={1}>{name || (isTeacher ? 'Professeur' : 'Étudiant')}</Text>
          {subtitle ? <Text style={styles.profileSubtitle} numberOfLines={1}>{subtitle}</Text> : null}
          {degree ? <Text style={styles.profileDegree} numberOfLines={1}>{degree}</Text> : null}
        </View>
      </View>
    );
  };

  const renderMessage = ({ item }) => {
    if (item.internships && item.internships.length > 0) {
      return (
        <View style={[styles.messageBubble, styles.aiMessage]}>
          <Text style={styles.messageText}>{item.content}</Text>
          <FlatList
            data={item.internships}
            keyExtractor={(intern) => String(intern.id)}
            renderItem={renderInternshipCard}
            scrollEnabled={false}
            style={{ marginTop: 10 }}
          />
        </View>
      );
    }
    if (item.profiles && item.profiles.length > 0) {
      return (
        <View style={[styles.messageBubble, styles.aiMessage]}>
          <Text style={styles.messageText}>{item.content}</Text>
          <FlatList
            data={item.profiles}
            keyExtractor={(profile) => String(profile.id || profile.userId)}
            renderItem={renderProfileCard}
            scrollEnabled={false}
            style={{ marginTop: 10 }}
          />
        </View>
      );
    }
    return (
      <View style={[styles.messageBubble, item.role === 'user' ? styles.userMessage : styles.aiMessage]}>
        <Text style={[styles.messageText, item.role === 'user' && { color: '#FFF' }]}>{item.content}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {!modalVisible && (
          <TouchableOpacity onPress={handleCirclePress} style={styles.aiOuterCircle}>
            <View style={[styles.aiPulseCircle, { backgroundColor: '#0056FF' }]} />
            <View style={[styles.aiInnerCircle]}>
              <Ionicons name="sparkles" size={48} color="#FFF" />
            </View>
          </TouchableOpacity>
        )}
        <Text style={styles.aiTitle}>Assistant IA</Text>
        <Text style={styles.aiSubtitle}>Votre assistant intelligent pour CareerTrack</Text>
      </View>

      <Modal
        visible={modalVisible}
        animationType="none"
        transparent={true}
        onRequestClose={closeModal}
      >
        <View style={styles.transparentOverlay}>
          <Animated.View style={[styles.aiOuterCircle, { 
            position: 'absolute',
            bottom: '70%',
            alignSelf: 'center',
            transform: [{ translateY: moveAnim.interpolate({ inputRange: [0, 1], outputRange: [-50, 0] }) }] 
          }]}>
            <Animated.View style={[styles.aiPulseCircle, { backgroundColor: isAnimating ? '#FF3B30' : '#0056FF', opacity: 0.4, transform: [{ scale: pulseAnim }] }]} />
            <View style={[styles.aiInnerCircle, isAnimating && styles.redCircle]}>
              <Ionicons name="sparkles" size={48} color="#FFF" />
            </View>
          </Animated.View>
          <View style={styles.chatContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={closeModal} style={styles.modalBackButton}>
                <Ionicons name="arrow-back" size={24} color="#111" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>ATEBA - Assistant IA</Text>
            </View>

<FlatList
               data={messages}
               keyExtractor={(item, index) => item.id || index.toString()}
               renderItem={renderMessage}
               contentContainerStyle={styles.messagesContainer}
               style={styles.messagesList}
             />

            {loading && (
              <View style={styles.typingIndicator}>
                <ActivityIndicator size="small" color="#0056FF" />
                <Text style={styles.typingText}>ATEBA écrit...</Text>
              </View>
            )}

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="Écrivez un message..."
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={sendMessage}
                editable={!loading}
              />
              <TouchableOpacity onPress={sendMessage} style={styles.sendButton} disabled={loading}>
                <Ionicons name="send" size={22} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  transparentOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'flex-end',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiOuterCircle: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiPulseCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    position: 'absolute',
    opacity: 0.3,
  },
  aiInnerCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#0056FF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0056FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 5,
  },
  redCircle: {
    backgroundColor: '#FF3B30',
  },
  aiTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111',
    marginTop: 24,
    letterSpacing: -0.3,
  },
  aiSubtitle: {
    fontSize: 15,
    color: '#666',
    marginTop: 8,
    fontWeight: '500',
  },
  chatContainer: {
    height: '70%',
    backgroundColor: 'rgba(248,249,250,0.95)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalBackButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    marginRight: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#0056FF',
  },
  aiMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#E9ECEF',
  },
  messageText: {
    fontSize: 15,
    color: '#111',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: '#0056FF',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  typingText: {
    marginLeft: 8,
    fontSize: 13,
    color: '#666',
  },
  internshipCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    elevation: 2,
  },
  internshipImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 10,
    resizeMode: 'cover',
  },
  internshipImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 10,
    backgroundColor: '#F0F4FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  internshipContent: {
    flex: 1,
    justifyContent: 'center',
  },
  internshipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111',
    marginBottom: 4,
  },
  internshipCompany: {
    fontSize: 12,
    color: '#0056FF',
    marginBottom: 2,
  },
  internshipLocation: {
    fontSize: 11,
    color: '#666',
  },
  profileCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    elevation: 2,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
    resizeMode: 'cover',
  },
  profileImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
    backgroundColor: '#F0F4FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileContent: {
    flex: 1,
    justifyContent: 'center',
  },
  profileName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111',
    marginBottom: 4,
  },
  profileSubtitle: {
    fontSize: 12,
    color: '#0056FF',
    marginBottom: 2,
  },
  profileDegree: {
    fontSize: 11,
    color: '#666',
  },
});

export default AIScreen;