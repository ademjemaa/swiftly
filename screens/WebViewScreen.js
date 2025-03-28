import React, { useContext, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Alert, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { makeRedirectUri } from 'expo-auth-session';
import { AuthContext } from '../utils/AuthContext';
import { getToken } from '../utils/auth';

const CLIENT_ID = "u-s4t2ud-eada5197242c69a9cbe15329b4aec863700f7f919b7c0694a4e1b1afc6ec8c41";
const REDIRECT_URI = makeRedirectUri({ native: "com.swiftycompanion://oauth" });
const AUTH_URL = `https://api.intra.42.fr/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code`;

const WebViewScreen = ({ navigation }) => {
  const { signIn } = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(false);

  const handleNavigationStateChange = async (navState) => {
    if (navState.url.includes(REDIRECT_URI.split('://')[1]) && navState.url.includes('code=')) {
      setIsLoading(true);
      
      const code = navState.url.split('code=')[1].split('&')[0];
      console.log('Authorization code received:', code);
      
      try {
        const token = await getToken(code);
        
        if (token) {
          const success = await signIn(token);
          
          if (success) {
            console.log('Successfully authenticated with 42 API');
          } else {
            Alert.alert('Authentication Failed', 'Could not retrieve user data.');
            navigation.goBack();
          }
        } else {
          Alert.alert('Authentication Failed', 'Could not retrieve access token.');
          navigation.goBack();
        }
      } catch (error) {
        console.error('OAuth error:', error);
        Alert.alert('Authentication Error', 'An error occurred during authentication.');
        navigation.goBack();
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00BABC" />
        <Text style={styles.loadingText}>Authenticating with 42...</Text>
      </View>
    );
  }

  return (
    <WebView
      source={{ uri: AUTH_URL }}
      onNavigationStateChange={handleNavigationStateChange}
      startInLoadingState={true}
      incognito={true}
      renderLoading={() => (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00BABC" />
        </View>
      )}
    />
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5'
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333'
  }
});

export default WebViewScreen;