import AsyncStorage from '@react-native-async-storage/async-storage';
import { makeRedirectUri } from "expo-auth-session";
import api from "./api"; 
import axios from 'axios'; // Assuming you're using axios for API calls

const CLIENT_ID = "u-s4t2ud-eada5197242c69a9cbe15329b4aec863700f7f919b7c0694a4e1b1afc6ec8c41";
const SECRET = "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";
const TOKEN_URL = "https://api.intra.42.fr/oauth/token";
const REDIRECT_URI = makeRedirectUri({ native: "com.swiftycompanion://oauth" });

export const getToken = async (authCode) => {
  try {
    console.log('Getting token with code:', authCode);
    console.log('Redirect URI:', REDIRECT_URI);
    
    const res = await axios.post(TOKEN_URL, {
      grant_type: "authorization_code",
      client_id: CLIENT_ID,
      client_secret: SECRET,
      code: authCode,
      redirect_uri: REDIRECT_URI,
    });

    const token = res.data.access_token;
    await AsyncStorage.setItem("token", token);
    console.log("Token stored successfully");

    return token;
  } catch (error) {
    console.error("Error getting token:", error?.response?.data || error);
    return null;
  }
};

// Function to check if the token is expired
export const isTokenExpired = async () => {
  try {
    // Retrieve the token and its expiration time from AsyncStorage
    const tokenData = await AsyncStorage.getItem('tokenData');
    
    if (!tokenData) {
      return true; // No token exists, consider it expired
    }

    const { expiresAt } = JSON.parse(tokenData);
    
    // Compare current time with expiration time
    return Date.now() >= expiresAt;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true; // If there's an error, consider the token expired
  }
};

// Modify fetchUserData to handle token expiration
export const fetchUserData = async () => {
  try {
    const res = await api.get("/me");
    return res.data;
  } catch (error) {
    console.error("Error fetching user data:", error?.response?.data || error);
    return null;
  }
};

// Modify getStoredToken to include expiration check
export const getStoredToken = async () => {
  try {
    const tokenExpired = await isTokenExpired();
    
    if (tokenExpired) {
      // Remove expired token
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('tokenData');
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
    await AsyncStorage.setItem('tokenData', JSON.stringify({ expiresAt }));
    
    return token;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const logout = async () => {
  try {
    // Clear token from storage
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('tokenData');
    
    // Optional: Call backend logout endpoint if needed
    // await axios.post('/auth/logout');
  } catch (error) {
    console.error('Logout error:', error);
  }
};