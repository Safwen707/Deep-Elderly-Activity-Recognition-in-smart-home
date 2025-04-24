import { useContext } from 'react';
import { StyleSheet } from 'react-native';
import { SettingsContext } from '../contexts/SettingsContext';

export const useDynamicStyles = () => {
    const { settings } = useContext(SettingsContext);

    const isDarkMode = settings?.darkMode || false;

    const colors = {

        headerIcon: isDarkMode ? '#ffffff' : '#000000',
        panel: isDarkMode ? '#1e1e1e' : '#ffffff',
        panelHandle: isDarkMode ? '#444' : '#ddd',
        iconColor: isDarkMode ? '#4A90E2' : '#4A90E2',
        background: isDarkMode ? '#121212' : '#ffffff',
        text: isDarkMode ? '#ffffff' : '#000000',
        secondaryText: isDarkMode ? '#aaaaaa' : '#666666',
        primary: '#4A90E2', // This is the color being accessed
        inputBackground: isDarkMode ? '#333333' : '#f5f5f5',
        cardBackground: isDarkMode ? '#1e1e1e' : '#f9f9f9',
        border: isDarkMode ? '#444444' : '#dddddd',
        danger: '#ff4444',
        placeholder: isDarkMode ? '#666666' : '#999999',
        tabBar: isDarkMode ? '#1e1e1e' : '#ffffff',
        tabBarActive: '#4A90E2',
        tabBarInactive: isDarkMode ? '#888' : '#ccc',
        success: '#4CAF50',
        warning: '#FFC107',
        info: '#2196F3',
    };

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
            padding: 16,
        },
        card: {
            backgroundColor: colors.cardBackground,
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isDarkMode ? 0.3 : 0.1,
            shadowRadius: 4,
            elevation: 3,
        },
        button: {
            backgroundColor: colors.primary,
            borderRadius: 8,
            padding: 14,
            alignItems: 'center',
            justifyContent: 'center',
        },
        buttonText: {
            color: 'white',
            fontWeight: 'bold',
            fontSize: 16,
        },
        textInput: {
            backgroundColor: colors.inputBackground,
            borderRadius: 8,
            padding: 12,
            color: colors.text,
            fontSize: 16,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: colors.border,
        },

        background: {
            flex: 1,
            backgroundColor: colors.background,
        },
        safeArea: {
            flex: 1,
        },
        header: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            padding: 16,

        },
        headerIcon: {
            color: colors.text,
        },
        photoButton: {
            alignItems: 'center',
            marginTop: 40,
        },
        profilePhoto: {
            width: 150,
            height: 150,
            borderRadius: 75,
            borderWidth: 3,
            borderColor: colors.primary,
        },
        editText: {
            marginTop: 10,
            color: colors.text,
            fontSize: 16,
            fontWeight: '500',
        },
        contactsCounter: {
            backgroundColor: isDarkMode ? '#1e1e1e' : 'rgba(0,0,0,0.1)',
            padding: 10,
            borderRadius: 20,
            alignSelf: 'center',
            marginTop: 20,
        },
        counterText: {
            color: colors.text,
            fontWeight: 'bold',
        },
        modalOverlay: {
            flex: 1,
            backgroundColor: isDarkMode ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.5)',
            justifyContent: 'flex-end',
        },
        modalContent: {
            backgroundColor: colors.background,
            borderTopLeftRadius: 30,
            borderTopRightRadius: 30,
            padding: 25,
            maxHeight: '85%',
        },
        closeButton: {
            alignSelf: 'flex-end',
            padding: 5,
        },
        closeIcon: {
            color: colors.secondaryText,
        },
        formScroll: {
            marginTop: 10,
        },
        formContent: {
            paddingBottom: 20,
        },
        section: {
            marginBottom: 25,
        },
        sectionHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 15,
        },
        sectionTitle: {
            fontSize: 18,
            fontWeight: 'bold',
            color: colors.text,
        },
        input: {
            backgroundColor: colors.inputBackground,
            borderRadius: 12,
            padding: 15,
            marginBottom: 15,
            fontSize: 16,
            color: colors.text,
        },
        halfInput: {
            flex: 1,
            marginHorizontal: 5,
            backgroundColor: colors.inputBackground,
            borderRadius: 12,
            padding: 15,
            fontSize: 16,
            color: colors.text,
        },
        row: {
            flexDirection: 'row',
            justifyContent: 'space-between',
        },
        contactContainer: {
            backgroundColor: colors.cardBackground,
            borderRadius: 12,
            padding: 15,
            marginBottom: 15,
        },
        contactHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 10,
        },
        contactNumber: {
            fontWeight: 'bold',
            color: colors.text,
        },
        priorityContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 10,
        },
        priorityLabel: {
            marginRight: 10,
            color: colors.text,
        },
        priorityButtons: {
            flexDirection: 'row',
        },
        priorityButton: {
            paddingVertical: 6,
            paddingHorizontal: 12,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: colors.border,
            marginRight: 10,
        },
        activePriority: {
            backgroundColor: colors.primary,
            borderColor: colors.primary,
        },
        priorityText: {
            color: colors.text,
        },
        activePriorityText: {
            color: 'white',
        },
        saveButton: {
            backgroundColor: colors.primary,
            borderRadius: 12,
            padding: 16,
            alignItems: 'center',
            marginTop: 20,
        },
        saveButtonText: {
            color: 'white',
            fontWeight: 'bold',
            fontSize: 16,
        },
        placeholder: {
            color: colors.placeholder,
        },
        addIcon: {
            color: colors.primary,
        },
        removeIcon: {
            color: colors.danger,
        },
    });

    const backgroundImage = isDarkMode
        ? require('../assets/DarkMode.png')
        : require('../assets/Oldman.png');

    return { styles, backgroundImage,colors };
};