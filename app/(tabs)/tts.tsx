import { Audio } from "expo-av";
import { useEffect, useState } from "react";
import { Alert, Button, Text, View } from "react-native";
import { transcribeAudio } from "./ttsAPI";

export default function WhisperSTT() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [recording, setRecording] = useState<Audio.Recording | null>(null);

  useEffect(() => {
    // Request permissions when component mounts
    const requestPermissions = async () => {
      try {
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Permission Required",
            "Microphone permission is required for recording"
          );
        }
      } catch (error) {
        console.error("Permission request error:", error);
      }
    };

    requestPermissions();
  }, []);

  const startRecording = async () => {
    try {
      console.log("🔧 Starting recording...");

      // Set audio mode for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Create a new recording
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setIsRecording(true);
      console.log("✅ Started recording");
    } catch (err) {
      console.error("❌ Start recording error:", err);
      Alert.alert(
        "Error",
        "Failed to start recording: " + (err as Error).message
      );
    }
  };

  const stopRecording = async () => {
    if (!recording || !isRecording) return;

    try {
      console.log("🔧 Stopping recording...");

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();

      setIsRecording(false);
      setRecording(null);

      if (!uri) {
        throw new Error("No recording URI found");
      }

      console.log("✅ Recorded file:", uri);
      setTranscript("Transcribing...");

      const text = await transcribeAudio(uri);
      console.log("✅ Transcription result:", text);
      setTranscript(text || "No transcription received");
    } catch (err) {
      console.error("❌ Stop recording error:", err);
      setTranscript("Error: " + (err as Error).message);
    }
  };

  return (
    <View
      style={{
        flex: 1,
        padding: 20,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f5f5f5",
      }}
    >
      <Text
        style={{
          fontSize: 24,
          fontWeight: "bold",
          marginBottom: 30,
          textAlign: "center",
        }}
      >
        Speech to Text
      </Text>

      <Button
        title={isRecording ? "Stop Recording" : "Start Recording"}
        onPress={isRecording ? stopRecording : startRecording}
      />

      <Text
        style={{
          marginTop: 30,
          fontSize: 16,
          textAlign: "center",
          minHeight: 50,
          padding: 10,
          backgroundColor: "white",
          borderRadius: 8,
          width: "100%",
        }}
      >
        Transcript: {transcript}
      </Text>
    </View>
  );
}
