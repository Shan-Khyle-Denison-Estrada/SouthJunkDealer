import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ScanQR() {
    const router = useRouter();
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);

    // --- PERMISSION HANDLING ---
    if (!permission) {
        // Camera permissions are still loading
        return <View style={styles.container} />;
    }

    if (!permission.granted) {
        // Camera permissions are not granted yet
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
                <Text style={styles.permissionText}>We need your permission to use the camera</Text>
                <TouchableOpacity onPress={requestPermission} style={styles.permissionButton}>
                    <Text style={styles.permissionButtonText}>Grant Permission</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
                    <Text style={{ color: '#666' }}>Cancel</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // --- SCAN HANDLER ---
    const handleBarCodeScanned = ({ type, data }) => {
        setScanned(true);
        // Frontend-only demo: alert the user
        alert(`Scanned: ${data}`);
        
        // Reset scanner after a delay so they can scan again if needed
        setTimeout(() => setScanned(false), 2000);
    };

    return (
        <View style={styles.container}>
            <CameraView
                style={styles.camera}
                facing="back"
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                barcodeScannerSettings={{
                    barcodeTypes: ["qr"],
                }}
            >
                {/* --- OVERLAY UI --- */}
                <View style={styles.overlayContainer}>
                    
                    {/* Top Mask */}
                    <View style={styles.maskRow} />

                    {/* Middle Row (Mask - Scanner - Mask) */}
                    <View style={styles.maskCenterRow}>
                        <View style={styles.maskSide} />
                        
                        {/* The Transparent Scan Window */}
                        <View style={styles.scanWindow}>
                            {/* Corner Markers */}
                            <View style={styles.topLeft} />
                            <View style={styles.topRight} />
                            <View style={styles.bottomLeft} />
                            <View style={styles.bottomRight} />
                        </View>
                        
                        <View style={styles.maskSide} />
                    </View>

                    {/* Bottom Mask */}
                    <View style={styles.maskRow}>
                         <Text style={styles.instructionText}>Align QR code within the frame</Text>
                         
                         {/* Close Button */}
                         <TouchableOpacity 
                            onPress={() => router.back()} 
                            style={styles.closeButton}
                         >
                            <Text style={styles.closeButtonText}>Close Scanner</Text>
                         </TouchableOpacity>
                    </View>
                </View>
            </CameraView>
        </View>
    );
}

const OVERLAY_COLOR = 'rgba(0,0,0,0.7)'; // Dark semi-transparent background
const HIGHLIGHT_COLOR = '#F2C94C'; // Your project's gold color

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    camera: {
        flex: 1,
    },
    // --- OVERLAY GRID ---
    overlayContainer: {
        flex: 1,
    },
    maskRow: {
        flex: 1,
        backgroundColor: OVERLAY_COLOR,
        justifyContent: 'center',
        alignItems: 'center',
    },
    maskCenterRow: {
        flexDirection: 'row',
        height: 250, // Height of the scanning square
    },
    maskSide: {
        flex: 1,
        backgroundColor: OVERLAY_COLOR,
    },
    // --- SCAN WINDOW ---
    scanWindow: {
        width: 250,
        height: 250,
        backgroundColor: 'transparent',
        position: 'relative',
    },
    // --- CORNER MARKERS ---
    topLeft: {
        position: 'absolute',
        top: 0, left: 0,
        width: 40, height: 40,
        borderTopWidth: 4, borderLeftWidth: 4,
        borderColor: HIGHLIGHT_COLOR,
    },
    topRight: {
        position: 'absolute',
        top: 0, right: 0,
        width: 40, height: 40,
        borderTopWidth: 4, borderRightWidth: 4,
        borderColor: HIGHLIGHT_COLOR,
    },
    bottomLeft: {
        position: 'absolute',
        bottom: 0, left: 0,
        width: 40, height: 40,
        borderBottomWidth: 4, borderLeftWidth: 4,
        borderColor: HIGHLIGHT_COLOR,
    },
    bottomRight: {
        position: 'absolute',
        bottom: 0, right: 0,
        width: 40, height: 40,
        borderBottomWidth: 4, borderRightWidth: 4,
        borderColor: HIGHLIGHT_COLOR,
    },
    // --- TEXT & BUTTONS ---
    instructionText: {
        color: 'white',
        fontSize: 16,
        marginBottom: 20,
        textAlign: 'center',
        fontWeight: '500',
    },
    closeButton: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'white',
    },
    closeButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    // --- PERMISSION SCREEN ---
    permissionText: {
        fontSize: 18,
        textAlign: 'center',
        marginBottom: 20,
    },
    permissionButton: {
        backgroundColor: HIGHLIGHT_COLOR,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
    },
    permissionButtonText: {
        color: 'black',
        fontWeight: 'bold',
        fontSize: 16,
    }
});