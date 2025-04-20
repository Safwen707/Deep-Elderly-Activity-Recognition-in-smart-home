import {StyleSheet, View, Image, SafeAreaView, Text, Pressable} from 'react-native';
import React, { useEffect, useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Animated } from 'react-native';
import Button from "../components/Button.js";

const Welcome = ({ navigation }) => {
    // Create animated values for each image
    const oldladyPosition = useRef(new Animated.ValueXY({ x: 400, y: -50 })).current;
    const old1Position =useRef(new Animated.ValueXY({ x: 260, y: -300 })).current;
    const old2Position = useRef(new Animated.ValueXY({ x: -200, y: -300 })).current;
    const old3Position = useRef(new Animated.ValueXY({ x: -300, y: 110 })).current;

    // Final positions
    const oldladyFinal = { x: 180, y: 300 };
    const old1Final = { x: 250, y: 180 };
    const old2Final = { x: 75, y: 230 };
    const old3Final = { x: 20, y: 360 };

    useEffect(() => {
        // Create animations for each image
        const animations = [
            Animated.timing(oldladyPosition, {
                toValue: oldladyFinal,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.timing(old1Position, {
                toValue: old1Final,
                duration: 1200,
                useNativeDriver: true,
            }),
            Animated.timing(old2Position, {
                toValue: old2Final,
                duration: 1400,
                useNativeDriver: true,
            }),
            Animated.timing(old3Position, {
                toValue: old3Final,
                duration: 1600,
                useNativeDriver: true,
            }),
        ];

        // Start all animations
        Animated.stagger(100, animations).start();
    }, []);

    const handlePress = () => {
        navigation.navigate('Signup'); // Replace 'Home' with your target screen name
    };

    return (
        <LinearGradient
            style={{ flex: 1 }}
            colors={['#f3b257', '#8ebdff', '#5fa0fa']}
        >
            <SafeAreaView style={{ flex: 1 }}>
                <View style={{ flex: 1, justifyContent: 'center' }}>
                    <View style={styles.imageContainer}>
                        <Animated.Image
                            style={[
                                styles.old1,
                                {
                                    transform: [
                                        { translateX: old1Position.x },
                                        { translateY: old1Position.y },
                                        { rotateZ: "5deg" }
                                    ]
                                }
                            ]}
                            source={require('../assets/Old.jpg')}
                        />
                        <Animated.Image
                            style={[
                                styles.old2,
                                {
                                    transform: [
                                        { translateX: old2Position.x },
                                        { translateY: old2Position.y },
                                        { rotateZ: "-40deg" }
                                    ]
                                }
                            ]}
                            source={require('../assets/Old2.png')}
                        />
                        <Animated.Image
                            style={[
                                styles.old3,
                                {
                                    transform: [
                                        { translateX: old3Position.x },
                                        { translateY: old3Position.y },
                                        { rotateZ: "-80deg" }
                                    ]
                                }
                            ]}
                            source={require('../assets/Old3.png')}
                        />
                        <Animated.Image
                            style={[
                                styles.Oldlady,
                                {
                                    transform: [
                                        { translateX: oldladyPosition.x },
                                        { translateY: oldladyPosition.y },
                                        { rotateZ: "0deg" }
                                    ]
                                }
                            ]}
                            source={require('../assets/Oldlady.png')}
                        />
                    </View>

                    {/* Text and Button Container */}
                    <View style={styles.bottomContainer}>
                        <View style={styles.textContainer}>
                            <Text style={styles.title}>Welcome to Our App</Text>
                            <Text style={styles.subtitle}>Connecting generations through shared stories</Text>
                        </View>
                  <View style={{alignItems: 'center' ,flexDirection: 'row',width: '80%'}}>
                        <Button
                            title="Get Started"
                            onPress={handlePress}
                            color="#FF5733"
                            textColor="#FFFFFF"
                            style={[styles.button,{
                                marginTop: 30,
                                marginBottom:30,
                                marginRight:30}]}
                        />


                     <View style={{
                         flexDirection: 'row',
                         MarginTop: 20,
                         justifyContent: 'center',
                         left:20
                     }}>
                       <Pressable style={styles.button} onPress={()=>navigation.navigate('Login')}>
                           <Text style={{
                                   fontsize:16,
                               color: 'white',
                               fontWeight: 'bold',
                               marginleft:15
                               }}>
                               Already signed in ?Log in

                           </Text>
                       </Pressable>

                     </View>

                  </View>
                    </View>
                </View>
            </SafeAreaView>
        </LinearGradient>
    );
};

export default Welcome;

const styles = StyleSheet.create({
    imageContainer: {
        flex: 1,
        position: 'relative',
    },
    bottomContainer: {
        marginTop:60,
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    old1: {
        borderRadius: 20,
        width: 120,
        height: 120,
        position: 'absolute',
    },
    old2: {
        borderRadius: 20,
        width: 120,
        height: 120,
        position: 'absolute',
    },
    old3: {
        borderRadius: 20,
        width: 120,
        height: 120,
        position: 'absolute',
    },
    Oldlady: {
        borderRadius: 20,
        width: 200,
        height: 300,
        position: 'absolute',
    },
    textContainer: {
        marginBottom: 30,
        marginTop: 30,
     },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 10,
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 10,
    },
    subtitle: {
        fontSize: 16,
        color: '#fff',
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 10,
    },
    button: {
        alignSelf: 'center',
        width: '100%',
        maxWidth: 300,
    }
});