import React, { useState, useEffect, useRef, useContext } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    Pressable,
    ScrollView,
    ImageBackground,
    Image,
    Modal,
    Animated,
    Easing,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { ArrowLeftIcon, CogIcon, XMarkIcon, PlusIcon } from 'react-native-heroicons/solid';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SettingsContext } from '../contexts/SettingsContext';
import { useDynamicStyles } from '../hooks/useDynamicStyles';
import { saveProfile, getProfile, onProfileUpdate } from '../config/profileService';

const Profile = () => {
    const navigation = useNavigation();
    const { settings } = useContext(SettingsContext);
    const { styles, backgroundImage } = useDynamicStyles();
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(300)).current;

    const [formData, setFormData] = useState({
        name: '',
        age: '',
        gender: 'Male',
        weight: '',
        height: '',
        emergencyContacts: [{ name: '', phone: '', priority: 'Primary' }],

    });

    const animateForm = () => {
        setIsFormVisible(true);
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 400,
                easing: Easing.out(Easing.back(1.5)),
                useNativeDriver: true,
            }),
        ]).start();
    };

    const closeForm = () => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 300,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start(() => setIsFormVisible(false));
    };

    useEffect(() => {
        const loadData = async () => {
            try {
                const profileData = await getProfile();
                if (profileData) {
                    setFormData(profileData);
                }
            } catch (error) {
                Alert.alert('Error', 'Failed to load profile');
            }
        };
        const unsubscribe = onProfileUpdate((profileData) => {
            setFormData(profileData);
        });

        loadData();

        return () => unsubscribe();
    }, []);


    const updateContact = (index, field, value) => {
        const updatedContacts = [...formData.emergencyContacts];
        updatedContacts[index][field] = value;
        setFormData({ ...formData, emergencyContacts: updatedContacts });
    };

    const addContact = () => {
        if (formData.emergencyContacts.length >= 5) return;
        setFormData({
            ...formData,
            emergencyContacts: [
                ...formData.emergencyContacts,
                { name: '', phone: '', priority: 'Secondary' },
            ],
        });
    };

    const removeContact = (index) => {
        if (formData.emergencyContacts.length <= 1) return;
        const updatedContacts = [...formData.emergencyContacts];
        updatedContacts.splice(index, 1);
        setFormData({ ...formData, emergencyContacts: updatedContacts });
    };

    const handleSave = async () => {
        try {
            setIsLoading(true);
            await saveProfile(formData);
            closeForm();
            Alert.alert('Success', 'Profile saved successfully!');
        } catch (error) {
            Alert.alert('Error', 'Failed to save profile');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ImageBackground
            source={backgroundImage}
            style={styles.background}
            blurRadius={isFormVisible ? 15 : 0}
        >
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <ArrowLeftIcon size={24} color={styles.headerIcon.color} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
                        <CogIcon size={24} color={styles.headerIcon.color} />
                    </TouchableOpacity>
                </View>

                <Pressable style={styles.photoButton} onPress={animateForm}>
                    <Image
                        source={require('../assets/Old.jpg')}
                        style={styles.profilePhoto}
                    />
                    <Text style={styles.editText}>Edit Profile</Text>
                </Pressable>

                <View style={styles.contactsCounter}>
                    <Text style={styles.counterText}>
                        Emergency Contacts: {formData.emergencyContacts.length}/5
                    </Text>
                </View>

                <Modal visible={isFormVisible} transparent animationType="none">
                    <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
                        <Animated.View
                            style={[
                                styles.modalContent,
                                { transform: [{ translateY: slideAnim }] },
                            ]}
                        >
                            <TouchableOpacity style={styles.closeButton} onPress={closeForm}>
                                <XMarkIcon size={24} color={styles.closeIcon.color} />
                            </TouchableOpacity>

                            <ScrollView style={styles.formScroll} contentContainerStyle={styles.formContent}>
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>Personal Information</Text>
                                    <TextInput
                                        placeholder="Full Name"
                                        placeholderTextColor={styles.placeholder.color}
                                        value={formData.name}
                                        onChangeText={(text) => setFormData({ ...formData, name: text })}
                                        style={styles.input}
                                    />
                                    <View style={styles.row}>
                                        <TextInput
                                            placeholder="Age"
                                            placeholderTextColor={styles.placeholder.color}
                                            value={formData.age}
                                            onChangeText={(text) => setFormData({ ...formData, age: text })}
                                            style={styles.halfInput}
                                            keyboardType="numeric"
                                        />
                                        <TextInput
                                            placeholder="Weight (kg)"
                                            placeholderTextColor={styles.placeholder.color}
                                            value={formData.weight}
                                            onChangeText={(text) => setFormData({ ...formData, weight: text })}
                                            style={styles.halfInput}
                                            keyboardType="numeric"
                                        />
                                    </View>
                                </View>

                                <View style={styles.section}>
                                    <View style={styles.sectionHeader}>
                                        <Text style={styles.sectionTitle}>Emergency Contacts</Text>
                                        {formData.emergencyContacts.length < 5 && (
                                            <TouchableOpacity onPress={addContact}>
                                                <PlusIcon size={20} color={styles.addIcon.color} />
                                            </TouchableOpacity>
                                        )}
                                    </View>

                                    {formData.emergencyContacts.map((contact, index) => (
                                        <View key={index} style={styles.contactContainer}>
                                            <View style={styles.contactHeader}>
                                                <Text style={styles.contactNumber}>
                                                    Contact #{index + 1}
                                                </Text>
                                                {formData.emergencyContacts.length > 1 && (
                                                    <TouchableOpacity onPress={() => removeContact(index)}>
                                                        <XMarkIcon size={16} color={styles.removeIcon.color} />
                                                    </TouchableOpacity>
                                                )}
                                            </View>
                                            <TextInput
                                                placeholder="Name"
                                                placeholderTextColor={styles.placeholder.color}
                                                value={contact.name}
                                                onChangeText={(text) => updateContact(index, 'name', text)}
                                                style={styles.input}
                                            />
                                            <TextInput
                                                placeholder="Phone Number"
                                                placeholderTextColor={styles.placeholder.color}
                                                value={contact.phone}
                                                onChangeText={(text) => updateContact(index, 'phone', text)}
                                                style={styles.input}
                                                keyboardType="phone-pad"
                                            />
                                            <View style={styles.priorityContainer}>
                                                <Text style={styles.priorityLabel}>Priority:</Text>
                                                <View style={styles.priorityButtons}>
                                                    <TouchableOpacity
                                                        style={[
                                                            styles.priorityButton,
                                                            contact.priority === 'Primary' && styles.activePriority,
                                                        ]}
                                                        onPress={() => updateContact(index, 'priority', 'Primary')}
                                                    >
                                                        <Text style={[
                                                            styles.priorityText,
                                                            contact.priority === 'Primary' && styles.activePriorityText,
                                                        ]}>
                                                            Primary
                                                        </Text>
                                                    </TouchableOpacity>
                                                    <TouchableOpacity
                                                        style={[
                                                            styles.priorityButton,
                                                            contact.priority === 'Secondary' && styles.activePriority,
                                                        ]}
                                                        onPress={() => updateContact(index, 'priority', 'Secondary')}
                                                    >
                                                        <Text style={[
                                                            styles.priorityText,
                                                            contact.priority === 'Secondary' && styles.activePriorityText,
                                                        ]}>
                                                            Secondary
                                                        </Text>
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        </View>
                                    ))}
                                </View>

                                <TouchableOpacity
                                    style={styles.saveButton}
                                    onPress={handleSave}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator color="white" />
                                    ) : (
                                        <Text style={styles.saveButtonText}>Save Profile</Text>
                                    )}
                                </TouchableOpacity>
                            </ScrollView>
                        </Animated.View>
                    </Animated.View>
                </Modal>
            </SafeAreaView>
        </ImageBackground>
    );
};

export default Profile;