import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Button, StyleSheet, PermissionsAndroid, Platform } from 'react-native';
import LiveAudioStream from 'react-native-live-audio-stream';

interface Props {
    baseUrl?: string;
}

const MaayaScreen = ({ baseUrl }: Props) => {
    const [status, setStatus] = useState('Disconnected');
    const ws = useRef<WebSocket | null>(null);

    useEffect(() => {
        const options = {
            sampleRate: 16000,
            channels: 1,
            bitsPerSample: 16,
            audioSource: 6,
            bufferSize: 4096
        };
        LiveAudioStream.init(options);

        LiveAudioStream.on('data', data => {
            if (ws.current && ws.current.readyState === WebSocket.OPEN) {
                // Send base64 string directly
                ws.current.send(data);
            }
        });

        return () => {
            LiveAudioStream.stop();
            if (ws.current) ws.current.close();
        };
    }, []);

    const requestPermission = async () => {
        if (Platform.OS === 'android') {
            try {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
                );
                return granted === PermissionsAndroid.RESULTS.GRANTED;
            } catch (err) {
                console.warn('microphone permission denied', err);
                return false;
            }
        }
        return true;
    };

    const startStreaming = async () => {
        const hasPermission = await requestPermission();
        if (!hasPermission) {
            console.log('microphone permission denied');
            return;
        }

        console.log('Microphone connected.');
        
        const hostIp = baseUrl ? baseUrl.replace('http://', '').split(':')[0] : '192.168.0.102';
        const wsUrl = `ws://${hostIp}:8001/ws/maaya`;
        console.log(`Connecting... to ${wsUrl}`);
        setStatus('Connecting...');
        
        ws.current = new WebSocket(wsUrl);
        
        ws.current.onopen = () => {
            console.log('Connected');
            setStatus('Connected. Streaming...');
            LiveAudioStream.start();
            console.log('Microphone started');
        };

        ws.current.onerror = (e) => {
            console.log('WebSocket error', e.message);
            setStatus('Error connecting');
        };
        
        ws.current.onclose = () => {
            console.log('Disconnected');
            setStatus('Disconnected');
        };
    };

    const stopStreaming = () => {
        LiveAudioStream.stop();
        console.log('Microphone stopped');
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send("STOP");
            setStatus('Stopped. Waiting for transcript...');
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Maaya Assistant (Milestone 1)</Text>
            <Text style={styles.status}>Status: {status}</Text>
            <View style={styles.buttonContainer}>
                <Button title="Start Streaming" onPress={startStreaming} />
            </View>
            <View style={styles.buttonContainer}>
                <Button title="Stop Streaming" onPress={stopStreaming} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
    title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, color: '#FFF' },
    status: { fontSize: 16, color: '#FFF', marginBottom: 20 },
    buttonContainer: { marginVertical: 10, width: 200 }
});

export default MaayaScreen;
