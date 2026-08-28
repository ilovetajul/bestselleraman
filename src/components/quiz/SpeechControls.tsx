import React, { useState } from 'react';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import {
  isSpeechRecognitionSupported,
  isTextToSpeechSupported,
  speak,
  startListening,
  stopListening,
} from '../../lib/speech';

interface SpeechControlsProps {
  onTranscript: (text: string) => void;
  speakText: string;
  speakLang?: 'en-US' | 'bn-BD';
}

export const SpeechControls: React.FC<SpeechControlsProps> = ({
  onTranscript,
  speakText,
  speakLang = 'en-US',
}) => {
  const [listening, setListening] = useState(false);
  const micSupported = isSpeechRecognitionSupported();
  const ttsSupported = isTextToSpeechSupported();

  const handleMicClick = () => {
    if (listening) {
      stopListening();
      setListening(false);
      return;
    }
    const started = startListening(
      (transcript) => {
        onTranscript(transcript);
        setListening(false);
      },
      () => setListening(false),
      () => setListening(false)
    );
    if (started) setListening(true);
  };

  return (
    <div className="flex items-center gap-2">
      {micSupported && (
        <button
          type="button"
          onClick={handleMicClick}
          aria-label={listening ? 'Stop listening' : 'Speak your answer'}
          className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
            listening
              ? 'bg-rose-500 text-white border-rose-500 animate-pulse'
              : 'border-black/10 dark:border-white/15 text-ink/65 dark:text-white/65 hover:bg-black/5 dark:hover:bg-white/10'
          }`}
        >
          {listening ? <MicOff size={13} /> : <Mic size={13} />}
          {listening ? 'Listening…' : 'Speak Answer'}
        </button>
      )}
      {ttsSupported && (
        <button
          type="button"
          onClick={() => speak(speakText, speakLang)}
          aria-label="Listen to pronunciation"
          className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border border-black/10 dark:border-white/15 text-ink/65 dark:text-white/65 hover:bg-black/5 dark:hover:bg-white/10"
        >
          <Volume2 size={13} />
          Listen
        </button>
      )}
    </div>
  );
};
