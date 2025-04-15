import React from 'react';
import { View, Text, Image } from 'react-native';
import { styles } from '../styles/profileStyles';
import { getUserLevel } from '../utils/profileHelpers';

const ProfileHeader = ({ currentUser }) => {
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Image
          source={{ uri: currentUser.image?.link || 'https://cdn.intra.42.fr/users/default.png' }}
          style={styles.profileImage}
        />
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{currentUser.displayname || currentUser.login}</Text>
          <Text style={styles.userLogin}>@{currentUser.login}</Text>
          <Text style={styles.userEmail}>{currentUser.email}</Text>
        </View>
      </View>
      <View style={styles.levelContainer}>
        <Text style={styles.levelText}>{getUserLevel(currentUser)?.toFixed(2)}</Text>
      </View>
    </View>
  );
};

export default ProfileHeader; 