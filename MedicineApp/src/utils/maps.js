import * as Location from 'expo-location';
import { Linking, Alert, Platform } from 'react-native';

export const findNearbyJanAushadhi = async () => {
  try {
    // 1. Request Permission
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert("Permission Denied", "We need location to find nearby stores.");
      return;
    }

    // 2. Get current position
    let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
    });
    
    const { latitude, longitude } = location.coords;

    // 3. Build the Universal Google Maps URL
    const query = encodeURIComponent("Jan Aushadhi Kendra");
    const url = `https://www.google.com/maps/search/?api=1&query=${query}&center=${latitude},${longitude}`;

    // 4. Force open the URL (bypassing Android 11 visibility restrictions)
    try {
      await Linking.openURL(url);
    } catch (linkError) {
      // This will only trigger if the phone literally has no web browser and no maps app
      Alert.alert("Error", "Could not launch maps. Please ensure you have a browser or Google Maps installed.");
    }

  } catch (error) {
    Alert.alert("Location Error", "Something went wrong fetching your GPS coordinates.");
  }
};