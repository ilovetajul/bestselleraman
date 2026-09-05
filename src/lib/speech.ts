// Thin wrapper around the Web Speech API. Degrades gracefully when unsupported.

type SpeechRecognitionResultHandler = (transcript: string) => void;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getRecognitionCtor(): any {
  if (typeof window === 'undefined') return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
}

export function isSpeechRecognitionSupported(): boolean {
  return !!getRecognitionCtor();
}

export function isTextToSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function speak(text: string, lang: 'en-US' | 'bn-BD' = 'en-US'): void {
  if (!isTextToSpeechSupported()) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.95;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  } catch {
    // ignore — degrade silently
  }
}

let activeRecognition: any = null; // eslint-disable-line @typescript-eslint/no-explicit-any

export function startListening(
  onResult: SpeechRecognitionResultHandler,
  onEnd?: () => void,
  onError?: (errorCode?: string) => void
): boolean {
  const Ctor = getRecognitionCtor();
  if (!Ctor) return false;

  try {
    const recognition = new Ctor();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript ?? '';
      onResult(transcript);
    };
    recognition.onerror = (event: any) => {
      onError?.(event?.error);
    };
    recognition.onend = () => {
      onEnd?.();
    };

    recognition.start();
    activeRecognition = recognition;
    return true;
  } catch {
    return false;
  }
}

export function stopListening(): void {
  try {
    activeRecognition?.stop();
  } catch {
    // ignore
  }
  activeRecognition = null;
}
