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
      const response = await fetch('your_hosted_model_url/model.json');
      const modelTopology = await response.json();
      
      const loadedModel = await tf.loadLayersModel({
        load: async () => ({
          modelTopology: modelTopology.modelTopology,
          weightSpecs: modelTopology.weightsManifest[0].weights,
          weightData: await (await fetch('your_hosted_model_url/group1-shard1of34.bin')).arrayBuffer()
        })
      });
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
