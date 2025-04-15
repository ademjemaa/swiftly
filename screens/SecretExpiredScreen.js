import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Linking } from 'react-native';
import { logout } from '../utils/auth';

const SecretExpiredScreen = ({ navigation }) => {
  const handleLogout = async () => {
    await logout();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  const handleOpenAPIManagement = () => {
    Linking.openURL('https://profile.intra.42.fr/oauth/applications');
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Image 
          source={require('../assets/error.png')} 
          style={styles.errorImage}
          // If you don't have this image, create a fallback
          onError={(e) => console.log('Image not found, please add an error image asset')}
        />
        
        <Text style={styles.title}>Secret Has Expired</Text>
        
        <Text style={styles.message}>
          Your API secret has expired. You need to get a new secret from the 42 API management portal.
        </Text>

        <TouchableOpacity 
          style={styles.apiButton} 
          onPress={handleOpenAPIManagement}
        >
          <Text style={styles.apiButtonText}>Go to 42 API Management</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={handleLogout}
        >
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  errorImage: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#555',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 22,
  },
  apiButton: {
    backgroundColor: '#00BABC',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginBottom: 15,
    width: '100%',
    alignItems: 'center',
  },
  apiButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  logoutButton: {
    backgroundColor: '#f44336',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 5,
    width: '100%',
    alignItems: 'center',
  },
  logoutText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  }
});

export default SecretExpiredScreen; 