async function transcribeAudio(fileUri: string): Promise<string> {
  try {
    console.log("🔧 Transcribing audio from:", fileUri);

    // Create form data for the API request
    const formData = new FormData();

    // Create a blob from the file URI
    const audioBlob = {
      uri: fileUri,
      type: "audio/m4a",
      name: "speech.m4a",
    };

    formData.append("file", audioBlob as any);
    formData.append("model", "whisper-1");

    console.log("🔧 Sending request to OpenAI...");

    const response = await fetch(
      "https://api.openai.com/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer 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`,
          "Content-Type": "multipart/form-data",
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `API Error: ${errorData.error?.message || response.statusText}`
      );
    }

    const data = await response.json();
    console.log("✅ Transcription response:", data);
    return data.text;
  } catch (error) {
    console.error("❌ Transcription error:", error);
    throw new Error(`Transcription failed: ${error}`);
  }
}

export { transcribeAudio };
