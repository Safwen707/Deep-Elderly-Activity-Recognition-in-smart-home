import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SettingsProvider } from './contexts/SettingsContext';
// Screens
import Welcome from './screens/Welcome';
import Login from './screens/Login';
import Signup from './screens/Signup';
import ForgotPassword from './screens/ForgotPassword';
import Profile from './screens/Profile';
import Settings from './screens/Settings';

const Stack = createNativeStackNavigator();

export default function App() {
    return (
        <SettingsProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
            <NavigationContainer>
                <Stack.Navigator
                    initialRouteName="Welcome"
                    screenOptions={{ headerShown: false }}
                >
                    <Stack.Screen
                        name="Welcome"
                        component={Welcome}
                        options={{ title: 'Welcome' }}
                    />
                    <Stack.Screen
                        name="Login"
                        component={Login}
                        options={{ title: 'Login' }}
                    />
                    <Stack.Screen
                        name="Signup"
                        component={Signup}
                        options={{ title: 'Create Account' }}
                    />
                    <Stack.Screen
                        name="ForgotPassword"
                        component={ForgotPassword}
                        options={{ title: 'Reset Password' }}
                    />
                    <Stack.Screen
                        name="Profile"
                        component={Profile}
                        options={{ title: 'My Profile' }}
                    />
                    <Stack.Screen
                        name="Settings"
                        component={Settings}
                        options={{ title: 'Settings' }}
                    />
                </Stack.Navigator>
            </NavigationContainer>
        </GestureHandlerRootView>
        </SettingsProvider>
    );
}