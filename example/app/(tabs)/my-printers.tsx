import { useCallback, useEffect } from 'react';
import { Alert, View, Text, StyleSheet, TouchableOpacity, FlatList, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Icons } from '../../utils/consts';
import { useMyPrinters, MyPrinter } from '../../providers/my-printers';
import { disconnectSunmiPrinter, connectSunmiPrinter, printTestPage } from '../../utils/printer';
import { SunmiError, printerConnectionListener } from 'react-native-sunmi-cloud-printer';

const showError = (error: SunmiError | Error | undefined) => {
  if (__DEV__) {
    console.error(error);
  }
  let errorMessage: string;
  if (error instanceof SunmiError) {
    errorMessage = `Code:${error.code}\nReason:${error.message}`;
  } else if (error) {
    errorMessage = error.message;
  } else {
    errorMessage = 'An unknown error occurred';
  }
  Alert.alert('Error', errorMessage);
};

export default function MyPrintersScreen() {
  const { printers, removePrinter, toggleConnection } = useMyPrinters();

  const disconnectAllPrinters = useCallback(() => {
    // Disconnect all the printers
    printers.forEach((printer) => {
      if (printer.isConnected) {
        toggleConnection(printer.cloudPrinter);
        disconnectSunmiPrinter(printer.cloudPrinter).catch((e) => {
          if (__DEV__) {
            console.error('Error disconnecting printer', e);
          }
        });
      }
    });
  }, [printers, toggleConnection]);

  const handlePrinterAction = useCallback(
    async (printer: MyPrinter, action: 'test-print' | 'remove-printer' | 'toggle-connection') => {
      try {
        switch (action) {
          case 'remove-printer': {
            removePrinter(printer.cloudPrinter);
            break;
          }
          case 'test-print': {
            await printTestPage();
            break;
          }
          case 'toggle-connection': {
            printers.forEach((p) => {
              if (p !== printer) {
                disconnectSunmiPrinter(p.cloudPrinter).catch((e) => {
                  if (__DEV__) {
                    console.error('Error disconnecting printer', e);
                  }
                });
              }
            });

            if (printer.isConnected) {
              await disconnectSunmiPrinter(printer.cloudPrinter);
            } else {
              await connectSunmiPrinter(printer.cloudPrinter);
            }
            toggleConnection(printer.cloudPrinter);
            break;
          }
        }
      } catch (e) {
        showError(e as Error);
        disconnectAllPrinters();
      }
    },
    [disconnectAllPrinters, printers, removePrinter, toggleConnection]
  );

  const renderPrinterItem = useCallback(({ item: printer }: { item: MyPrinter }) => {
    const statusColor = {
      connected: '#34C759',
      disconnected: '#8E8E93',
    }[printer.isConnected ? 'connected' : 'disconnected'];

    const iconName =
      printer.cloudPrinter.interface === 'BLUETOOTH'
        ? Icons.bluetooth
        : printer.cloudPrinter.interface === 'LAN'
          ? Icons.lan
          : Icons.usb;

    let details: string;
    switch (printer.cloudPrinter.interface) {
      case 'BLUETOOTH': {
        details = printer.cloudPrinter.uuid;
        break;
      }
      case 'LAN': {
        details = printer.cloudPrinter.ip;
        break;
      }
      case 'USB': {
        details = printer.cloudPrinter.name;
        break;
      }
    }

    return (
      <View style={styles.printerCard}>
        <View style={styles.printerHeader}>
          <View style={styles.printerInfo}>
            <View style={styles.nameContainer}>
              <Text style={styles.printerName}>{printer.cloudPrinter.name}</Text>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            </View>
          </View>
        </View>

        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Ionicons name={iconName} size={16} color="#666" />
            <Text style={styles.detailText}>{details}</Text>
          </View>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: printer.isConnected ? Colors.primary : Colors.lightGray }]}
            disabled={!printer.isConnected}
            onPress={() => handlePrinterAction(printer, 'test-print')}
          >
            <Ionicons name="document-text" size={20} color={Colors.white} />
            <Text style={styles.actionButtonText}>Test Print</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              {
                backgroundColor: printer.isConnected ? Colors.green : Colors.gray,
              },
            ]}
            onPress={() => handlePrinterAction(printer, 'toggle-connection')}
          >
            <Ionicons name={printer.isConnected ? 'power' : 'power-outline'} size={20} color={Colors.white} />
            <Text style={styles.actionButtonText}>{printer.isConnected ? 'Connected' : 'Connect'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: Colors.red }]}
            onPress={() => handlePrinterAction(printer, 'remove-printer')}
          >
            <Ionicons name="trash" size={20} color={Colors.white} />
            <Text style={styles.actionButtonText}>Remove</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }, []);

  useEffect(() => {
    // Listen to changes in the native module.
    const printerConnectionSubscription = printerConnectionListener((event) => {
      if (!event.connected) {
        // Disconnect all the printers
        disconnectAllPrinters();
      }
    });

    return () => {
      if (__DEV__) {
        console.log('❌ Remove subscriptions');
      }
      printerConnectionSubscription.remove();
    };
  }, [disconnectAllPrinters]);

  return (
    <View style={styles.container}>
      {printers.length > 0 ? (
        <FlatList
          data={printers}
          renderItem={renderPrinterItem}
          keyExtractor={(item, id) => `${item.cloudPrinter.name}-${id}`}
          contentContainerStyle={styles.printerList}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="print-outline" size={64} color="#999" />
          <Text style={styles.emptyStateText}>No printers found</Text>
          <Text style={styles.emptyStateSubtext}>Add printers from the Discover tab</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  printerList: {
    padding: 16,
    gap: 16,
  },
  printerCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
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
  printerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  printerInfo: {
    flex: 1,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  printerName: {
    fontSize: 18,
    fontWeight: '600',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  detailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 4,
  },
  actionButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 16,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
});
