import React, { createContext, useReducer, useEffect } from 'react';
import { getStoredToken, fetchUserData, logout, isTokenExpired, refreshAccessToken } from './auth';
import api from './api';

// Initial state
const initialState = {
  isLoading: true,
  isSignout: false,
  userToken: null,
  user: null,
};

// Reducer function
const authReducer = (state, action) => {
  switch (action.type) {
    case 'RESTORE_TOKEN':
      return {
        ...state,
        userToken: action.token,
        user: action.user,
        isLoading: false,
      };
    case 'SIGN_IN':
      return {
        ...state,
        isSignout: false,
        userToken: action.token,
        user: action.user,
      };
    case 'SIGN_OUT':
      return {
        ...state,
        isSignout: true,
        userToken: null,
        user: null,
        isLoading: false,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.user,
      };
    default:
      return state;
  }
};

// Create context
export const AuthContext = createContext(initialState);

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check if user is logged in when app loads
  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        console.log("Starting bootstrap process...");
        const userToken = await getStoredToken();
        console.log("Got token:", userToken ? "Token exists" : "No token");
        
        if (!userToken) {
          const tokenExpired = await isTokenExpired();
          if (tokenExpired) {
            console.log("Token expired, attempting to refresh...");
            const newToken = await refreshAccessToken();
            if (newToken) {
              const userData = await fetchUserData();
              if (userData) {
                dispatch({ type: 'RESTORE_TOKEN', token: newToken, user: userData });
                return;
              }
            }
          }
          console.log("No valid token found, signing out");
          await logout();
          dispatch({ type: 'SIGN_OUT' });
          return;
        }

        const userData = await fetchUserData();
        console.log("User data fetched:", userData ? "Success" : "Failed");
        
        if (userData) {
          dispatch({ type: 'RESTORE_TOKEN', token: userToken, user: userData });
        } else {
          await logout();
          dispatch({ type: 'SIGN_OUT' });
        }
      } catch (e) {
        console.log('Failed to restore authentication state:', e);
        dispatch({ type: 'SIGN_OUT' });
      }
    };

    bootstrapAsync();
  }, []);

  // Auth context value with actions
  const authContext = {
    state,
    signIn: async (token) => {
      try {
        const userData = await fetchUserData();
        if (userData) {
          dispatch({ type: 'SIGN_IN', token, user: userData });
          return true;
        }
        return false;
      } catch (e) {
        console.log('Sign in error:', e);
        return false;
      }
    },
    signOut: async () => {
      try {
        await logout();
        dispatch({ type: 'SIGN_OUT' });
      } catch (e) {
        console.log('Sign out error:', e);
      }
    },
    updateUser: async () => {
      try {
        const userData = await fetchUserData();
        if (userData) {
          dispatch({ type: 'UPDATE_USER', user: userData });
        }
      } catch (e) {
        console.log('Update user error:', e);
      }
    }
  };

  return (
    <AuthContext.Provider value={authContext}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;