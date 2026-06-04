import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import HomeScreen from './src/screens/HomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import CategoryScreen from './src/screens/CategoryScreen';
import StudentRegisterScreen from './src/screens/StudentRegisterScreen';
import TeacherRegisterScreen from './src/screens/TeacherRegisterScreen';
import CompanyRegisterScreen from './src/screens/CompanyRegisterScreen';
import PhotoUploadScreen from './src/screens/PhotoUploadScreen';
import EmailVerificationScreen from './src/screens/EmailVerificationScreen';
import ProfilScreen from './src/screens/ProfilScreen';
import ProfessorProfilesScreen from './src/screens/ProfessorProfilesScreen';
import InternshipsListScreen from './src/screens/InternshipsListScreen';
import AIScreen from './src/screens/AIScreen';
import PosterStageScreen from './src/screens/PosterStageScreen';
import CompanyStatisticsScreen from './src/screens/CompanyStatisticsScreen';
import CompanyInternshipsScreen from './src/screens/CompanyInternshipsScreen';
import InternshipDetailScreen from './src/screens/InternshipDetailScreen';
import ProfilCandidatScreen from './src/screens/ProfilCandidatScreen';
import AcceptedCandidatesScreen from './src/screens/AcceptedCandidatesScreen';
import AccepterDemandesStageScreen from './src/screens/AccepterDemandesStageScreen';
import PaymentScreen from './src/screens/PaymentScreen';
import AcademicInfoScreen from './src/screens/AcademicInfoScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: '#0056FF',
        tabBarInactiveTintColor: '#666',
        tabBarStyle: { display: 'flex' },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = 'help-outline';
          if (route.name === 'Internships') {
            iconName = 'briefcase-outline';
          } else if (route.name === 'Profil') {
            iconName = 'person-outline';
          } else if (route.name === 'AI') {
            iconName = 'chatbubble-outline';
          } else if (route.name === 'ProfessorProfiles') {
            iconName = 'school-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Internships" component={InternshipsListScreen} />
      <Tab.Screen name="ProfessorProfiles" component={ProfessorProfilesScreen} />
      <Tab.Screen name="Profil" component={ProfilScreen} />
      <Tab.Screen name="AI" component={AIScreen} />
    </Tab.Navigator>
  );
}

function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Login">
          <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Category" component={CategoryScreen} options={{ headerShown: false }} />
          <Stack.Screen name="StudentRegister" component={StudentRegisterScreen} options={{ headerShown: false }} />
          <Stack.Screen name="TeacherRegister" component={TeacherRegisterScreen} options={{ headerShown: false }} />
          <Stack.Screen name="CompanyRegister" component={CompanyRegisterScreen} options={{ headerShown: false }} />
          <Stack.Screen name="PhotoUpload" component={PhotoUploadScreen} options={{ headerShown: false }} />
          <Stack.Screen name="EmailVerification" component={EmailVerificationScreen} options={{ headerShown: false }} />
          <Stack.Screen name="MainTabs" component={MainTabNavigator} options={{ headerShown: false }} />
          <Stack.Screen name="Payment" component={PaymentScreen} options={{ headerShown: false }} />
          <Stack.Screen name="AcademicInfo" component={AcademicInfoScreen} options={{ headerShown: false }} />
          <Stack.Screen name="PosterStage" component={PosterStageScreen} options={{ headerShown: false }} />
          <Stack.Screen name="CompanyStatistics" component={CompanyStatisticsScreen} options={{ headerShown: false }} />
          <Stack.Screen name="CompanyInternships" component={CompanyInternshipsScreen} options={{ headerShown: false }} />
          <Stack.Screen name="InternshipDetail" component={InternshipDetailScreen} options={{ headerShown: false }} />
          <Stack.Screen name="ProfilCandidat" component={ProfilCandidatScreen} options={{ headerShown: false }} />
          <Stack.Screen name="AcceptedCandidates" component={AcceptedCandidatesScreen} options={{ headerShown: false }} />
          <Stack.Screen name="AccepterDemandesStage" component={AccepterDemandesStageScreen} options={{ headerShown: false }} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default App;