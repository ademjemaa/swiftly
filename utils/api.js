import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { navigationRef } from './navigationRef';

const TOKEN_URL = "https://api.intra.42.fr/oauth/token";
const CLIENT_ID = "u-s4t2ud-eada5197242c69a9cbe15329b4aec863700f7f919b7c0694a4e1b1afc6ec8c41";
const SECRET = "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";

const api = axios.create({
  baseURL: "https://api.intra.42.fr/v2",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Helper function to check if token is expired
const isTokenExpired = async () => {
  try {
    const expiresAt = await AsyncStorage.getItem('expiresAt');
    
    if (!expiresAt) {
      return true;
    }

    const expirationTime = parseInt(expiresAt);
    return Date.now() >= expirationTime;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true;
  }
};

// Helper function to check if secret is expired
const isSecretExpired = async () => {
  try {
    const secretValidUntil = await AsyncStorage.getItem('secretValidUntil');
    
    if (!secretValidUntil) {
      return false;
    }

    const secretExpirationTime = parseInt(secretValidUntil);
    return Date.now() >= (secretExpirationTime * 1000);
  } catch (error) {
    console.error('Error checking secret expiration:', error);
    return false;
  }
};

// Function to refresh token
const refreshToken = async () => {
  try {
    const refreshToken = await AsyncStorage.getItem('refreshToken');
    if (!refreshToken) {
      return null;
    }
    console.log("refreshToken", refreshToken);
    const { data } = await axios.post(TOKEN_URL, {
      grant_type: "refresh_token",
      client_id: CLIENT_ID,
      client_secret: SECRET,
      refresh_token: refreshToken,
    });
    console.log("refreshToken data", data);
    
    const { access_token, refresh_token, expires_in, secret_valid_until } = data;
    const expiresAt = Date.now() + (expires_in * 1000);

    await AsyncStorage.setItem("userToken", access_token);
    await AsyncStorage.setItem("refreshToken", refresh_token);
    await AsyncStorage.setItem("expiresAt", expiresAt.toString());
    await AsyncStorage.setItem("secretValidUntil", secret_valid_until.toString());

    return access_token;
  } catch (error) {
    console.error("Error refreshing token:", error?.response?.data || error);
    return null;
  }
};

// Function to clear auth data on logout
const clearAuthData = async () => {
  await AsyncStorage.removeItem('userToken');
  await AsyncStorage.removeItem('refreshToken');
  await AsyncStorage.removeItem('expiresAt');
  await AsyncStorage.removeItem('secretValidUntil');
};

// Request interceptor
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("userToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const secretExpired = await isSecretExpired();
        if (secretExpired) {
          if (navigationRef.current && navigationRef.current.isReady()) {
            navigationRef.current.navigate('SecretExpired');
          }
          return Promise.reject(error);
        }

        const newToken = await refreshToken();
        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        } else {
          await clearAuthData();
          if (navigationRef.current && navigationRef.current.isReady()) {
            navigationRef.current.navigate('Login');
          }
        }
      } catch (refreshError) {
        await clearAuthData();
        if (navigationRef.current && navigationRef.current.isReady()) {
          navigationRef.current.navigate('Login');
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
