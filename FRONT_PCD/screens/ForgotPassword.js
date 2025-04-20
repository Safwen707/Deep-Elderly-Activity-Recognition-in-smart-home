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
import { sendPasswordResetEmail,fetchSignInMethodsForEmail } from 'firebase/auth';
import { auth } from '../config/firebase';
import { SafeAreaView } from 'react-native-safe-area-context';

const { height } = Dimensions.get('window');

const ForgotPassword = () => {
    const navigation = useNavigation();
    const [email, setEmail] = useState('');
    const [formHeight] = useState(new Animated.Value(height * 0.55));
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const panResponder = PanResponder.create({
        onStartShouldSetPanResponder: (evt) => {
            return evt._targetInst?.elementType !== 'TextInput';
        },
        onMoveShouldSetPanResponder: (evt, gestureState) => {
            return Math.abs(gestureState.dy) > 5;
        },
        onPanResponderMove: (_, gestureState) => {
            const newHeight = height * 0.55 - gestureState.dy;
            const minHeight = height * 0.4;
            const maxHeight = height * 0.9;

            // Rubber band effect at boundaries
            if (newHeight < minHeight) {
                formHeight.setValue(minHeight - (minHeight - newHeight) * 0.3);
            } else if (newHeight > maxHeight) {
                formHeight.setValue(maxHeight + (newHeight - maxHeight) * 0.3);
            } else {
                formHeight.setValue(newHeight);
            }
        },
        onPanResponderRelease: () => {
            // Snap back to boundaries if exceeded
            const currentHeight = formHeight._value;
            const minHeight = height * 0.4;
            const maxHeight = height * 0.9;

            if (currentHeight < minHeight) {
                Animated.spring(formHeight, {
                    toValue: minHeight,
                    useNativeDriver: false,
                }).start();
            } else if (currentHeight > maxHeight) {
                Animated.spring(formHeight, {
                    toValue: maxHeight,
                    useNativeDriver: false,
                }).start();
            }
        },
    });

    const handleResetPassword = async () => {
        if (!email) {
            setError('Please enter your email');
            return;
        }

        setIsLoading(true);
        setError('');
        setSuccess('');

        try {
            await sendPasswordResetEmail(auth, email);
            setSuccess('If this email is registered, you will receive a password reset link shortly.');
        } catch (err) {
            // Check for specific error codes
            if (err.code === 'auth/user-not-found') {
                setError('This email is not registered');
            } else {
                setError(err.message || 'Failed to send reset email');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ImageBackground
            source={require('../assets/Oldlady2.png')}
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
                    <View style={styles.dragHandle} hitSlop={{ top: 20, bottom: 20, left: 50, right: 50 }}>
                        <View style={styles.handleBar} />
                    </View>

                    <ScrollView
                        style={styles.formScroll}
                        contentContainerStyle={styles.formContent}
                    >
                        <Text style={styles.title}>Reset Password</Text>
                        <Text style={styles.subtitle}>Enter your email to receive a reset link</Text>

                        {error ? (
                            <Text style={styles.errorText}>{error}</Text>
                        ) : null}

                        {success ? (
                            <Text style={styles.successText}>{success}</Text>
                        ) : null}

                        <TextInput
                            style={styles.input}
                            placeholder="Email"
                            placeholderTextColor="#999"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />

                        <TouchableOpacity
                            style={styles.button}
                            onPress={handleResetPassword}
                        >
                            <Text style={styles.buttonText}>Send Reset Link</Text>
                        </TouchableOpacity>

                        <View style={styles.loginContainer}>
                            <Text style={styles.loginText}>Remember your password?</Text>
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
        backgroundColor: 'rgba(255,255,255,0.5)',
    },
    handleBar: {
        width: 50,
        height: 5,
        backgroundColor: '#ccc',
        borderRadius: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
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
        marginBottom: 10,
        color: '#333',
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20,
    },
    input: {
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
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
    successText: {
        color: 'green',
        textAlign: 'center',
        marginBottom: 15,
    },
});

export default ForgotPassword;