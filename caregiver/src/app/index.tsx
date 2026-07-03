import { ActivityIndicator, View } from 'react-native';

import { Palette } from '@/constants/theme';

/** Entry route. The auth gate in _layout immediately redirects to the right
 *  surface (sign-in / caregiver / patient); this is the brief loading frame. */
export default function Index() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Palette.canvas }}>
      <ActivityIndicator color={Palette.brand} size="large" />
    </View>
  );
}
