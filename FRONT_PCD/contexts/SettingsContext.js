// ../contexts/SettingsContext.js
import React, { createContext, useState, useEffect } from 'react';
import { auth } from '../config/firebase';
import { getSettings, onSettingsUpdate, saveSettings } from '../config/settingsService';

export const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
    const [settings, setSettings] = useState({
        darkMode: false,
        notificationsEnabled: true,
        emergencyAlertsEnabled: false,
        language: 'english',
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!auth.currentUser) {
            setLoading(false);
            return;
        }

        const loadInitialSettings = async () => {
            try {
                const savedSettings = await getSettings();
                if (savedSettings) {
                    setSettings(savedSettings);
                }
            } catch (error) {
                console.error("Error loading settings:", error);
                setError("Failed to load settings. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        loadInitialSettings();

        const unsubscribe = onSettingsUpdate((newSettings) => {
            setSettings(prev => ({ ...prev, ...newSettings }));
        });

        return () => unsubscribe();
    }, []);

    const updateSettings = async (newSettings) => {
        try {
            setSettings(prev => ({ ...prev, ...newSettings }));
            if (auth.currentUser) {
                await saveSettings({ ...settings, ...newSettings });
            }
        } catch (error) {
            console.error("Error saving settings:", error);
            setError("Failed to save settings. Please try again.");
            // Revert to previous settings on error
            setSettings(prev => prev);
        }
    };

    return (
        <SettingsContext.Provider value={{ settings, updateSettings, loading, error }}>
            {children}
        </SettingsContext.Provider>
    );
};