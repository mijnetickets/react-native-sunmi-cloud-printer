import { Slot } from 'expo-router';
import MyPrintersProvider from '../providers/my-printers';

export default function Layout() {
  return (
    <MyPrintersProvider>
      <Slot />
    </MyPrintersProvider>
  );
}
