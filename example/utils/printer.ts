import * as SunmiSDK from 'react-native-sunmi-cloud-printer';

import { Image } from '../components/image';

export interface Printer {
  id: string;
  name: string;
  interface: string;
  details: string;
}

export const disconnectSunmiPrinter = async (printer: SunmiSDK.SunmiCloudPrinter): Promise<void> => {
  const isConnected = await SunmiSDK.isPrinterConnected(printer);
  if (__DEV__) {
    console.log(`🚀 Disconnecting printer ${printer.name}: isConnected=${isConnected}`);
  }
  if (isConnected) {
    // Disconnects the printer
    await SunmiSDK.disconnectPrinter();
  }
};

export const connectSunmiPrinter = async (printer: SunmiSDK.SunmiCloudPrinter): Promise<void> => {
  // If we have an open connection, we should not connect again. Manually, we check the current connection status.
  const isConnected = await SunmiSDK.isPrinterConnected(printer);
  if (__DEV__) {
    console.log(`🚀 Connecting to printer ${printer.name}: isConnected=${isConnected}`);
  }
  if (!isConnected) {
    switch (printer.interface) {
      case 'BLUETOOTH':
        await SunmiSDK.connectBluetoothPrinter({ uuid: printer.uuid });
        break;
      case 'LAN':
        await SunmiSDK.connectLanPrinter({ ipAddress: printer.ip, force: true });
        break;
      case 'USB':
        await SunmiSDK.connectUSBPrinter({ name: printer.name });
        break;
    }

    // Add a sleep to wait for the connection to be established
    // For production, we should use the `onPrinterConnection` event
    // to know when the printer is connected
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const hasConnected = await SunmiSDK.isPrinterConnected(printer);
    if (!hasConnected) {
      throw new Error('Failed to connect to the printer');
    }
  }
};

export const printTestPage = async (): Promise<void> => {
  await SunmiSDK.clearBuffer();
  await SunmiSDK.addImage({
    base64: Image.base64,
    width: Image.width,
    height: Image.height,
  });
  await SunmiSDK.lineFeed(4);
  await SunmiSDK.addCut(false);
  await SunmiSDK.sendData();
};

export const getPrinterStatus = async (printer: Printer): Promise<SunmiSDK.CloudPrinterStatus> => {
  await SunmiSDK.clearBuffer();
  return await SunmiSDK.getDeviceState();
};
