import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, Text, View, Button, Image, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native'; // Essential for mobile
import * as ImagePicker from 'expo-image-picker';

export default function App() {
  const [imageUri, setImageUri] = useState(null);
  const [model, setModel] = useState(null);
  const [prediction, setPrediction] = useState("");
  const [confidence, setConfidence] = useState("");
  const [isTfReady, setIsTfReady] = useState(false);
  const [error, setError] = useState(null);

  // 1. Initialize TensorFlow
  useEffect(() => {
    async function setup() {
      try {
        await tf.ready();
        setIsTfReady(true);
        // Load model here if desired, or use a separate effect
        const loadedModel = await loadModel();
        setModel(loadedModel);
      } catch (e) {
        setError("TF Setup Error: " + e.message);
      }
    }
    setup();
  }, []);

  // 2. Load Model Function (Inside the component)
  async function loadModel() {
    try {
      // For mobile, you usually bundle the model in assets
      // This fetch strategy works better for Web; for Mobile use:
      // await tf.loadLayersModel(bundleResourceIO(modelJson, modelWeights))
    // 1. Use the PUBLIC URL to your GitHub Pages or Drive Direct Link
    const modelUrl = 'https://blubb123456.github.io/ProjectLightHouseApp/model/model.json';
    
    // 2. Simply pass the URL to loadLayersModel
    // TensorFlow is smart enough to look for the .bin shards in that same folder!
    const loadedModel = await tf.loadLayersModel(modelUrl);
      
      const loadedModel = await tf.loadLayersModel({
      console.log("Model loaded successfully from remote URL!");
      return loadedModel;
    } catch (err) {
      setError("Model Load Error: " + err.message);
    }
  }

  // 3. Image Picker (Mobile style)
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  // 4. Prediction Logic
  const predict = async () => {
    if (!model || !imageUri) return;
    
    try {
      setPrediction("Analyzing...");
      // Logic to convert imageUri to tensor goes here
      // For mobile: use decodeJpeg from tfjs-react-native
      setPrediction("Success");
      setConfidence("95%");
    } catch (e) {
      setPrediction("Inference Error: " + e.message);
    }
  };

  // --- RENDERING ---
  if (error) return <View style={styles.container}><Text style={{color:'red'}}>{error}</Text></View>;
  if (!isTfReady) return <View style={styles.container}><ActivityIndicator /><Text>Loading AI...</Text></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Project Lighthouse</Text>
      
      {imageUri && <Image source={{ uri: imageUri }} style={styles.image} />}
      
      <Button title="Select Image" onPress={pickImage} />
      
      {imageUri && <Button title="Run AI Detection" onPress={predict} color="red" />}
      
      <Text style={styles.resultText}>
        Result: {prediction} {confidence}
      </Text>
      
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  title: { fontSize: 20, marginBottom: 20, fontWeight: 'bold' },
  image: { width: 250, height: 250, marginBottom: 20, borderRadius: 10 },
  resultText: { marginTop: 20, fontSize: 16 }
});
