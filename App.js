import '@tensorflow/tfjs-react-native';
import * as tf from '@tensorflow/tfjs';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View,  Component } from 'react-native';
import { Button, Image } from 'react-native'
import React, { useEffect,useState, useRef } from 'react';
import * as ImagePicker from 'expo-image-picker';

export default function App() {
  const [image, setImage] = useState(null); 
 const [confidence,  setConfidence] = useState("");
const [model, setModel] = useState(null);
const [prediction, setPrediction] = useState("");
const test = "bnlamodwf";
const predictionTextResult = prediction;
const confidenceTextResult = confidence;
  const imageRef = useRef(null); // Reference to the <img> tag
const [error, setError] = useState(null);
  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Create a URL for the image and set it to the <img> source
      imageRef.current.src = URL.createObjectURL(file);
      imageRef.current.onload = () => predict(imageRef.current);
    }
  };
  useEffect(() => {
    async function setup() {
      try {
        await tf.ready();
        // load your model here
      } catch (e) {
        setError(e.message); // This will show the error on the screen instead of crashing
      }
    }
    setup();
  }, []);

  if (error) {
    return <Text style={{marginTop: 50, color: 'red'}}>Error: {error}</Text>;
  }

  return <YourNormalAppConfig />;
}
useEffect(() => {
  let model;
  async function loadModel() {
  try {
    // 1. Fetch JSON explicitly as text first
    const response = await fetch('/model.json');
    const jsonText = await response.text();
    
    // 2. Parse it manually
    const modelTopology = JSON.parse(jsonText);
    
    // 3. Load using the parsed object directly
    const model = await tf.loadLayersModel({
      load: async () => ({
        modelTopology: modelTopology.modelTopology,
        weightSpecs: modelTopology.weightsManifest[0].weights,
        weightData: await (await fetch('/group1-shard.bin')).arrayBuffer() 
        // Note: For multi-shard models, you'd need to loop and concatenate these buffers
      })
    });
    console.log("Model successfully stored in state:", loadModel); // Add this
    console.log("Model successfully manually loaded!");
    setModel(model);
    return model;
  } catch (err) {
    console.error("Manual Load Failed:", err);
  }
}

loadModel();
}, []);
    const pickImage = async () => {
      // No permissions request is necessary for launching the image library
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'], // Restrict to images only
        allowsEditing: false,    // Doesn't Allow cropping/rotating
        aspect: [4, 3],         // Crop aspect ratio
        quality: 1,             // Highest quality (0 to 1)
      });
  
      if (!result.canceled) {
        setImage(result.assets[0].uri);
      }
    };
    
const predict = async (imageElement) => {
    // 1. Check if model exists (Assuming 'model' is loaded elsewhere)
    console.log("Predict function started"); // Log 1
    console.log("Current model state in predict:", model); // Check what this prints
    if (!model) {
      setPrediction("Error: Model not loaded.");
      console.log("Model is missing"); // Log 2
      return;
    }
if (!imageElement) {
        console.log("Image element is missing or null"); // Log 3
        return;
    }
    try {
      // 2. Browser-compatible preprocessing
      const tensor = tf.browser.fromPixels(imageElement)
        .resizeNearestNeighbor([200, 200])
        .expandDims(0)
        .toFloat()
        .div(255.0);

      // 3. Inference
      const prediction = model.predict(tensor);
      const clearVal = (await prediction.data())[0];
      
      const predictionResult = clearVal < 0.5 ? "AI Generated" : "Real";
      const confidence = (clearVal < 0.5 ? (1.0 - clearVal) : clearVal) * 100;

      // Now your log will actually show up!
      console.log(`Prediction: ${predictionResult} (Value: ${clearVal})`);
      
      setPrediction(`${predictionResult}`);
      setConfidence(`${confidence.toFixed(2)}% confidence`);
      
    } catch (e) {
      setPrediction(`Error processing image: ${e.message}`);
    }
    console.log("Call");
    
  };
  console.log(`${predictionTextResult}`);
  console.log(`${confidenceTextResult}`);
  return (
    
    <View style={styles.container}>
    
      <Text>Open up App.js to start working on your app!</Text>
  
      <Button color = "red" title="Please select a image to scan" onPress={pickImage}/>
      <input type="file" style={styles.imageButton} onChange={handleImageChange} />
      <img ref={imageRef} alt="Upload Preview" style={{ width: 200, height: 200 }} />
      <Button title="Predict" onPress= {() => predict(imageRef.current)}/>
      <Text>This image is: {`${predictionTextResult}`} with a score of {`${confidenceTextResult}`}</Text>
      <StatusBar style="auto" />
    </View>
    
  );
  
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  image: { width: 200, height: 200, marginTop: 20 },
  imageButton:{width:200,height:100, borderColor:'red'},
});
async function loadModel() {
  try {
    // 1. Fetch JSON explicitly as text first
    const response = await fetch('/model.json');
    const jsonText = await response.text();
    
    // 2. Parse it manually
    const modelTopology = JSON.parse(jsonText);
    
    // 3. Load using the parsed object directly
    const model = await tf.loadLayersModel({
      load: async () => ({
        modelTopology: modelTopology.modelTopology,
        weightSpecs: modelTopology.weightsManifest[0].weights,
        weightData: await (await fetch('/group1-shard1of34.bin')).arrayBuffer() 
        // Note: For multi-shard models, you'd need to loop and concatenate these buffers
      })
    });
    
    console.log("Model successfully manually loaded!");
    return model;
  } catch (err) {
    console.error("Manual Load Failed:", err);
  }
}
