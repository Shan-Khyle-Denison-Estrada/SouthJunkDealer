import { CameraView, useCameraPermissions } from 'expo-camera';
import { useFocusEffect, useRouter } from 'expo-router'; // Added useFocusEffect
import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ScanQR() {
    const router = useRouter();
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [statusMsg, setStatusMsg] = useState("Align Inventory QR code within the frame"); // Dynamic status text

    // Reset scanner when screen comes into focus (e.g. going back from detail page)
    useFocusEffect(
        useCallback(() => {
            setScanned(false);
            setStatusMsg("Align Inventory QR code within the frame");
        }, [])
    );

    // --- PERMISSION HANDLING ---
    if (!permission) {
        return <View style={styles.container} />;
    }

    if (!permission.granted) {
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
        if (scanned) return;
        setScanned(true); // Lock scanner to prevent duplicates

        try {
            // 1. Attempt to Parse JSON
            const parsedData = JSON.parse(data);

            // 2. Validate Batch ID
            if (parsedData.batchId) {
                setStatusMsg("QR Found! Redirecting...");
                // Valid QR - Navigate
                router.push({
                    pathname: '/inventoryDetailed',
                    params: { batchId: parsedData.batchId }
                });
                
                // Optional: Reset scanner after a delay in case they navigate back immediately
                // But usually the focus effect handles it.
            } else {
                // Valid JSON but not an Inventory QR
                handleScanError("Invalid QR: Missing Batch ID");
            }

        } catch (error) {
            // Not JSON / Garbage Data
            handleScanError("Unrecognized QR Code");
        }
    };

    // Helper to handle invalid scans without blocking Alert
    const handleScanError = (msg) => {
        setStatusMsg(msg);
        // Wait 1.5 seconds then resume scanning automatically
        setTimeout(() => {
            setStatusMsg("Align Inventory QR code within the frame");
            setScanned(false); 
        }, 1500);
    };

    return (
        <View style={styles.container}>
            <CameraView
                style={StyleSheet.absoluteFillObject}
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                barcodeScannerSettings={{
                    barcodeTypes: ["qr"],
                }}
            />
            
            {/* OVERLAY UI */}
            <View style={styles.overlay}>
                <View style={styles.topOverlay}>
                    {/* Dynamic Status Text */}
                    <Text style={[
                        styles.instructionText, 
                        // Change color if showing an error/success message
                        statusMsg.includes("Align") ? {} : { color: '#F2C94C', fontWeight: 'bold' }
                    ]}>
                        {statusMsg}
                    </Text>
                </View>
                
                <View style={styles.centerRow}>
                    <View style={styles.sideOverlay} />
                    <View style={styles.scanFrame}>
                        <View style={styles.topLeft} />
                        <View style={styles.topRight} />
                        <View style={styles.bottomLeft} />
                        <View style={styles.bottomRight} />
                    </View>
                    <View style={styles.sideOverlay} />
                </View>

                <View style={styles.bottomOverlay}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
                        <Text style={styles.closeButtonText}>Close Camera</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const HIGHLIGHT_COLOR = '#F2C94C';
const OVERLAY_COLOR = 'rgba(0, 0, 0, 0.6)';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    permissionText: {
        fontSize: 18,
        textAlign: 'center',
        marginBottom: 20,
    },
    permissionButton: {
        backgroundColor: '#2563EB',
        padding: 12,
        borderRadius: 8,
    },
    permissionButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    // --- OVERLAY GRID ---
    overlay: {
        flex: 1,
    },
    topOverlay: {
        flex: 1,
        backgroundColor: OVERLAY_COLOR,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bottomOverlay: {
        flex: 1,
        backgroundColor: OVERLAY_COLOR,
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 20,
    },
    centerRow: {
        flexDirection: 'row',
        height: 280, 
    },
    sideOverlay: {
        flex: 1,
        backgroundColor: OVERLAY_COLOR,
    },
    scanFrame: {
        width: 280,
        height: 280,
        backgroundColor: 'transparent',
        position: 'relative',
    },
    // --- CORNERS ---
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
        fontSize: 18,
        marginBottom: 20,
        textAlign: 'center',
        fontWeight: '500',
        paddingHorizontal: 20,
    },
    closeButton: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'white',
        minWidth: 200,
        alignItems: 'center',
    },
    closeButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});