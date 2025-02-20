import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  PrinterInterface,
  SunmiCloudPrinter,
  discoverPrinters,
  printersListener,
} from 'react-native-sunmi-cloud-printer';
import { Colors, Icons } from '../../utils/consts';
import { useMyPrinters } from '../../providers/my-printers';

export const isValidIPAddress = (ip: string): boolean => {
  // Regular expression for IPv4 validation
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;

  if (!ipv4Regex.test(ip)) {
    return false;
  }

  // Check if each octet is in valid range (0-255)
  const octets = ip.split('.');
  return octets.every((octet) => {
    const num = parseInt(octet, 10);
    return num >= 0 && num <= 255;
  });
};

export default function DiscoverScreen() {
  const [selectedType, setSelectedType] = useState<PrinterInterface>('LAN');
  const [ipAddress, setIpAddress] = useState('');
  const [discoveredPrinters, setDiscoveredPrinters] = useState<SunmiCloudPrinter[]>([]);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const { addPrinter } = useMyPrinters();

  const handleTypeSelect = useCallback((type: PrinterInterface) => {
    setSelectedType(type);
    setDiscoveredPrinters([]);
  }, []);

  const onAddPrinter = useCallback(
    (printer: SunmiCloudPrinter) => {
      // Handle printer selection
      Alert.alert('Printer added', `You have added the printer ${printer.name}`);
      setIpAddress('');
      setDiscoveredPrinters([]);
      addPrinter(printer);
    },
    [addPrinter]
  );

  const onAddManualIpPrinter = useCallback((address: string) => {
    if (!isValidIPAddress(address)) {
      Alert.alert('Invalid IP Address', 'Please enter a valid IP address (e.g., 192.168.1.1)');
      return;
    }

    const manualPrinter: SunmiCloudPrinter = {
      interface: 'LAN',
      name: `Printer at ${address}`,
      ip: address,
    };

    onAddPrinter(manualPrinter);
  }, []);

  const onDiscoverPrinters = useCallback(async () => {
    setIsDiscovering(true);
    try {
      await discoverPrinters(selectedType);
    } catch (e) {
      if (__DEV__) {
        console.error('Error discovering printers', e);
      }
    } finally {
      setIsDiscovering(false);
    }
  }, [selectedType]);

  const renderPrinterItem = useCallback(
    ({ item }: { item: SunmiCloudPrinter }) => {
      let details: string;
      switch (item.interface) {
        case 'BLUETOOTH':
          details = `UUID: ${item.uuid}`;
          break;
        case 'LAN':
          details = `IP: ${item.ip}`;
          break;
        case 'USB':
          details = `USB: ${item.name}`;
          break;
      }
      return (
        <TouchableOpacity
          style={styles.printerItem}
          onPress={() => {
            onAddPrinter(item);
          }}
        >
          <View style={styles.printerInfo}>
            <Text style={styles.printerName}>{item.name}</Text>
            <Text style={styles.printerDetails}>{details}</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={Colors.primary} />
        </TouchableOpacity>
      );
    },
    [onAddPrinter]
  );

  const { onActionPress, isDisabledAction, actionButtonText } = useMemo(() => {
    return {
      actionButtonText: isDiscovering
        ? 'Discovering...'
        : ipAddress.length > 0
          ? 'Add IP Printer'
          : 'Discover Printers',
      isDisabledAction: isDiscovering,
      onActionPress:
        selectedType !== 'LAN'
          ? onDiscoverPrinters
          : ipAddress.length > 0
            ? () => {
                onAddManualIpPrinter(ipAddress);
              }
            : onDiscoverPrinters,
    };
  }, [isDiscovering, ipAddress, onAddManualIpPrinter, onDiscoverPrinters, selectedType]);

  useEffect(() => {
    // Listen to changes in the native module.
    const printersSubscription = printersListener((event) => {
      setDiscoveredPrinters(event.printers);
      setIsDiscovering(false);
    });

    return () => {
      printersSubscription.remove();
    };
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.typeContainer}>
        <TouchableOpacity
          style={[styles.typeButton, selectedType === 'BLUETOOTH' && styles.selectedType]}
          onPress={() => handleTypeSelect('BLUETOOTH')}
        >
          <Ionicons
            name={Icons.bluetooth}
            size={24}
            color={selectedType === 'BLUETOOTH' ? Colors.white : Colors.primary}
          />
          <Text style={[styles.typeText, selectedType === 'BLUETOOTH' && styles.selectedTypeText]}>Bluetooth</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.typeButton, selectedType === 'LAN' && styles.selectedType]}
          onPress={() => handleTypeSelect('LAN')}
        >
          <Ionicons name={Icons.lan} size={24} color={selectedType === 'LAN' ? Colors.white : Colors.primary} />
          <Text style={[styles.typeText, selectedType === 'LAN' && styles.selectedTypeText]}>Ethernet</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.typeButton, selectedType === 'USB' && styles.selectedType]}
          onPress={() => handleTypeSelect('USB')}
        >
          <Ionicons name={Icons.usb} size={24} color={selectedType === 'USB' ? Colors.white : Colors.primary} />
          <Text style={[styles.typeText, selectedType === 'USB' && styles.selectedTypeText]}>USB</Text>
        </TouchableOpacity>
      </View>

      {selectedType === 'LAN' && (
        <View style={styles.ipContainer}>
          <TextInput
            style={styles.ipInput}
            placeholder="Enter IP Address (optional)"
            value={ipAddress}
            onChangeText={setIpAddress}
            keyboardType="numeric"
          />
        </View>
      )}

      <TouchableOpacity style={styles.actionButton} onPress={onActionPress} disabled={isDisabledAction}>
        <Text style={styles.actionButtonText}>{actionButtonText}</Text>
      </TouchableOpacity>

      {discoveredPrinters.length > 0 && (
        <FlatList
          data={discoveredPrinters}
          renderItem={renderPrinterItem}
          keyExtractor={(item, idx) => `${item.interface}-${idx}`}
          style={styles.printerList}
          contentContainerStyle={styles.printerListContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  typeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  typeButton: {
    flex: 1,
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  selectedType: {
    backgroundColor: Colors.primary,
  },
  typeText: {
    marginTop: 8,
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  selectedTypeText: {
    color: Colors.white,
  },
  ipContainer: {
    marginBottom: 16,
  },
  ipInput: {
    backgroundColor: Colors.white,
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  actionButton: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  printerList: {
    marginTop: 24,
  },
  printerListContent: {
    gap: 12,
  },
  printerItem: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  printerInfo: {
    flex: 1,
  },
  printerName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  printerDetails: {
    fontSize: 14,
    color: '#666',
  },
});
