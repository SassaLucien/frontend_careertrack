import React from 'react';
import { View, TouchableOpacity, StyleSheet, Animated, Easing, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PremiumTabBar = ({ state, descriptors, navigation }) => {
  const { bottom } = useSafeAreaInsets();
  
  // Animation for active tab
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  
  // Update animation when tab changes
  React.useEffect(() => {
    scaleAnim.setValue(1);
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.2,
        duration: 200,
        easing: Easing.out(Easing.elastic(0.4)),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.elastic(0.4)),
        useNativeDriver: true,
      }),
    ]).start();
  }, [state.index, scaleAnim]);

  return (
    <View style={[styles.tabBarContainer, { marginBottom: bottom > 0 ? bottom : 20 }]}>
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const { color, focusedColor } = descriptors[route.key].options.tabBarIcon 
          || { color: '#5B6470', focusedColor: '#FFFFFF' };
        
        // Tab label mapping
        const labels = {
          Internships: 'Stages',
          Profile: 'Profil',
          Professor: 'Professeurs',
          AI: 'IA'
        };
        
        // Ionicons mapping
        const icons = {
          Internships: 'briefcase-outline',
          Profile: 'person-outline',
          Professor: 'people-outline',
          AI: 'sparkles-outline'
        };
        
        const focusedIoniconss = {
          Internships: 'briefcase-sharp',
          Profile: 'person-sharp',
          Professor: 'people-sharp',
          AI: 'sparkles'
        };

        return (
          <TouchableOpacity
            key={route.key}
            onPress={() => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
              });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            }}
            style={[
              styles.tabItem,
              isFocused && styles.activeTab,
              !isFocused && styles.inactiveTab
            ]}
          >
            {/* Active tab background with animation */}
            {isFocused && (
              <Animated.View style={[styles.activeBackground, { transform: [{ scale: scaleAnim }] }]}>
                <Ionicons 
                  name={focusedIoniconss[route.name] || icons[route.name]} 
                  size={26} 
                  color="#FFFFFF" 
                  style={styles.activeIonicons}
                />
              </Animated.View>
            )}
            
            {/* Inactive tab icon */}
            {!isFocused && (
              <Ionicons 
                name={icons[route.name]} 
                size={24} 
                color={color} 
                style={styles.inactiveIonicons}
              />
            )}
            
            {/* Label for active tab only */}
            {isFocused && (
              <Text style={styles.activeLabel}>
                {labels[route.name] || route.name}
              </Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    height: 80,
    borderRadius: 40,
    marginHorizontal: 20,
    marginBottom: 20,
    elevation: 12,
    shadowColor: '#0057FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    position: 'relative',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  activeTab: {
    // Styles applied when tab is active (for touch feedback)
  },
  inactiveTab: {
    // Styles applied when tab is inactive
  },
  activeBackground: {
    position: 'absolute',
    bottom: 8,
    left: '50%',
    transform: [{ translateX: '-50%' }],
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0057FF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#0057FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  activeIonicons: {
    // Ionicons styles for active tab
  },
  inactiveIonicons: {
    // Ionicons styles for inactive tab
  },
  activeLabel: {
    position: 'absolute',
    top: -24,
    left: '50%',
    transform: [{ translateX: '-50%' }],
    backgroundColor: '#0057FF',
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    whiteSpace: 'nowrap',
    elevation: 4,
    shadowColor: '#0057FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
});

export default PremiumTabBar;