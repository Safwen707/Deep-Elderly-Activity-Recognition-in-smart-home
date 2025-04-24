import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    ScrollView,
    ImageBackground,
    Image,
    Modal,
    Animated,
    StyleSheet,
    ActivityIndicator,
    Alert,
    PanResponder
} from 'react-native';
import { ArrowLeftIcon, CogIcon, XMarkIcon, PlusIcon, PencilIcon } from 'react-native-heroicons/solid';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { saveProfile, getProfile, updateProfilePhoto } from '../config/profileService';
import * as ImagePicker from 'expo-image-picker';

const Profile = () => {
    const navigation = useNavigation();
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [photoLoading, setPhotoLoading] = useState(false);
    const [profilePhoto, setProfilePhoto] = useState(null);

    const [profile, setProfile] = useState({
        name: '',
        age: '',
        gender: 'Male',
        weight: '',
        height: '',
        emergencyContacts: [{ name: '', phone: '', priority: 'Primary' }],
        photoURL: null
    });

    // Animation refs
    const pan = useRef(new Animated.ValueXY()).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(500)).current;

    // PanResponder for swipe down to close
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderMove: (_, gestureState) => {
                if (gestureState.dy > 0) {
                    pan.setValue({ x: 0, y: gestureState.dy });
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dy > 100) {
                    Animated.timing(pan, {
                        toValue: { x: 0, y: 500 },
                        duration: 300,
                        useNativeDriver: true
                    }).start(() => {
                        setIsEditing(false);
                        pan.setValue({ x: 0, y: 0 });
                    });
                } else {
                    Animated.spring(pan, {
                        toValue: { x: 0, y: 0 },
                        useNativeDriver: true
                    }).start();
                }
            }
        })
    ).current;

    // Load profile data from Firebase
    useEffect(() => {
        const loadProfileData = async () => {
            try {
                setIsLoading(true);
                const profileData = await getProfile();
                if (profileData) {
                    const contacts = profileData.emergencyContacts && profileData.emergencyContacts.length > 0
                        ? profileData.emergencyContacts
                        : [{ name: '', phone: '', priority: 'Primary' }];

                    setProfile({
                        name: profileData.name || '',
                        age: profileData.age || '',
                        gender: profileData.gender || 'Male',
                        weight: profileData.weight || '',
                        height: profileData.height || '',
                        emergencyContacts: contacts,
                        photoURL: profileData.photoURL || null
                    });

                    if (profileData.photoURL) {
                        setProfilePhoto({ uri: profileData.photoURL });
                    }
                }
            } catch (error) {
                console.error('Error loading profile:', error);
                Alert.alert('Error', 'Failed to load profile data');
            } finally {
                setIsLoading(false);
            }
        };

        loadProfileData();
    }, []);

    // Animation handlers
    const animateIn = () => {
        setIsEditing(true);
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 400,
                useNativeDriver: true
            })
        ]).start();
    };

    const animateOut = () => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true
            }),
            Animated.timing(slideAnim, {
                toValue: 500,
                duration: 300,
                useNativeDriver: true
            })
        ]).start(() => setIsEditing(false));
    };

    // Handle form updates
    const handleInputChange = (field, value) => {
        setProfile(prev => ({ ...prev, [field]: value }));
    };

    const handleContactChange = (index, field, value) => {
        const updatedContacts = [...profile.emergencyContacts];
        updatedContacts[index] = {
            ...updatedContacts[index],
            [field]: value
        };
        setProfile(prev => ({ ...prev, emergencyContacts: updatedContacts }));
    };

    const addContact = () => {
        if (profile.emergencyContacts.length >= 5) {
            Alert.alert('Limit Reached', 'You can only add up to 5 emergency contacts');
            return;
        }
        setProfile(prev => ({
            ...prev,
            emergencyContacts: [
                ...prev.emergencyContacts,
                { name: '', phone: '', priority: 'Secondary' }
            ]
        }));
    };

    const removeContact = (index) => {
        if (profile.emergencyContacts.length <= 1) {
            Alert.alert('Cannot Remove', 'You must have at least one emergency contact');
            return;
        }
        const updatedContacts = [...profile.emergencyContacts];
        updatedContacts.splice(index, 1);
        setProfile(prev => ({ ...prev, emergencyContacts: updatedContacts }));
    };

    // Handle profile photo change
    const handleChangePhoto = async () => {
        try {
            // Request permission to access the gallery
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission required', 'Please allow access to your photo library to change your profile picture');
                return;
            }

            // Launch the image picker
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                setPhotoLoading(true);
                const selectedImage = result.assets[0];

                // Update the profile photo in Firebase
                const photoURL = await updateProfilePhoto(selectedImage.uri);

                // Update local state
                setProfilePhoto({ uri: selectedImage.uri });
                setProfile(prev => ({ ...prev, photoURL }));

                Alert.alert('Success', 'Profile photo updated successfully');
            }
        } catch (error) {
            console.error('Error updating profile photo:', error);
            Alert.alert('Error', 'Failed to update profile photo. Please try again.');
        } finally {
            setPhotoLoading(false);
        }
    };

    // Save profile data to Firebase
    const handleSave = async () => {
        try {
            setIsLoading(true);

            if (!profile.name.trim()) {
                Alert.alert('Validation Error', 'Please enter your name');
                return;
            }

            const profileData = {
                name: profile.name.trim(),
                age: profile.age.trim(),
                gender: profile.gender,
                weight: profile.weight.trim(),
                height: profile.height.trim(),
                emergencyContacts: profile.emergencyContacts
                    .filter(contact => contact.name.trim() && contact.phone.trim())
                    .map(contact => ({
                        name: contact.name.trim(),
                        phone: contact.phone.trim(),
                        priority: contact.priority
                    })),
                photoURL: profile.photoURL || null
            };

            if (profileData.emergencyContacts.length === 0) {
                Alert.alert('Validation Error', 'Please add at least one emergency contact');
                return;
            }

            await saveProfile(profileData);
            setProfile(profileData);
            animateOut();
            Alert.alert('Success', 'Profile updated successfully');
        } catch (error) {
            console.error('Error saving profile:', error);
            Alert.alert('Error', 'Failed to save profile. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading && !isEditing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3498db" />
            </View>
        );
    }

    return (
        <ImageBackground
            source={require('../assets/DarkMode.png')}
            style={styles.background}
            blurRadius={isEditing ? 10 : 0}
        >
            <SafeAreaView style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <ArrowLeftIcon size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Profile</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
                        <CogIcon size={24} color="#fff" />
                    </TouchableOpacity>
                </View>

                {/* Profile Content */}
                <ScrollView contentContainerStyle={styles.content}>
                    {/* Profile Picture */}
                    <View style={styles.avatarContainer}>
                        <TouchableOpacity onPress={handleChangePhoto} disabled={photoLoading}>
                            {photoLoading ? (
                                <View style={styles.avatar}>
                                    <ActivityIndicator size="small" color="#3498db" />
                                </View>
                            ) : (
                                <Image
                                    source={profilePhoto ? profilePhoto : require('../assets/Old.jpg')}
                                    style={styles.avatar}
                                />
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.changePhotoButton}
                            onPress={handleChangePhoto}
                            disabled={photoLoading}
                        >
                            <Text style={styles.changePhotoText}>Change Photo</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Profile Info */}
                    <View style={styles.infoCard}>
                        <Text style={styles.infoTitle}>Personal Information</Text>

                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Name:</Text>
                            <Text style={styles.infoValue}>{profile.name || 'Not set'}</Text>
                        </View>

                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Age:</Text>
                            <Text style={styles.infoValue}>{profile.age || 'Not set'}</Text>
                        </View>

                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Gender:</Text>
                            <Text style={styles.infoValue}>{profile.gender}</Text>
                        </View>

                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Weight:</Text>
                            <Text style={styles.infoValue}>{profile.weight ? `${profile.weight} kg` : 'Not set'}</Text>
                        </View>

                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Height:</Text>
                            <Text style={styles.infoValue}>{profile.height ? `${profile.height} cm` : 'Not set'}</Text>
                        </View>
                    </View>

                    {/* Emergency Contacts */}
                    <View style={styles.contactsCard}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Emergency Contacts</Text>
                            <Text style={styles.contactsCount}>
                                {profile.emergencyContacts.filter(c => c.name && c.phone).length}/5
                            </Text>
                        </View>

                        {profile.emergencyContacts
                            .filter(contact => contact.name || contact.phone)
                            .map((contact, index) => (
                                <View key={index} style={styles.contactItem}>
                                    <Text style={styles.contactName}>
                                        {contact.name || `Contact ${index + 1}`}
                                    </Text>
                                    <Text style={styles.contactPhone}>
                                        {contact.phone || 'No phone number'}
                                    </Text>
                                    <Text style={[
                                        styles.contactPriority,
                                        { color: contact.priority === 'Primary' ? '#e74c3c' : '#3498db' }
                                    ]}>
                                        {contact.priority}
                                    </Text>
                                </View>
                            ))}
                    </View>
                </ScrollView>

                {/* Floating Edit Button */}
                <TouchableOpacity
                    style={styles.editFloatingButton}
                    onPress={animateIn}
                >
                    <PencilIcon size={24} color="#fff" />
                </TouchableOpacity>

                {/* Edit Profile Modal */}
                <Modal visible={isEditing} transparent animationType="none">
                    <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
                        <Animated.View
                            style={[
                                styles.modalContent,
                                {
                                    transform: [
                                        { translateY: slideAnim },
                                        { translateY: pan.y }
                                    ]
                                }
                            ]}
                            {...panResponder.panHandlers}
                        >
                            <View style={styles.modalHandle} />
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={animateOut}
                            >
                                <XMarkIcon size={24} color="#fff" />
                            </TouchableOpacity>

                            <ScrollView
                                contentContainerStyle={styles.modalScrollContent}
                                keyboardShouldPersistTaps="handled"
                            >
                                <Text style={styles.modalTitle}>Edit Profile</Text>

                                {/* Personal Info Form */}
                                <View style={styles.formSection}>
                                    <Text style={styles.sectionLabel}>Personal Information</Text>
                                    <TextInput
                                        placeholder="Full Name"
                                        placeholderTextColor="#95A5A6"
                                        value={profile.name}
                                        onChangeText={(text) => handleInputChange('name', text)}
                                        style={styles.input}
                                        returnKeyType="next"
                                    />
                                    <View style={styles.row}>
                                        <TextInput
                                            placeholder="Age"
                                            placeholderTextColor="#95A5A6"
                                            value={profile.age}
                                            onChangeText={(text) => handleInputChange('age', text)}
                                            style={[styles.input, styles.halfInput]}
                                            keyboardType="numeric"
                                            returnKeyType="next"
                                        />
                                        <TextInput
                                            placeholder="Weight (kg)"
                                            placeholderTextColor="#95A5A6"
                                            value={profile.weight}
                                            onChangeText={(text) => handleInputChange('weight', text)}
                                            style={[styles.input, styles.halfInput]}
                                            keyboardType="numeric"
                                            returnKeyType="next"
                                        />
                                    </View>
                                    <View style={styles.row}>
                                        <TextInput
                                            placeholder="Height (cm)"
                                            placeholderTextColor="#95A5A6"
                                            value={profile.height}
                                            onChangeText={(text) => handleInputChange('height', text)}
                                            style={[styles.input, styles.halfInput]}
                                            keyboardType="numeric"
                                            returnKeyType="next"
                                        />
                                        <View style={[styles.input, styles.halfInput, styles.genderContainer]}>
                                            <Text style={styles.genderLabel}>Gender:</Text>
                                            <View style={styles.genderButtons}>
                                                <TouchableOpacity
                                                    style={[
                                                        styles.genderButton,
                                                        profile.gender === 'Male' && styles.activeGenderButton
                                                    ]}
                                                    onPress={() => handleInputChange('gender', 'Male')}
                                                >
                                                    <Text style={[
                                                        styles.genderButtonText,
                                                        profile.gender === 'Male' && styles.activeGenderText
                                                    ]}>
                                                        Male
                                                    </Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    style={[
                                                        styles.genderButton,
                                                        profile.gender === 'Female' && styles.activeGenderButton
                                                    ]}
                                                    onPress={() => handleInputChange('gender', 'Female')}
                                                >
                                                    <Text style={[
                                                        styles.genderButtonText,
                                                        profile.gender === 'Female' && styles.activeGenderText
                                                    ]}>
                                                        Female
                                                    </Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </View>
                                </View>

                                {/* Emergency Contacts Form */}
                                <View style={styles.formSection}>
                                    <View style={styles.sectionHeader}>
                                        <Text style={styles.sectionLabel}>Emergency Contacts</Text>
                                        {profile.emergencyContacts.length < 5 && (
                                            <TouchableOpacity onPress={addContact}>
                                                <PlusIcon size={20} color="#3498db" />
                                            </TouchableOpacity>
                                        )}
                                    </View>

                                    {profile.emergencyContacts.map((contact, index) => (
                                        <View key={index} style={styles.contactFormItem}>
                                            <View style={styles.contactHeader}>
                                                <Text style={styles.contactNumber}>Contact #{index + 1}</Text>
                                                {profile.emergencyContacts.length > 1 && (
                                                    <TouchableOpacity onPress={() => removeContact(index)}>
                                                        <XMarkIcon size={16} color="#e74c3c" />
                                                    </TouchableOpacity>
                                                )}
                                            </View>

                                            <TextInput
                                                placeholder="Full Name"
                                                placeholderTextColor="#95A5A6"
                                                value={contact.name}
                                                onChangeText={(text) => handleContactChange(index, 'name', text)}
                                                style={styles.input}
                                                returnKeyType="next"
                                            />

                                            <TextInput
                                                placeholder="Phone Number"
                                                placeholderTextColor="#95A5A6"
                                                value={contact.phone}
                                                onChangeText={(text) => handleContactChange(index, 'phone', text)}
                                                style={styles.input}
                                                keyboardType="phone-pad"
                                                returnKeyType="next"
                                            />

                                            <View style={styles.priorityContainer}>
                                                <Text style={styles.priorityLabel}>Priority:</Text>
                                                <View style={styles.priorityButtons}>
                                                    <TouchableOpacity
                                                        style={[
                                                            styles.priorityButton,
                                                            contact.priority === 'Primary' && styles.activePriorityButton
                                                        ]}
                                                        onPress={() => handleContactChange(index, 'priority', 'Primary')}
                                                    >
                                                        <Text style={[
                                                            styles.priorityButtonText,
                                                            contact.priority === 'Primary' && styles.activePriorityText
                                                        ]}>
                                                            Primary
                                                        </Text>
                                                    </TouchableOpacity>
                                                    <TouchableOpacity
                                                        style={[
                                                            styles.priorityButton,
                                                            contact.priority === 'Secondary' && styles.activePriorityButton
                                                        ]}
                                                        onPress={() => handleContactChange(index, 'priority', 'Secondary')}
                                                    >
                                                        <Text style={[
                                                            styles.priorityButtonText,
                                                            contact.priority === 'Secondary' && styles.activePriorityText
                                                        ]}>
                                                            Secondary
                                                        </Text>
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        </View>
                                    ))}
                                </View>

                                {/* Save Button */}
                                <TouchableOpacity
                                    style={styles.saveButton}
                                    onPress={handleSave}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <Text style={styles.saveButtonText}>Save Changes</Text>
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    background: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: 'rgba(30, 30, 30, 0.7)',
        borderRadius: 12,
        margin: 16,
        marginBottom: 0,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    content: {
        padding: 16,
        paddingBottom: 32,
    },
    avatarContainer: {
        alignItems: 'center',
        marginVertical: 24,
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 3,
        borderColor: '#3498db',
    },
    changePhotoButton: {
        marginTop: 10,
        padding: 8,
        backgroundColor: 'rgba(52, 152, 219, 0.2)',
        borderRadius: 8,
    },
    changePhotoText: {
        color: '#3498db',
        fontSize: 14,
    },
    editFloatingButton: {
        position: 'absolute',
        bottom: 30,
        right: 30,
        backgroundColor: '#3498db',
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
    },
    infoCard: {
        backgroundColor: 'rgba(40, 40, 40, 0.85)',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    infoTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
        color: '#fff',
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    infoLabel: {
        fontSize: 16,
        color: '#95A5A6',
    },
    infoValue: {
        fontSize: 16,
        fontWeight: '500',
        color: '#fff',
    },
    contactsCard: {
        backgroundColor: 'rgba(40, 40, 40, 0.85)',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    contactsCount: {
        fontSize: 14,
        color: '#95A5A6',
    },
    contactItem: {
        padding: 12,
        marginBottom: 8,
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: 8,
    },
    contactName: {
        fontSize: 16,
        fontWeight: '500',
        color: '#fff',
    },
    contactPhone: {
        fontSize: 14,
        color: '#95A5A6',
        marginVertical: 4,
    },
    contactPriority: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: 'rgba(30, 30, 30, 0.95)',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '85%',
        paddingBottom: 30,
    },
    modalHandle: {
        width: 40,
        height: 5,
        backgroundColor: '#95A5A6',
        borderRadius: 3,
        alignSelf: 'center',
        marginTop: 10,
        marginBottom: 15,
    },
    closeButton: {
        position: 'absolute',
        top: 15,
        right: 15,
        zIndex: 1,
    },
    modalScrollContent: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 40,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 24,
        color: '#fff',
    },
    formSection: {
        marginBottom: 24,
    },
    sectionLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 12,
        color: '#fff',
    },
    input: {
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        color: '#fff',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    halfInput: {
        width: '48%',
    },
    genderContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
    },
    genderLabel: {
        color: '#95A5A6',
        fontSize: 14,
    },
    genderButtons: {
        flexDirection: 'row',
    },
    genderButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#95A5A6',
        marginLeft: 8,
    },
    activeGenderButton: {
        backgroundColor: '#3498db',
        borderColor: '#3498db',
    },
    genderButtonText: {
        fontSize: 14,
        color: '#95A5A6',
    },
    activeGenderText: {
        color: '#fff',
    },
    contactFormItem: {
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
    },
    contactHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    contactNumber: {
        fontSize: 14,
        fontWeight: '500',
        color: '#95A5A6',
    },
    priorityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    priorityLabel: {
        marginRight: 12,
        fontSize: 14,
        color: '#95A5A6',
    },
    priorityButtons: {
        flexDirection: 'row',
    },
    priorityButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#95A5A6',
        marginRight: 8,
    },
    activePriorityButton: {
        backgroundColor: '#3498db',
        borderColor: '#3498db',
    },
    priorityButtonText: {
        fontSize: 14,
        color: '#95A5A6',
    },
    activePriorityText: {
        color: '#fff',
    },
    saveButton: {
        backgroundColor: '#3498db',
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(30, 30, 30, 1)',
    },
});

export default Profile;