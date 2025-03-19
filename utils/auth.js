import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { makeRedirectUri } from "expo-auth-session";
import api from "./api"; 

// OAuth Credentials
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

export const getStoredToken = async () => {
  return await AsyncStorage.getItem("token");
};

export const fetchUserData = async () => {
  try {
    const res = await api.get("/me");
    return res.data;
  } catch (error) {
    console.error("Error fetching user data:", error?.response?.data || error);
    return null;
  }
};

export const logout = async () => {
  try {
    await AsyncStorage.removeItem("token");
    console.log("Token removed.");
    return true;
  } catch (error) {
    console.error("Error during logout:", error);
    return false;
  }
};