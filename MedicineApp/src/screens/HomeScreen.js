import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { searchMedicineText, searchMedicineFromImage } from '../services/api';

export default function HomeScreen({ navigation }) {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // --- 1. HANDLE TEXT SEARCH ---
  const handleTextSearch = async () => {
    if (!query.trim()) {
      Alert.alert('Empty Search', 'Please enter a medicine name.');
      return;
    }

    setIsLoading(true);
    try {
      const data = await searchMedicineText(query);
      navigation.navigate('Results', { resultsData: data });
    } catch (error) {
      Alert.alert('Search Failed', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // --- 2. HANDLE CAMERA / GALLERY UPLOAD ---
  const handleImageUpload = async (useCamera = false) => {
    try {
      let result;
      if (useCamera) {
        await ImagePicker.requestCameraPermissionsAsync();
        result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          quality: 0.8,
        });
      } else {
        await ImagePicker.requestMediaLibraryPermissionsAsync();
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setIsLoading(true);
        const imageAsset = result.assets[0];
        
        const data = await searchMedicineFromImage(imageAsset);
        navigation.navigate('Results', { resultsData: data });
      }
    } catch (error) {
      Alert.alert('Upload Failed', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // --- 3. HANDLE PDF / DOCUMENT UPLOAD ---
  const handleDocumentUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setIsLoading(true);
        const docAsset = result.assets[0];
        
        const fileObj = {
          uri: docAsset.uri,
          fileName: docAsset.name,
          mimeType: docAsset.mimeType
        };

        const data = await searchMedicineFromImage(fileObj);
        navigation.navigate('Results', { resultsData: data });
      }
    } catch (error) {
      Alert.alert('Document Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.innerContainer}
      >
        <View style={styles.header}>
          <Text style={styles.title}>AI Pharmacist</Text>
          <Text style={styles.subtitle}>Find safe & affordable alternatives</Text>
        </View>

        {/* TEXT INPUT SECTION */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Type medicine names (e.g. Dolo 650, Telma 40)"
            placeholderTextColor="#8E8E93"
            value={query}
            onChangeText={setQuery}
            multiline={true}
          />
          <TouchableOpacity style={styles.primaryButton} onPress={handleTextSearch}>
            <Text style={styles.buttonText}>Search Medicine</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.dividerContainer}>
          <View style={styles.line} />
          <Text style={styles.dividerText}>OR SCAN PRESCRIPTION</Text>
          <View style={styles.line} />
        </View>

        {/* UPLOAD BUTTONS SECTION */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => handleImageUpload(true)}>
            <Text style={styles.secondaryButtonText}>📸 Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => handleImageUpload(false)}>
            <Text style={styles.secondaryButtonText}>🖼️ Gallery</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity style={styles.tertiaryButton} onPress={handleDocumentUpload}>
          <Text style={styles.tertiaryButtonText}>📄 Upload PDF Document</Text>
        </TouchableOpacity>

      </KeyboardAvoidingView>

      {/* LOADING OVERLAY */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            {/* Changed spinner color to iOS Blue */}
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Analyzing...</Text>
            <Text style={styles.loadingSubtext}>Cross-checking with generic databases</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

// --- "APPLE HEALTH" STYLES ---
const styles = StyleSheet.create({
  // Background matches iOS Settings/Health app
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  innerContainer: { flex: 1, padding: 24, justifyContent: 'center' },
  
  header: { marginBottom: 32, alignItems: 'center' },
  title: { fontSize: 34, fontWeight: '800', color: '#1C1C1E', marginBottom: 8, letterSpacing: -0.5 },
  subtitle: { fontSize: 16, color: '#8E8E93', fontWeight: '500' },
  
  // Floating White Card for input
  inputContainer: { 
    backgroundColor: '#FFFFFF', 
    borderRadius: 20, 
    padding: 20, 
    shadowColor: '#000000', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.06, 
    shadowRadius: 12, 
    elevation: 4, 
    marginBottom: 24 
  },
  // Gray inset area for typing (iOS standard)
  textInput: { 
    backgroundColor: '#F2F2F7', 
    borderRadius: 14, 
    padding: 16, 
    fontSize: 17, 
    minHeight: 110, 
    textAlignVertical: 'top', 
    color: '#1C1C1E', 
    marginBottom: 16 
  },
  
  // Apple Medical Blue Button
  primaryButton: { 
    backgroundColor: '#007AFF', 
    borderRadius: 14, 
    paddingVertical: 16, 
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700', letterSpacing: 0.3 },
  
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  line: { flex: 1, height: 1, backgroundColor: '#E5E5EA' },
  dividerText: { marginHorizontal: 16, color: '#8E8E93', fontSize: 13, fontWeight: '600', letterSpacing: 0.5 },
  
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  
  // Secondary action buttons (floating white with blue text)
  secondaryButton: { 
    flex: 0.48, 
    backgroundColor: '#FFFFFF', 
    borderRadius: 16, 
    paddingVertical: 16, 
    alignItems: 'center',
    shadowColor: '#000000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 8, 
    elevation: 2,
  },
  secondaryButtonText: { color: '#007AFF', fontSize: 16, fontWeight: '600' },
  
  tertiaryButton: { 
    backgroundColor: '#FFFFFF', 
    borderRadius: 16, 
    paddingVertical: 16, 
    alignItems: 'center',
    shadowColor: '#000000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 8, 
    elevation: 2,
  },
  tertiaryButtonText: { color: '#007AFF', fontSize: 16, fontWeight: '600' },
  
  // Glassmorphism/Translucent overlay for loading
  loadingOverlay: { 
    ...StyleSheet.absoluteFillObject, 
    backgroundColor: 'rgba(0,0,0,0.4)', 
    justifyContent: 'center', 
    alignItems: 'center', 
    zIndex: 1000 
  },
  loadingCard: { 
    backgroundColor: '#FFFFFF', 
    padding: 32, 
    borderRadius: 24, 
    alignItems: 'center', 
    width: '80%',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10
  },
  loadingText: { marginTop: 20, fontSize: 19, fontWeight: '700', color: '#1C1C1E', letterSpacing: -0.5 },
  loadingSubtext: { marginTop: 8, fontSize: 15, color: '#8E8E93', textAlign: 'center', lineHeight: 22 }
});