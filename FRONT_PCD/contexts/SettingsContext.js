import React, { createContext, useState, useEffect, useCallback } from 'react';
import { auth } from '../config/firebase';
import { getSettings, onSettingsUpdate, saveSettings } from '../config/settingsService';
import { useNetInfo } from '@react-native-community/netinfo';

// Define default settings structure
const DEFAULT_SETTINGS = {
    darkMode: false,
    notificationsEnabled: true,
    emergencyAlertsEnabled: true,
    language: 'english',
};

// Create context with default values
export const SettingsContext = createContext({
    settings: DEFAULT_SETTINGS,
    updateSettings: () => {},
    loading: true,
    error: null,
    isOnline: true,
});

export const SettingsProvider = ({ children }) => {
    const [settings, setSettings] = useState(DEFAULT_SETTINGS);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pendingUpdates, setPendingUpdates] = useState([]);
    const netInfo = useNetInfo();
    const isOnline = netInfo.isConnected;

    // Load settings when user changes or comes online
    const loadSettings = useCallback(async () => {
        if (!auth.currentUser || !isOnline) return;

        setLoading(true);
        try {
            const savedSettings = await getSettings();
            setSettings(savedSettings || DEFAULT_SETTINGS);
            setError(null);
        } catch (err) {
            console.error("Settings load error:", err);
            setError("Failed to load settings. Using defaults.");
            setSettings(DEFAULT_SETTINGS);
        } finally {
            setLoading(false);
        }
    }, [isOnline]);

    // Handle real-time updates
    useEffect(() => {
        if (!auth.currentUser) return;

        const unsubscribe = onSettingsUpdate((newSettings) => {
            setSettings(prev => ({ ...prev, ...newSettings }));
        });

        return () => unsubscribe();
    }, []);

    // Process pending updates when coming online
    useEffect(() => {
        if (isOnline && pendingUpdates.length > 0) {
            processPendingUpdates();
        }
    }, [isOnline]);

    // Initial load
    useEffect(() => {
        loadSettings();
    }, [loadSettings]);

    // Save settings to backend
    const saveSettingsToServer = useCallback(async (newSettings) => {
        if (!auth.currentUser) return;

        try {
            await saveSettings(newSettings);
            setError(null);
        } catch (err) {
            console.error("Settings save error:", err);
            throw err;
        }
    }, []);

    // Process queued updates
    const processPendingUpdates = async () => {
        if (pendingUpdates.length === 0) return;

        try {
            const lastUpdate = pendingUpdates[pendingUpdates.length - 1];
            await saveSettingsToServer(lastUpdate);
            setPendingUpdates([]);
        } catch (err) {
            setError("Failed to sync settings. Will retry later.");
        }
    };

    // Main update function
    const updateSettings = useCallback(async (newSettings) => {
        // Optimistic UI update
        setSettings(prev => ({ ...prev, ...newSettings }));

        try {
            if (isOnline) {
                await saveSettingsToServer(newSettings);
            } else {
                // Queue updates when offline
                setPendingUpdates(prev => [...prev, newSettings]);
                setError("Settings saved locally. Will sync when online.");
            }
        } catch (err) {
            console.error("Settings update error:", err);
            // Revert on error
            setSettings(prev => prev);
            setError("Failed to save settings. Please try again.");
            throw err;
        }
    }, [isOnline, saveSettingsToServer]);

    // Public API
    const contextValue = {
        settings,
        updateSettings,
        loading,
        error,
        isOnline,
        hasPendingUpdates: pendingUpdates.length > 0,
    };

    return (
        <SettingsContext.Provider value={contextValue}>
            {children}
        </SettingsContext.Provider>
    );
}; 