import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    StyleSheet,
    ScrollView,
    ImageBackground,
    Animated,
    Dimensions,
    PanResponder
} from 'react-native';
import React, { useState } from 'react';
import { ArrowLeftIcon } from 'react-native-heroicons/solid';
import { useNavigation } from '@react-navigation/native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';
import { SafeAreaView } from 'react-native-safe-area-context';

const { height } = Dimensions.get('window');

const Signup = () => {
    const navigation = useNavigation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [formHeight] = useState(new Animated.Value(height * 0.75));
    const [error, setError] = useState('');

    const panResponder = PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderMove: (_, gestureState) => {
            const newHeight = height * 0.65 - gestureState.dy;
            const minHeight = height * 0.4;
            const maxHeight = height * 0.9;

            if (newHeight >= minHeight && newHeight <= maxHeight) {
                formHeight.setValue(newHeight);
            }
        },
    });

    const handleSubmit = async () => {
        if (!email || !password || !passwordConfirm) {
            setError('Please fill all fields');
            return;
        }

        if (password !== passwordConfirm) {
            setError('Passwords do not match');
            return;
        }

        try {
            await createUserWithEmailAndPassword(auth, email, password);
        } catch (err) {
            setError(err.message);
            console.log('Error:', err.message);
        }
    };

    return (
        <ImageBackground
            source={require('../assets/Oldman.png')}
            style={styles.background}
            resizeMode="cover"
        >
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={styles.backButton}
                    >
                        <ArrowLeftIcon size={20} color="white" />
                    </TouchableOpacity>
                </View>

                <Animated.View
                    style={[
                        styles.formContainer,
                        { height: formHeight }
                    ]}
                    {...panResponder.panHandlers}
                >
                    <View style={styles.dragHandle}>
                        <View style={styles.handleBar} />
                    </View>

                    <ScrollView
                        style={styles.formScroll}
                        contentContainerStyle={styles.formContent}
                    >
                        <Text style={styles.title}>Create Account</Text>

                        {error && <Text style={styles.errorText}>{error}</Text>}

                        <TextInput
                            style={styles.input}
                            placeholder="Email"
                            placeholderTextColor="#999"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Password"
                            placeholderTextColor="#999"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Confirm Password"
                            placeholderTextColor="#999"
                            value={passwordConfirm}
                            onChangeText={setPasswordConfirm}
                            secureTextEntry
                        />

                        <TouchableOpacity
                            style={styles.button}
                            onPress={handleSubmit}
                        >
                            <Text style={styles.buttonText}>Sign Up</Text>
                        </TouchableOpacity>

                        <View style={styles.loginContainer}>
                            <Text style={styles.loginText}>Already have an account?</Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                                <Text style={styles.loginLink}> Login</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </Animated.View>
            </SafeAreaView>
        </ImageBackground>
    );
};

const styles = StyleSheet.create({
    background: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        padding: 16,
    },
    backButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,1,0.3)',
    },
    formContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingTop: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 10,
    },
    dragHandle: {
        width: '100%',
        alignItems: 'center',
        paddingVertical: 8,
    },
    handleBar: {
        width: 50,
        height: 5,
        backgroundColor: '#ccc',
        borderRadius: 3,
    },
    formScroll: {
        flex: 1,
    },
    formContent: {
        paddingHorizontal: 30,
        paddingBottom: 40,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#333',
        textAlign: 'center',
    },
    input: {
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        padding: 16,
        marginBottom: 15,
        fontSize: 16,
    },
    button: {
        backgroundColor: '#4A90E2',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 10,
    },
    buttonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
    },
    loginContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 20,
    },
    loginText: {
        color: '#666',
    },
    loginLink: {
        color: '#4A90E2',
        fontWeight: '600',
    },
    errorText: {
        color: 'red',
        textAlign: 'center',
        marginBottom: 15,
    },
});

export default Signup;