import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { SunmiCloudPrinter } from 'react-native-sunmi-cloud-printer';

export interface MyPrinter {
  cloudPrinter: SunmiCloudPrinter;
  isConnected: boolean;
}

interface MyPrintersContextType {
  printers: MyPrinter[];
  addPrinter: (printer: SunmiCloudPrinter) => void;
  removePrinter: (printer: SunmiCloudPrinter) => void;
  toggleConnection: (printer: SunmiCloudPrinter) => void;
}

const MyPrintersContext = createContext<MyPrintersContextType | undefined>(undefined);

export const MyPrintersProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [printers, setPrinters] = useState<MyPrinter[]>([]);

  const addPrinter = useCallback((printer: SunmiCloudPrinter) => {
    const myPrinter = { cloudPrinter: printer, isConnected: false };
    setPrinters((prevPrinters) => {
      const printerExists = prevPrinters.some((p) => p.cloudPrinter.name === printer.name);
      if (printerExists) {
        return prevPrinters;
      }
      return [...prevPrinters, myPrinter];
    });
  }, []);

  const removePrinter = useCallback((printer: SunmiCloudPrinter) => {
    setPrinters((prevPrinters) => prevPrinters.filter((p) => p.cloudPrinter.name !== printer.name));
  }, []);

  const toggleConnection = useCallback((printer: SunmiCloudPrinter) => {
    setPrinters((prevPrinters) =>
      prevPrinters.map((p) => {
        if (p.cloudPrinter.name === printer.name) {
          return { ...p, isConnected: !p.isConnected };
        }
        return p;
      })
    );
  }, []);

  return (
    <MyPrintersContext.Provider value={{ printers, addPrinter, removePrinter, toggleConnection }}>
      {children}
    </MyPrintersContext.Provider>
  );
};

export const useMyPrinters = () => {
  const context = useContext(MyPrintersContext);
  if (!context) {
    throw new Error('useMyPrinters must be used within a MyPrintersProvider');
  }
  return context;
};

export default MyPrintersProvider;
