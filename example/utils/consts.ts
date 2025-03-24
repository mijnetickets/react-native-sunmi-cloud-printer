import { Ionicons } from '@expo/vector-icons';

type IconName = keyof typeof Ionicons.glyphMap;

export const Colors = {
  primary: '#007AFF',
  white: '#ffffff',
  green: '#34C759',
  gray: '#8E8E93',
  lightGray: '#c5c5c5',
  red: '#FF3B30',
};

interface IconsType {
  bluetooth: IconName;
  lan: IconName;
  usb: IconName;
}

export const Icons: IconsType = {
  bluetooth: 'bluetooth',
  lan: 'wifi',
  usb: 'git-branch-outline',
};
