import React, { useContext, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Alert, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { makeRedirectUri } from 'expo-auth-session';
import { AuthContext } from '../utils/AuthContext';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const REDIRECT_URI = makeRedirectUri({ native: "com.swiftycompanion://oauth" });
const CLIENT_ID = "u-s4t2ud-eada5197242c69a9cbe15329b4aec863700f7f919b7c0694a4e1b1afc6ec8c41";
const SECRET = "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";
const TOKEN_URL = "https://api.intra.42.fr/oauth/token";
const AUTH_URL = `https://api.intra.42.fr/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code`;

const WebViewScreen = ({ navigation }) => {
  const { signIn } = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(false);

  const getToken = async (authCode) => {
    try {
      console.log('Getting token with code:', authCode);
      console.log('Redirect URI:', REDIRECT_URI);
      
      const { data } = await axios.post(TOKEN_URL, {
        grant_type: "authorization_code",
        client_id: CLIENT_ID,
        client_secret: SECRET,
        code: authCode,
        redirect_uri: REDIRECT_URI,
      });
      console.log('Token response:', data);

      const { access_token, refresh_token, expires_in, secret_valid_until } = data;
      const expiresAt = Date.now() + (expires_in * 1000); // Convert to milliseconds
      
      // Store tokens and expiration
      await AsyncStorage.setItem("userToken", access_token);
      await AsyncStorage.setItem("refreshToken", refresh_token);
      await AsyncStorage.setItem("expiresAt", expiresAt.toString());
      if (secret_valid_until) {
        await AsyncStorage.setItem("secretValidUntil", secret_valid_until.toString());
      }
      
      console.log("Token stored successfully");
      return access_token;
    } catch (error) {
      console.error("Error getting token:", error?.response?.data || error);
      return null;
    }
  };

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