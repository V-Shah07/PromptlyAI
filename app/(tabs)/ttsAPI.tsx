async function transcribeAudio(fileUri: string): Promise<string> {
  try {
    console.log("🔧 Transcribing audio from:", fileUri);

    // Get API key from environment variable
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable is not set");
    }

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
          Authorization: `Bearer ${apiKey}`,
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
