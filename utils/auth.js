import AsyncStorage from '@react-native-async-storage/async-storage';
import { makeRedirectUri } from "expo-auth-session";
import axios from 'axios';

const CLIENT_ID = "u-s4t2ud-eada5197242c69a9cbe15329b4aec863700f7f919b7c0694a4e1b1afc6ec8c41";
const SECRET = "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";
const TOKEN_URL = "https://api.intra.42.fr/oauth/token";
const API_URL = "https://api.intra.42.fr/v2";
const REDIRECT_URI = makeRedirectUri({ native: "com.swiftycompanion://oauth" });

export const getToken = async (authCode) => {
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
    console.log(data);

    const { access_token, refresh_token, expires_in, secret_valid_until } = data;
    const expiresAt = Date.now() + (expires_in * 1000); 
    
    await AsyncStorage.setItem("userToken", access_token);
    await AsyncStorage.setItem("refreshToken", refresh_token);
    await AsyncStorage.setItem("expiresAt", expiresAt.toString());
    await AsyncStorage.setItem("secretValidUntil", secret_valid_until.toString());
    
    console.log("Token stored successfully");
    return access_token;
  } catch (error) {
    console.error("Error getting token:", error?.response?.data || error);
    return null;
  }
};

export const refreshAccessToken = async () => {
  try {
    const refreshToken = await AsyncStorage.getItem('refreshToken');
    if (!refreshToken) {
      console.error("No refresh token available");
      return null;
    }

    const { data } = await axios.post(TOKEN_URL, {
      grant_type: "refresh_token",
      client_id: CLIENT_ID,
      client_secret: SECRET,
      refresh_token: refreshToken,
    });
    console.log(data);

    const { access_token, refresh_token, expires_in, secret_valid_until } = data;
    const expiresAt = Date.now() + (expires_in * 1000);

    // Store new tokens and expiration
    await AsyncStorage.setItem("userToken", access_token);
    await AsyncStorage.setItem("refreshToken", refresh_token);
    await AsyncStorage.setItem("expiresAt", expiresAt.toString());
    await AsyncStorage.setItem("secretValidUntil", secret_valid_until.toString());

    console.log("Token refreshed successfully");
    return access_token;
  } catch (error) {
    console.error("Error refreshing token:", error?.response?.data || error);
    return null;
  }
};

// Function to check if the token is expired
export const isTokenExpired = async () => {
  try {
    const expiresAt = await AsyncStorage.getItem('expiresAt');
    
    if (!expiresAt) {
      return true; // No expiration time exists, consider it expired
    }

    const expirationTime = parseInt(expiresAt);
    const isExpired = Date.now() >= expirationTime;
    
    console.log(`Token expires at: ${expirationTime}, current time: ${Date.now()}, is expired: ${isExpired}`);
    
    return isExpired;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true;
  }
};

export const isSecretExpired = async () => {
  try {
    const secretValidUntil = await AsyncStorage.getItem('secretValidUntil');
    
    if (!secretValidUntil) {
      return false; // No secret expiration time exists, consider it not expired
    }

    const secretExpirationTime = parseInt(secretValidUntil);
    // Convert secretExpirationTime from seconds to milliseconds for comparison
    const isExpired = Date.now() >= (secretExpirationTime * 1000);
    
    console.log(`Secret valid until: ${secretExpirationTime}, current time: ${Math.floor(Date.now()/1000)}, is expired: ${isExpired}`);
    
    return isExpired;
  } catch (error) {
    console.error('Error checking secret expiration:', error);
    return false;
  }
};

// Modify fetchUserData to handle token expiration
export const fetchUserData = async () => {
  try {
    const token = await getStoredToken();
    if (!token) {
      console.error("No token available for fetching user data");
      return null;
    }

    // Use axios directly instead of the api instance to avoid circular dependency
    const res = await axios.get(`${API_URL}/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return res.data;
  } catch (error) {
    console.error("Error fetching user data:", error?.response?.data || error);
    return null;
  }
};

// Modify getStoredToken to include expiration check
export const getStoredToken = async () => {
  try {
    // Only check if the token is expired, don't try to refresh here
    const tokenExpired = await isTokenExpired();
    
    if (tokenExpired) {
      // Return null if token is expired - refresh will be handled by the API interceptor
      return null;
    }

    return await AsyncStorage.getItem('userToken');
  } catch (error) {
    console.error('Error getting stored token:', error);
    return null;
  }
};

// Modify login function to store token with expiration
export const login = async (credentials) => {
  try {
    const response = await axios.post('/auth/login', credentials);
    
    // Assuming the response includes token and expiration time
    const { token, expiresIn } = response.data;
    
    // Calculate expiration timestamp
    const expiresAt = Date.now() + expiresIn * 1000; // convert to milliseconds
    
    // Store token and expiration data
    await AsyncStorage.setItem('userToken', token);
    await AsyncStorage.setItem('expires_in', JSON.stringify({ expiresAt }));
    
    return token;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const logout = async () => {
  try {
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('refreshToken');
    await AsyncStorage.removeItem('expiresAt');
    await AsyncStorage.removeItem('secretValidUntil');
  } catch (error) {
    console.error('Logout error:', error);
  }
};