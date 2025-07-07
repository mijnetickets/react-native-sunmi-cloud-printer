import { NativeModule, requireNativeModule } from 'expo';

import { PrintersEventPayload, PrinterConnectionPayload } from './ReactNativeSunmiCloudPrinter.types';

declare class ReactNativeSunmiCloudPrinterModule extends NativeModule {
  addListener<EventName extends 'onUpdatePrinters'>(
    eventName: EventName,
    listener: (event: PrintersEventPayload) => void
  ): { remove: () => void };
  addListener<EventName extends 'onPrinterConnectionUpdate'>(
    eventName: EventName,
    listener: (event: PrinterConnectionPayload) => void
  ): { remove: () => void };
}

// This call loads the native module object from the JSI.
export default requireNativeModule<ReactNativeSunmiCloudPrinterModule>('ReactNativeSunmiCloudPrinter');
