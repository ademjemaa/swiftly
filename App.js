import React, { useContext } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { AuthContext, AuthProvider } from "./utils/AuthContext";
import LoginScreen from "./screens/LoginScreen";
import ProfileScreen from "./screens/ProfileScreen";
import WebViewScreen from "./screens/WebViewScreen"; // We'll create this for OAuth

const Stack = createStackNavigator();



const AuthStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="WebView" component={WebViewScreen} />
    </Stack.Navigator>
  );
};

const AppNavigator = () => {
  const { state } = useContext(AuthContext);

  if (state.isLoading) {
    // Show loading screen while checking authentication
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00BABC" />
      </View>
    );
  }

  return (
    <Stack.Navigator>
      {state.userToken ? (
        <Stack.Screen 
          name="Profile" 
          component={ProfileScreen} 
          options={{ 
            title: "42 Profile",
            headerStyle: {
              backgroundColor: '#00BABC',
            },
            headerTintColor: '#fff',
          }}
        />
      ) : (
        // User is not signed in
        <Stack.Screen 
          name="Auth" 
          component={AuthStack} 
          options={{ headerShown: false }}
        />
      )}
    </Stack.Navigator>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5'
  }
});