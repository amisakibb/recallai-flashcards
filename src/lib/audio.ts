// Audio player utility for base64 audio strings returned by Gemini TTS or browser synthesis
let currentAudio: HTMLAudioElement | null = null;

export function playBase64PcmAudio(base64Audio: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
      }

      // Convert base64 to blob
      const binaryString = atob(base64Audio);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Gemini TTS returns WAV/audio audio
      const blob = new Blob([bytes], { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(blob);

      const audio = new Audio(audioUrl);
      currentAudio = audio;

      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        currentAudio = null;
        resolve();
      };

      audio.onerror = (e) => {
        URL.revokeObjectURL(audioUrl);
        currentAudio = null;
        reject(e);
      };

      audio.play().catch(reject);
    } catch (err) {
      reject(err);
    }
  });
}

// Fallback native speech synthesis if server tts fails or offline
export function speakNative(text: string, lang = 'en-US'): Promise<void> {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) {
      resolve();
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.95;
    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();
    window.speechSynthesis.speak(utterance);
  });
}
