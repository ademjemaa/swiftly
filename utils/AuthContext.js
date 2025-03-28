import React, { createContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchUserData, getStoredToken, logout as authLogout, isTokenExpired } from './auth';

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
        // Get token from storage
        const userToken = await getStoredToken();
        
        // Check if token is expired
        const tokenExpired = await isTokenExpired();
        
        if (userToken && !tokenExpired) {
          // If we have a valid token, fetch user data
          const userData = await fetchUserData();
          
          if (userData) {
            // If we successfully got user data, restore session
            dispatch({ type: 'RESTORE_TOKEN', token: userToken, user: userData });
          } else {
            // If we couldn't get user data, sign out
            await authLogout();
            dispatch({ type: 'SIGN_OUT' });
          }
        } else {
          // No token or token is expired
          await authLogout();
          dispatch({ type: 'SIGN_OUT' });
        }
      } catch (e) {
        console.log('Failed to restore authentication state:', e);
        dispatch({ type: 'RESTORE_TOKEN', token: null, user: null });
      } finally {
        // Ensure loading state is set to false
        dispatch({ type: 'RESTORE_TOKEN', token: null, user: null });
      }
    };

    bootstrapAsync();
  }, []);

  // Auth context value with actions
  const authContext = {
    state,
    signIn: async (token) => {
      try {
        // Store token happens in auth.js getToken function
        // Fetch user data with the new token
        const userData = await fetchUserData();
        
        if (userData) {
          dispatch({ type: 'SIGN_IN', token, user: userData });
          return true;
        } else {
          console.log('Failed to get user data after sign in');
          return false;
        }
      } catch (e) {
        console.log('Sign in error:', e);
        return false;
      }
    },
    signOut: async () => {
      try {
        // Call logout function from auth.js
        await authLogout();
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