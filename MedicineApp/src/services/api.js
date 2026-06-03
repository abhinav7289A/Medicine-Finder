// src/services/api.js

// 🚨 IMPORTANT: Replace this IP with your laptop's actual IPv4 address!
// Do NOT use 'localhost' or '127.0.0.1' because the phone emulator will look for the server on the phone itself.
// Example: 'http://192.168.1.5:8000'
const BASE_URL = 'https://xielonmask-generic-medicine-backend.hf.space';

/**
 * Sends a text-based medicine query to the Pinecone/FastAPI backend.
 * @param {string} queryText - The medicine name or list (e.g., "Dolo 650").
 * @returns {Promise<Object>} The verified generic alternatives.
 */
export const searchMedicineText = async (queryText) => {
  try {
    const response = await fetch(`${BASE_URL}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: queryText }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to fetch generic medicine.');
    }

    return await response.json();
  } catch (error) {
    console.error('API Error (Text Search):', error);
    throw error;
  }
};

/**
 * Uploads an image (prescription or strip) to the Gemini Vision OCR endpoint.
 * @param {Object} imageFile - The image object from expo-image-picker.
 * @returns {Promise<Object>} The parsed batch of medicines and verifications.
 */
export const searchMedicineFromImage = async (imageFile) => {
  try {
    // We must use FormData to send files over HTTP in React Native
    const formData = new FormData();
    
    // expo-image-picker returns the file path in 'uri'
    // We construct a file object that the Python backend can read
    formData.append('file', {
      uri: imageFile.uri,
      name: imageFile.fileName || 'prescription.jpg',
      // Ensure we send the correct mime type, defaulting to jpeg
      type: imageFile.mimeType || 'image/jpeg', 
    });

    const response = await fetch(`${BASE_URL}/vision-search`, {
      method: 'POST',
      headers: {
        // Note: Do NOT manually set 'Content-Type': 'multipart/form-data' here.
        // React Native's fetch automatically sets the correct boundary headers when it sees FormData.
        'Accept': 'application/json',
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to process the image.');
    }

    return await response.json();
  } catch (error) {
    console.error('API Error (Vision Search):', error);
    throw error;
  }
};