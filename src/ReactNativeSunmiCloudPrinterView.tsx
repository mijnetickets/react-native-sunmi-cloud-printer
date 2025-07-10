import { requireNativeView } from 'expo';
import * as React from 'react';

import { ReactNativeSunmiCloudPrinterViewProps } from './ReactNativeSunmiCloudPrinter.types';

const NativeView: React.ComponentType<ReactNativeSunmiCloudPrinterViewProps> =
  requireNativeView('ReactNativeSunmiCloudPrinter');

export default function ReactNativeSunmiCloudPrinterView(props: ReactNativeSunmiCloudPrinterViewProps) {
  return <NativeView {...props} />;
}
