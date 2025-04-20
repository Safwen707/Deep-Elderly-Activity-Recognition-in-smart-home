// ../screens/Settings.js
import React, { useEffect, useRef, useContext } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Switch,
    ScrollView,
    ImageBackground,
    Animated,
    Dimensions,
    ActivityIndicator,
    Alert
} from 'react-native';
import {
    ArrowLeftIcon,
    MoonIcon,
    SunIcon,
    BellIcon,
    GlobeAltIcon,
    ShieldCheckIcon
} from 'react-native-heroicons/solid';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SettingsContext } from '../contexts/SettingsContext';
import { auth } from '../config/firebase';
import { useDynamicStyles } from '../hooks/useDynamicStyles';

const { height } = Dimensions.get('window');

const Settings = () => {
    const navigation = useNavigation();
    const { settings, updateSettings, loading, error } = useContext(SettingsContext);
    const { styles, backgroundImage, colors } = useDynamicStyles();

    // Resolve all colors upfront
    const primaryColor = colors.primary;
    const textColor = colors.text;
    const iconColor = colors.iconColor;
    const inputBackgroundColor = colors.inputBackground;
    const borderColor = colors.border;
    const secondaryTextColor = colors.secondaryText;
    const dangerColor = colors.danger;
    const cardBackgroundColor = colors.cardBackground;
    const panelBackgroundColor = colors.panel;

    // Animation refs
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideUpAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
            Animated.timing(slideUpAnim, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
            })
        ]).start();
    }, []);

    const handleSettingChange = async (key, value) => {
        const newSettings = { ...settings, [key]: value };
        await updateSettings(newSettings);
    };

    const toggleDarkMode = () => handleSettingChange('darkMode', !settings.darkMode);
    const toggleNotifications = () => handleSettingChange('notificationsEnabled', !settings.notificationsEnabled);
    const toggleEmergencyAlerts = () => handleSettingChange('emergencyAlertsEnabled', !settings.emergencyAlertsEnabled);

    const changeLanguage = () => {
        const newLanguage = settings.language === 'english' ? 'french' : 'english';
        handleSettingChange('language', newLanguage);
    };

    const handleLogout = async () => {
        try {
            await auth.signOut();
            navigation.navigate('Login');
        } catch (error) {
            console.error('Logout error:', error);
            Alert.alert('Error', 'Failed to logout. Please try again.');
        }
    };

    const getLanguageDisplayName = () => {
        return settings.language === 'english' ? 'English' : 'Français';
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={primaryColor} />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={{ color: dangerColor }}>{error}</Text>
            </View>
        );
    }

    return (
        <ImageBackground
            source={backgroundImage}
            style={styles.background}
            resizeMode="cover"
            blurRadius={settings.darkMode ? 10 : 0}
        >
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={[styles.backButton, { backgroundColor: cardBackgroundColor }]}
                    >
                        <ArrowLeftIcon size={24} color={textColor} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: textColor }]}>Settings</Text>
                    <View style={{ width: 24 }} />
                </View>

                <Animated.View
                    style={[
                        styles.formContainer,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideUpAnim }],
                            backgroundColor: panelBackgroundColor
                        }
                    ]}
                >
                    <ScrollView
                        style={styles.formScroll}
                        contentContainerStyle={styles.formContent}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Appearance Section */}
                        <Text style={[styles.sectionTitle, { color: textColor }]}>Appearance</Text>
                        <View style={styles.settingItem}>
                            <View style={styles.settingIcon}>
                                {settings.darkMode ? (
                                    <SunIcon size={24} color={iconColor} />
                                ) : (
                                    <MoonIcon size={24} color={iconColor} />
                                )}
                                <Text style={[styles.settingText, { color: textColor }]}>Dark Mode</Text>
                            </View>
                            <Switch
                                value={settings.darkMode}
                                onValueChange={toggleDarkMode}
                                thumbColor={settings.darkMode ? primaryColor : inputBackgroundColor}
                                trackColor={{ false: borderColor, true: primaryColor + '80' }}
                            />
                        </View>

                        {/* Notifications Section */}
                        <Text style={[styles.sectionTitle, { color: textColor }]}>Notifications</Text>
                        <View style={styles.settingItem}>
                            <View style={styles.settingIcon}>
                                <BellIcon size={24} color={iconColor} />
                                <Text style={[styles.settingText, { color: textColor }]}>Enable Notifications</Text>
                            </View>
                            <Switch
                                value={settings.notificationsEnabled}
                                onValueChange={toggleNotifications}
                                thumbColor={settings.notificationsEnabled ? primaryColor : inputBackgroundColor}
                                trackColor={{ false: borderColor, true: primaryColor + '80' }}
                            />
                        </View>

                        <View style={styles.settingItem}>
                            <View style={styles.settingIcon}>
                                <ShieldCheckIcon size={24} color={iconColor} />
                                <Text style={[styles.settingText, { color: textColor }]}>Emergency Alerts</Text>
                            </View>
                            <Switch
                                value={settings.emergencyAlertsEnabled}
                                onValueChange={toggleEmergencyAlerts}
                                thumbColor={settings.emergencyAlertsEnabled ? primaryColor : inputBackgroundColor}
                                trackColor={{ false: borderColor, true: primaryColor + '80' }}
                            />
                        </View>

                        {/* Language Section */}
                        <Text style={[styles.sectionTitle, { color: textColor }]}>Language</Text>
                        <TouchableOpacity
                            style={styles.settingItem}
                            onPress={changeLanguage}
                        >
                            <View style={styles.settingIcon}>
                                <GlobeAltIcon size={24} color={iconColor} />
                                <Text style={[styles.settingText, { color: textColor }]}>App Language</Text>
                            </View>
                            <View style={styles.languageValue}>
                                <Text style={[styles.languageText, { color: textColor }]}>{getLanguageDisplayName()}</Text>
                                <Text style={[styles.languageArrow, { color: textColor }]}>›</Text>
                            </View>
                        </TouchableOpacity>

                        {/* Account Section */}
                        <Text style={[styles.sectionTitle, { color: textColor }]}>Account</Text>
                        <TouchableOpacity style={styles.settingItem}>
                            <Text style={[styles.settingText, { color: textColor }]}>Change Password</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.settingItem}>
                            <Text style={[styles.settingText, { color: textColor }]}>Privacy Policy</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.settingItem}>
                            <Text style={[styles.settingText, { color: textColor }]}>Terms of Service</Text>
                        </TouchableOpacity>

                        {/* Logout Button */}
                        <TouchableOpacity
                            style={[styles.logoutButton, { backgroundColor: cardBackgroundColor }]}
                            onPress={handleLogout}
                        >
                            <Text style={[styles.logoutText, { color: dangerColor }]}>Log Out</Text>
                        </TouchableOpacity>

                        <Text style={[styles.versionText, { color: secondaryTextColor }]}>
                            Version 1.0.0
                        </Text>
                    </ScrollView>
                </Animated.View>
            </SafeAreaView>
        </ImageBackground>
    );
};

export default Settings;