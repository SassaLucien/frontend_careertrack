import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Image, FlatList, RefreshControl, TextInput } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { getAllInternships } from '../services/api';

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

const InternshipsListScreen = ({ navigation, route }) => {
  const [allInternships, setAllInternships] = React.useState([]);
  const [refreshing, setRefreshing] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedFilter, setSelectedFilter] = React.useState('All');
  const userId = route?.params?.userId || route?.params?.companyId;

  React.useEffect(() => {
    loadInternships();
  }, []);

  const loadInternships = async () => {
    try {
      const result = await getAllInternships();
      console.log('Internships result:', result);
      if (result.success) {
        setAllInternships(result.internships);
      }
    } catch (e) {
      console.log('Load error:', e);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInternships();
    setRefreshing(false);
  };

  const internships = React.useMemo(() => {
    let filtered = [...allInternships];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.title?.toLowerCase().includes(query) ||
        item.companyName?.toLowerCase().includes(query) ||
        item.location?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query)
      );
    }

    const now = new Date();
    switch (selectedFilter) {
      case 'Active':
        filtered = filtered.filter(i => i.status !== 'EXPIRED' && i.status !== 'CLOSED');
        break;
      case 'Remote':
        filtered = filtered.filter(i =>
          i.location?.toLowerCase().includes('remote') ||
          i.location?.toLowerCase().includes('distance') ||
          i.location?.toLowerCase().includes('à distance')
        );
        break;
      case 'On-site':
        filtered = filtered.filter(i =>
          !i.location?.toLowerCase().includes('remote') &&
          !i.location?.toLowerCase().includes('distance') &&
          !i.location?.toLowerCase().includes('à distance')
        );
        break;
      case 'Expired':
        filtered = filtered.filter(i => i.status === 'EXPIRED' || (i.expirationDate && new Date(i.expirationDate) < now));
        break;
    }

    return filtered;
  }, [allInternships, searchQuery, selectedFilter]);

  const filters = [
    { label: 'Tous', value: 'All' },
    { label: 'Actifs', value: 'Active' },
    { label: 'À distance', value: 'Remote' },
    { label: 'Sur site', value: 'On-site' },
    { label: 'Expirés', value: 'Expired' }
  ];

  const renderItem = ({ item }) => {
    const startDate = item.start_date || item.startDate;
    const endDate = item.end_date || item.endDate;
    const imageUrl = item.imageUrl || item.image_url;

    return (
      <View style={styles.card}>
        <TouchableOpacity onPress={() => navigation.navigate('InternshipDetail', { internship: item })}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.cardImage} />
          ) : (
            <View style={styles.cardImagePlaceholder}>
              <Ionicons name="image-outline" size={32} color="#0056FF" />
            </View>
          )}
          <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
              </View>
            </View>

            <View style={styles.cardCompanyRow}>
              <Ionicons name="business-outline" size={14} color="#0056FF" />
              <Text style={styles.cardCompany}>{item.companyName}</Text>
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

            <View style={styles.cardFooter}>
              <Text style={styles.cardDate}>Publié le: {item.postedAt ? new Date(item.postedAt).toLocaleDateString() : '-'}</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const renderFilterButton = ({ item }) => (
    <TouchableOpacity
      style={[styles.filterButton, selectedFilter === item.value && styles.filterButtonActive]}
      onPress={() => setSelectedFilter(item.value)}
    >
      <Text style={[styles.filterButtonText, selectedFilter === item.value && styles.filterButtonTextActive]}>
        {item.label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Stages disponibles</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Ionicons name="search" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.filtersContainer}>
        <FlatList
          horizontal
          data={filters}
          keyExtractor={(item) => item.value}
          renderItem={renderFilterButton}
          contentContainerStyle={styles.filtersList}
          showsHorizontalScrollIndicator={false}
        />
      </View>

      <FlatList
        data={internships}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="briefcase-outline" size={48} color="#CCC" />
            <Text style={styles.emptyText}>Aucun stage disponible</Text>
          </View>
        }
      />

      {userId && (
        <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('PosterStage', { userId })}>
          <Ionicons name="add" size={28} color="#FFF" />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { padding: 20, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#111' },
  searchContainer: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFF' },
  searchInputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#F0F0F0', gap: 10 },
  searchInput: { flex: 1, fontSize: 15, color: '#111' },
  filtersContainer: { backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0', paddingVertical: 10 },
  filtersList: { paddingHorizontal: 12 },
  filterButton: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#F5F5F5', borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: '#F0F0F0' },
  filterButtonActive: { backgroundColor: '#0056FF', borderColor: '#0056FF' },
  filterButtonText: { fontSize: 13, color: '#666', fontWeight: '600' },
  filterButtonTextActive: { color: '#FFF' },
  card: { backgroundColor: '#FFF', borderRadius: 10, marginBottom: 10, marginHorizontal: 10, elevation: 1, borderWidth: 1, borderColor: '#F0F0F0', overflow: 'hidden' },
  cardImage: { width: '100%', height: 80, resizeMode: 'cover' },
  cardImagePlaceholder: { width: '100%', height: 80, backgroundColor: '#F0F4FF', justifyContent: 'center', alignItems: 'center' },
  cardContent: { padding: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#111', flex: 1, marginRight: 8 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 10, color: '#FFF', fontWeight: '600' },
  cardCompanyRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
  cardCompany: { fontSize: 13, fontWeight: '500', color: '#0056FF' },
  cardDescription: { fontSize: 13, color: '#666', marginBottom: 8 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4, gap: 6 },
  infoValue: { fontSize: 12, color: '#555' },
  cardFooter: { marginTop: 6, paddingTop: 6, borderTopWidth: 0.5, borderTopColor: '#F0F0F0' },
  cardDate: { fontSize: 11, color: '#999' },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#999', fontSize: 14, marginTop: 12 },
  fab: { position: 'absolute', bottom: 30, right: 30, backgroundColor: '#0056FF', width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 4 }
});

export default InternshipsListScreen;