// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight, SymbolViewProps } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Record<SymbolViewProps['name'], ComponentProps<typeof MaterialIcons>['name']>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'chevron.left': 'chevron-left',
  'book.fill': 'menu-book',
  'person.crop.circle': 'account-circle',
  'person.crop.circle.fill': 'account-circle',
  'lock.fill': 'lock',
  'envelope.fill': 'email',
  'gearshape.fill': 'settings',
  'plus': 'add',
  'minus': 'remove',
  'trash.fill': 'delete',
  'pencil': 'edit',
  'magnifyingglass': 'search',
  'bell.fill': 'notifications',
  'heart.fill': 'favorite',
  'star.fill': 'star',
  'camera.fill': 'photo-camera',
  'photo.fill.on.rectangle.fill': 'photo-library',
  'checkmark.circle.fill': 'check-circle',
  'xmark.circle.fill': 'cancel',
  'arrow.clockwise': 'refresh',
  'arrow.right.arrow.left': 'swap-horiz',
  'person.2.fill': 'group',
  'chart.bar.fill': 'bar-chart',
  'calendar': 'calendar-today',
  'location.fill': 'place',
  'map.fill': 'map',
  'phone.fill': 'phone',
  'message.fill': 'message',
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
