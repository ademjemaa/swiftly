import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';

const LoginScreen = ({ navigation }) => {
  const handleLogin = () => {
    navigation.navigate('WebView');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Image 
          source={{ uri: 'https://42.fr/wp-content/uploads/2021/08/42-Final-sigle-seul.svg' }} 
          style={styles.logo}
          resizeMode="contain"
        />
        
        <Text style={styles.title}>42 Profile Viewer</Text>
        <Text style={styles.subtitle}>Connect with your 42 account to access your profile information</Text>
        
        <TouchableOpacity
          style={styles.loginButton}
          onPress={handleLogin}
        >
          <Text style={styles.buttonText}>Login with 42</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.footer}>This app uses the official 42 API</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
    color: '#666',
    paddingHorizontal: 20,
  },
  loginButton: {
    backgroundColor: '#00BABC',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
    width: '80%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    color: '#999',
    fontSize: 12,
  },
});

export default LoginScreen;