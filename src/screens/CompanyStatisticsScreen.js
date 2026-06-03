import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, FlatList, ActivityIndicator, Dimensions, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { getCompanyStatistics } from '../services/api';

const { width } = Dimensions.get('window');

const chartConfig = {
  backgroundGradientFrom: '#FFFFFF',
  backgroundGradientTo: '#FFFFFF',
  color: (opacity = 1) => `rgba(0, 86, 255, ${opacity})`,
  strokeWidth: 2,
  barPercentage: 0.6,
  decimalPlaces: 0,
  propsForLabels: { fontSize: 9, fontWeight: '500' },
  propsForDots: { r: '3', strokeWidth: '2', stroke: '#0056FF' }
};

const pieChartConfig = {
  color: (opacity = 1) => `rgba(0, 86, 255, ${opacity})`
};

const IconButton = ({ icon, size = 20, color = '#0056FF', style }) => (
  <MaterialIcons name={icon} size={size} color={color} style={style} />
);

const SectionHeader = ({ title, icon }) => (
  <View style={styles.sectionHeader}>
    <View style={styles.sectionIconContainer}>
      <Ionicons name={icon} size={20} color="#0056FF" />
    </View>
    <Text style={styles.sectionTitle}>{title}</Text>
  </View>
);

const KPICard = ({ label, value, subtext, icon, percentage }) => (
  <View style={styles.kpiCard}>
    <View style={styles.kpiHeader}>
      <View style={styles.kpiIconContainer}>
        <Ionicons name={icon} size={22} color="#0056FF" />
      </View>
      {typeof value === 'number' && percentage !== undefined && (
        <View style={styles.kpiBadge}>
          <Text style={styles.kpiBadgeText}>{percentage}%</Text>
        </View>
      )}
    </View>
    <Text style={styles.kpiValue}>{typeof value === 'number' && value > 999 ? value.toLocaleString() : value}</Text>
    <Text style={styles.kpiLabel}>{label}</Text>
    {subtext ? <Text style={styles.kpiSubtext}>{subtext}</Text> : null}
  </View>
);

const ProgressBar = ({ progress, color = '#0056FF', height = 6 }) => (
  <View style={[styles.progressTrack, { height }]}>
    <View style={[styles.progressFill, { width: `${Math.min(100, Math.max(0, progress))}%`, backgroundColor: color }]} />
  </View>
);

const RankingCard = ({ title, subtitle, metrics, color }) => (
  <View style={[styles.rankingCard, { borderLeftWidth: 3, borderLeftColor: color }]}>
    <View style={styles.rankingHeader}>
      <Text style={styles.rankingTitle} numberOfLines={1}>{title}</Text>
    </View>
    {subtitle ? <Text style={styles.rankingSubtitle}>{subtitle}</Text> : null}
    <View style={styles.rankingMetrics}>
      {metrics.map((metric, idx) => (
        <View key={idx} style={styles.metricItem}>
          <Text style={styles.metricLabel}>{metric.label}</Text>
          <Text style={[styles.metricValue, { color: metric.color || '#0056FF' }]}>{metric.value}</Text>
        </View>
      ))}
    </View>
    {metrics.some(m => m.percentage !== undefined) && (
      <ProgressBar progress={metrics.find(m => m.percentage !== undefined).percentage} color={color} />
    )}
  </View>
);

const TimelineCard = ({ item }) => {
  const getIcon = (type) => {
    switch (type) {
      case 'INTERNSHIP_POSTED': return 'briefcase-outline';
      case 'APPLICATION_RECEIVED': return 'document-text-outline';
      case 'APPLICATION_ACCEPTED': return 'checkmark-circle-outline';
      case 'APPLICATION_REJECTED': return 'close-circle-outline';
      case 'INTERNSHIP_EXPIRED': return 'time-outline';
      default: return 'ellipse-outline';
    }
  };
  const getColor = (type) => {
    switch (type) {
      case 'INTERNSHIP_POSTED': return '#0056FF';
      case 'APPLICATION_RECEIVED': return '#34C759';
      case 'APPLICATION_ACCEPTED': return '#007AFF';
      case 'APPLICATION_REJECTED': return '#FF3B30';
      case 'INTERNSHIP_EXPIRED': return '#FF9500';
      default: return '#8E8E93';
    }
  };
  return (
    <View style={styles.timelineCard}>
      <View style={[styles.timelineIconContainer, { backgroundColor: `${getColor(item.type)}15` }]}>
        <Ionicons name={getIcon(item.type)} size={18} color={getColor(item.type)} />
      </View>
      <View style={styles.timelineContent}>
        <Text style={styles.timelineTitle}>{item.title}</Text>
        <Text style={styles.timelineDescription} numberOfLines={2}>{item.description}</Text>
        {item.date ? (
          <Text style={styles.timelineDate}>{new Date(item.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</Text>
        ) : null}
      </View>
    </View>
  );
};

const CompanyStatisticsScreen = ({ route, navigation }) => {
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    const currentUserId = route.params?.userId;
    if (!currentUserId) {
      setLoading(false);
      setError('ID utilisateur manquant');
      return;
    }
    try {
      const result = await getCompanyStatistics(currentUserId);
      if (result.success) {
        setStatistics(result.statistics || {});
        setError(null);
      } else {
        setError(result.error || 'Erreur de chargement');
        setStatistics({});
      }
    } catch (e) {
      setError(e.message || 'Erreur réseau');
      setStatistics({});
    }
    setLoading(false);
    setRefreshing(false);
  }, [route.params?.userId]);

  useFocusEffect(useCallback(() => { fetchStats(); }, [fetchStats]));

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color="#0056FF" />
          <Text style={styles.loadingText}>Chargement des statistiques...</Text>
        </View>
      </SafeAreaView>
    );
  }

const {
     totalInternships = 0,
     totalActiveInternships = 0,
     totalExpiredInternships = 0,
     totalClosedInternships = 0,
     totalApplications = 0,
     totalAccepted = 0,
     totalRejected = 0,
     totalPending = 0,
     acceptanceRate = 0,
     rejectionRate = 0,
     internships = [],
     candidateBreakdown = {},
     dailyAnalytics = {},
     weeklyAnalytics = {},
     monthlyAnalytics = {},
     hourlyAnalytics = {},
     timeline = []
   } = statistics;

  const studentApps = candidateBreakdown.studentApplications || 0;
  const professorApps = candidateBreakdown.professorApplications || 0;
  const studentPercentage = candidateBreakdown.studentPercentage || 0;
  const professorPercentage = candidateBreakdown.professorPercentage || 0;

  const sortedByApps = [...internships].sort((a, b) => (b.applications || 0) - (a.applications || 0));
  const bestPerforming = sortedByApps.slice(0, 5);
  const worstPerforming = sortedByApps.slice(-5).reverse();

  const today = new Date();
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (29 - i));
    return d.toISOString().split('T')[0];
  }).reverse();
  const dailyData = last30Days.map(date => dailyAnalytics[date] || 0);

  const weekDays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
  const weekLabels = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  const weeklyData = weekDays.map(day => weeklyAnalytics[day]?.received || 0);
  const weeklyAccepted = weekDays.map(day => weeklyAnalytics[day]?.accepted || 0);
  const weeklyRejected = weekDays.map(day => weeklyAnalytics[day]?.rejected || 0);

  const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const monthLabels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
  const monthlyData = monthLabels.map((_, idx) => monthlyAnalytics[monthNames[idx]]?.received || 0);
  const monthlyAccepted = monthLabels.map((_, idx) => monthlyAnalytics[monthNames[idx]]?.accepted || 0);
  const monthlyRejected = monthLabels.map((_, idx) => monthlyAnalytics[monthNames[idx]]?.rejected || 0);

  const pieData = [
    { name: 'Étudiants', population: studentApps, color: '#0056FF', legendFontColor: '#333', legendFontSize: 12 },
    { name: 'Professeurs', population: professorApps, color: '#34C759', legendFontColor: '#333', legendFontSize: 12 }
  ].filter(item => item.population > 0);

  const internshipPerformanceData = internships.map((item, idx) => ({
    ...item,
    idx
  }));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#111" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tableau de bord</Text>
        </View>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh" size={20} color="#0056FF" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.heroCard}>
          <View style={styles.heroContent}>
            <View>
              <Text style={styles.heroLabel}>Performances globales</Text>
              <Text style={styles.heroValue}>{totalApplications} candidatures</Text>
            </View>
            <View style={styles.heroIconContainer}>
              <Ionicons name="analytics" size={40} color="#0056FF" />
            </View>
          </View>
          <View style={styles.heroStatsRow}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{acceptanceRate}%</Text>
              <Text style={styles.heroStatLabel}>Taux d'acceptation</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{totalInternships}</Text>
              <Text style={styles.heroStatLabel}>Stages publiés</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{rejectionRate}%</Text>
              <Text style={styles.heroStatLabel}>Taux de rejet</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Aperçu des KPIs" icon="grid-outline" />
          <View style={styles.kpiGrid}>
            <KPICard label="Stages publiés" value={totalInternships} icon="briefcase-outline" percentage={totalInternships ? Math.round((totalActiveInternships / totalInternships) * 100) : 0} />
            <KPICard label="Candidatures" value={totalApplications} icon="document-text-outline" />
            <KPICard label="Acceptées" value={totalAccepted} subtext={`Taux: ${acceptanceRate}%`} icon="checkmark-circle-outline" />
            <KPICard label="Rejetées" value={totalRejected} subtext={`Taux: ${rejectionRate}%`} icon="close-circle-outline" />
            <KPICard label="En attente" value={totalPending} icon="time-outline" />
            <KPICard label="En cours" value={totalActiveInternships} icon="flash-outline" />
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Taux de conversion" icon="pulse-outline" />
          <View style={styles.conversionCard}>
            <View style={styles.conversionRow}>
              <View style={styles.conversionItem}>
                <Text style={styles.conversionLabel}>Taux d'acceptation</Text>
                <Text style={styles.conversionValue}>{acceptanceRate}%</Text>
              </View>
              <View style={styles.conversionBarContainer}>
                <ProgressBar progress={acceptanceRate} color="#34C759" height={8} />
              </View>
            </View>
            <View style={styles.conversionRow}>
              <View style={styles.conversionItem}>
                <Text style={styles.conversionLabel}>Taux de rejet</Text>
                <Text style={styles.conversionValue}>{rejectionRate}%</Text>
              </View>
              <View style={styles.conversionBarContainer}>
                <ProgressBar progress={rejectionRate} color="#FF3B30" height={8} />
              </View>
            </View>
            <View style={styles.conversionRow}>
              <View style={styles.conversionItem}>
                <Text style={styles.conversionLabel}>En attente</Text>
                <Text style={styles.conversionValue}>{totalApplications ? Math.round((totalPending / totalApplications) * 100) : 0}%</Text>
              </View>
              <View style={styles.conversionBarContainer}>
                <ProgressBar progress={totalApplications ? (totalPending / totalApplications) * 100 : 0} color="#FF9500" height={8} />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Meilleurs stages" icon="trophy-outline" />
          <FlatList
            data={bestPerforming}
            keyExtractor={(item, idx) => `best-${item.id}-${idx}`}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <RankingCard
                title={item.title}
                subtitle={`${item.applications} candidatures`}
                metrics={[
                  { label: 'Applications', value: item.applications || 0 },
                  { label: 'Acceptées', value: item.accepted || 0, color: '#34C759' },
                  { label: 'Taux', value: `${item.acceptanceRate || 0}%`, percentage: item.acceptanceRate || 0, color: '#34C759' }
                ]}
                color="#34C759"
              />
            )}
            ListEmptyComponent={<Text style={styles.emptyText}>Aucune donnée disponible</Text>}
          />
        </View>

        <View style={styles.section}>
          <SectionHeader title="Stages à améliorer" icon="alert-circle-outline" />
          <FlatList
            data={worstPerforming}
            keyExtractor={(item, idx) => `worst-${item.id}-${idx}`}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <RankingCard
                title={item.title}
                subtitle={`${item.applications} candidatures`}
                metrics={[
                  { label: 'Applications', value: item.applications || 0 },
                  { label: 'Acceptées', value: item.accepted || 0, color: '#FF3B30' },
                  { label: 'Taux', value: `${item.acceptanceRate || 0}%`, percentage: item.acceptanceRate || 0, color: '#FF3B30' }
                ]}
                color="#FF3B30"
              />
            )}
            ListEmptyComponent={<Text style={styles.emptyText}>Aucune donnée disponible</Text>}
          />
        </View>

        <View style={styles.section}>
          <SectionHeader title="Tendances quotidiennes" icon="trending-up-outline" />
          <View style={styles.chartWrapper}>
            <LineChart
              data={{
                labels: [],
                datasets: [{ data: dailyData.length ? dailyData : [0] }]
              }}
              width={width - 48}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
              withInnerLines
              withOuterLines
              withDots
              withHorizontalLabels
              withVerticalLabels
              segments={4}
              yAxisInterval={Math.max(1, Math.ceil(Math.max(...dailyData, 1) / 4))}
            />
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Statistiques hebdomadaires" icon="calendar-outline" />
          <View style={styles.chartWrapper}>
            <BarChart
              data={{
                labels: weekLabels,
                datasets: [
                  { data: weeklyData },
                  { data: weeklyAccepted },
                  { data: weeklyRejected }
                ]
              }}
              width={width - 48}
              height={240}
              chartConfig={chartConfig}
              style={styles.chart}
              barPercentage={0.5}
              showValuesOnTopOfBars
              fromZero
            />
          </View>
          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#0056FF' }]} />
              <Text style={styles.legendText}>Reçues</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#34C759' }]} />
              <Text style={styles.legendText}>Acceptées</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#FF3B30' }]} />
              <Text style={styles.legendText}>Rejetées</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Statistiques par heure" icon="time-outline" />
          <View style={styles.chartWrapper}>
            <BarChart
              data={{
                labels: Array.from({ length: 24 }, (_, i) => `${i}h`),
                datasets: [
                  { data: Array.from({ length: 24 }, (_, i) => hourlyAnalytics[String(i)] || 0) }
                ]
              }}
              width={width - 48}
              height={260}
              chartConfig={{
                ...chartConfig,
                color: (opacity = 1) => `rgba(255, 149, 0, ${opacity})`,
                propsForLabels: { fontSize: 8 }
              }}
              style={styles.chart}
              barPercentage={0.8}
              showValuesOnTopOfBars
              fromZero
              withVerticalLabels
            />
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Statistiques mensuelles" icon="calendar-numbers-outline" />
          <View style={styles.chartWrapper}>
            <BarChart
              data={{
                labels: monthLabels,
                datasets: [
                  { data: monthlyData },
                  { data: monthlyAccepted },
                  { data: monthlyRejected }
                ]
              }}
              width={width - 48}
              height={240}
              chartConfig={chartConfig}
              style={styles.chart}
              barPercentage={0.5}
              showValuesOnTopOfBars
              fromZero
            />
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Performance par stage" icon="bar-chart-outline" />
          <FlatList
            data={internshipPerformanceData}
            keyExtractor={(item, idx) => `perf-${item.id}-${idx}`}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View style={[styles.performanceCard, { borderLeftWidth: 3, borderLeftColor: '#0056FF' }]}>
                <View style={styles.performanceHeader}>
                  <Text style={styles.performanceTitle} numberOfLines={1}>{item.title}</Text>
                  <View style={[styles.statusPill, { backgroundColor: item.status === 'ACTIVE' ? '#E8F5E9' : item.status === 'EXPIRED' ? '#FFEBEE' : '#F5F5F5' }]}>
                    <Text style={[styles.statusPillText, { color: item.status === 'ACTIVE' ? '#2E7D32' : item.status === 'EXPIRED' ? '#C62828' : '#666' }]}>{item.status}</Text>
                  </View>
                </View>
                <View style={styles.performanceMetrics}>
                  <Metric label="Candidatures" value={item.applications || 0} />
                  <Metric label="Acceptées" value={item.accepted || 0} color="#34C759" />
                  <Metric label="Rejetées" value={item.rejected || 0} color="#FF3B30" />
                  <Metric label="En attente" value={item.pending || 0} color="#FF9500" />
                </View>
                {item.applications > 0 && (
                  <View style={styles.progressContainer}>
                    <View style={styles.progressHeader}>
                      <Text style={styles.progressLabel}>Taux d'acceptation</Text>
                      <Text style={styles.progressPercentage}>{item.acceptanceRate || 0}%</Text>
                    </View>
                    <ProgressBar progress={item.acceptanceRate || 0} color="#0056FF" height={5} />
                  </View>
                )}
              </View>
            )}
            ListEmptyComponent={<Text style={styles.emptyText}>Aucun stage disponible</Text>}
          />
        </View>

        <View style={styles.section}>
          <SectionHeader title="Candidatures par profil" icon="people-outline" />
          {pieData.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={48} color="#CCC" />
              <Text style={styles.emptyText}>Aucune candidature disponible</Text>
            </View>
          ) : (
            <View style={styles.candidateContainer}>
              <View style={styles.pieChartWrapper}>
                <PieChart
                  data={pieData}
                  width={width - 48}
                  height={220}
                  chartConfig={pieChartConfig}
                  accessor="population"
                  backgroundColor="transparent"
                  paddingLeft="15"
                  center={[10, 10]}
                  absolute
                />
              </View>
              <View style={styles.candidateDetails}>
                <View style={styles.candidateRow}>
                  <View style={[styles.candidateDot, { backgroundColor: '#0056FF' }]} />
                  <View style={styles.candidateInfo}>
                    <Text style={styles.candidateLabel}>Étudiants</Text>
                    <Text style={styles.candidateValue}>{studentApps} candidatures</Text>
                  </View>
                  <Text style={styles.candidatePercentage}>{studentPercentage}%</Text>
                </View>
                <View style={styles.candidateRow}>
                  <View style={[styles.candidateDot, { backgroundColor: '#34C759' }]} />
                  <View style={styles.candidateInfo}>
                    <Text style={styles.candidateLabel}>Professeurs</Text>
                    <Text style={styles.candidateValue}>{professorApps} candidatures</Text>
                  </View>
                  <Text style={styles.candidatePercentage}>{professorPercentage}%</Text>
                </View>
                <View style={{ marginTop: 12 }}>
                  <ProgressBar progress={studentPercentage} color="#0056FF" height={6} />
                  <View style={styles.progressLabels}>
                    <Text style={styles.progressLabelText}>Étudiants: {studentPercentage}%</Text>
                    <Text style={styles.progressLabelText}>Professeurs: {professorPercentage}%</Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <SectionHeader title="Historique récent" icon="time-outline" />
          <FlatList
            data={timeline}
            keyExtractor={(item, idx) => `timeline-${idx}`}
            scrollEnabled={false}
            renderItem={({ item }) => <TimelineCard item={item} />}
            ListEmptyComponent={<Text style={styles.emptyText}>Aucune activité récente</Text>}
          />
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const Metric = ({ label, value, color }) => (
  <View style={styles.metricItem}>
    <Text style={styles.metricLabel}>{label}</Text>
    <Text style={[styles.metricValue, { color: color || '#0056FF' }]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA'
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA'
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: '#666',
    fontWeight: '500'
  },
  scrollContent: {
    paddingBottom: 40
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0'
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#F8F9FA'
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111',
    letterSpacing: -0.3
  },
  refreshButton: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#F8F9FA'
  },
  heroCard: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: '#0056FF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#0056FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6
  },
  heroContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  heroLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6
  },
  heroValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: -0.5
  },
  heroIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  heroStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)'
  },
  heroStat: {
    flex: 1,
    alignItems: 'center'
  },
  heroStatValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: -0.3
  },
  heroStatLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
    fontWeight: '500'
  },
  heroDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.2)'
  },
  section: {
    marginTop: 20,
    marginHorizontal: 20
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10
  },
  sectionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#E8F0FF',
    justifyContent: 'center',
    alignItems: 'center'
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111',
    letterSpacing: -0.2
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  kpiCard: {
    width: '47%',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0'
  },
  kpiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  kpiIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#E8F0FF',
    justifyContent: 'center',
    alignItems: 'center'
  },
  kpiBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#F0F0F0'
  },
  kpiBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666'
  },
  kpiValue: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111',
    letterSpacing: -0.5,
    marginBottom: 4
  },
  kpiLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500'
  },
  kpiSubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 2
  },
  conversionCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0'
  },
  conversionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16
  },
  conversionItem: {
    width: 140,
    marginRight: 12
  },
  conversionLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
    marginBottom: 4
  },
  conversionValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111',
    letterSpacing: -0.3
  },
  conversionBarContainer: {
    flex: 1
  },
  progressTrack: {
    width: '100%',
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    borderRadius: 4
  },
  rankingCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#F0F0F0'
  },
  rankingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  rankingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111',
    flex: 1,
    marginRight: 12,
    letterSpacing: -0.2
  },
  rankingSubtitle: {
    fontSize: 13,
    color: '#666',
    marginBottom: 10,
    fontWeight: '500'
  },
  rankingMetrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  metricLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500'
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0056FF'
  },
  progressContainer: {
    marginTop: 12
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  progressLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500'
  },
  progressPercentage: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0056FF'
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6
  },
  progressLabelText: {
    fontSize: 11,
    color: '#999',
    fontWeight: '500'
  },
  chartWrapper: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    alignItems: 'center'
  },
  chart: {
    borderRadius: 12
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 16
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5
  },
  legendText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500'
  },
  performanceCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#F0F0F0'
  },
  performanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  performanceTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111',
    flex: 1,
    marginRight: 12,
    letterSpacing: -0.2
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase'
  },
  performanceMetrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0'
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    fontWeight: '500',
    paddingVertical: 12
  },
  candidateContainer: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0'
  },
  pieChartWrapper: {
    alignItems: 'center',
    marginBottom: 20
  },
  candidateDetails: {
    gap: 14
  },
  candidateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  candidateDot: {
    width: 12,
    height: 12,
    borderRadius: 6
  },
  candidateInfo: {
    flex: 1
  },
  candidateLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111',
    letterSpacing: -0.1
  },
  candidateValue: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
    fontWeight: '500'
  },
  candidatePercentage: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0056FF',
    minWidth: 50,
    textAlign: 'right'
  },
  timelineCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#F5F5F5'
  },
  timelineIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  timelineContent: {
    flex: 1
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111',
    letterSpacing: -0.1,
    marginBottom: 2
  },
  timelineDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 4
  },
  timelineDate: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500'
  }
});

export default CompanyStatisticsScreen;
