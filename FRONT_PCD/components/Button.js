import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';

const Button = (props) => {
    const {
        title,
        onPress,
        color = '#007AFF',
        textColor = 'white',
        disabled = false,
        loading = false,
        style,
        textStyle,
        iconLeft,
        iconRight,
    } = props;

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.7}
            style={styles.touchable}
        >
            <View
                style={[
                    styles.button,
                    { backgroundColor: disabled ? '#cccccc' : color },
                    style
                ]}
            >
                {loading ? (
                    <ActivityIndicator color="rgba(255, 255, 255, 0.5)" />
                ) : (
                    <View style={styles.content}>
                        {iconLeft && <View style={styles.iconLeft}>{iconLeft}</View>}
                        <Text
                            style={[
                                styles.text,
                                { color: textColor },
                                textStyle
                            ]}
                            numberOfLines={1}
                        >
                            {title}
                        </Text>
                        {iconRight && <View style={styles.iconRight}>{iconRight}</View>}
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
};


const styles = StyleSheet.create({
    touchable: {
        alignSelf: 'flex-start', // Makes the button only as wide as its content
    },

    button: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        minWidth: 100, // Ensures button has a minimum width
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
    iconLeft: {
        marginRight: 8,
    },
    iconRight: {
        marginLeft: 8,
    },
});

export default Button;