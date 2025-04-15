import React from 'react';
import { View, Text } from 'react-native';
import { styles } from '../styles/profileStyles';

const StatsSection = ({ currentUser }) => {
  return (
    <View style={styles.statsContainer}>
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{currentUser.correction_point || 0}</Text>
        <Text style={styles.statLabel}>Correction Points</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{currentUser.wallet || 0}</Text>
        <Text style={styles.statLabel}>Wallet</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{currentUser.location || 'N/A'}</Text>
        <Text style={styles.statLabel}>Location</Text>
      </View>
    </View>
  );
};

export default StatsSection; 