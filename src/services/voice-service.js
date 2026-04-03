/**
 * @module voice-service
 * @description Wraps the Web Speech API (SpeechRecognition + SpeechSynthesis).
 */

import { updateTranscript, setListeningState } from '../render/voice-overlay-renderer.js';

/** @type {SpeechRecognition|null} */
let _recognition = null;
let _onFinalCallback = null;

export const voiceService = {
  /**
   * Returns true if SpeechRecognition is available in this browser.
   * @returns {boolean}
   */
  get isSupported() {
    return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
  },

  /**
   * Starts continuous speech recognition.
   * @param {(interim: string) => void} onInterim - Called with each interim result
   * @param {(final: string) => void}   onFinal   - Called when recognition ends with a final result
   */
  start(onInterim, onFinal) {
    if (!this.isSupported) {
      console.warn('[voiceService] SpeechRecognition not supported in this browser.');
      return;
    }
    this.stop();

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    _recognition = new SpeechRecognition();
    _recognition.continuous = true;
    _recognition.interimResults = true;
    _recognition.lang = 'en-US';
    _onFinalCallback = onFinal;

    _recognition.onresult = (event) => {
      let interim = '';
      let final   = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += transcript;
        else interim += transcript;
      }

      if (interim) {
        onInterim(interim);
        updateTranscript(interim, '');
      }
      if (final) {
        updateTranscript('', final);
        onFinal(final);
      }
    };

    _recognition.onstart = () => setListeningState(true);
    _recognition.onend   = () => setListeningState(false);
    _recognition.onerror = (e) => {
      console.error('[voiceService] Error:', e.error);
      setListeningState(false);
    };

    _recognition.start();
  },

  /**
   * Stops recognition.
   */
  stop() {
    if (_recognition) {
      _recognition.stop();
      _recognition = null;
    }
    setListeningState(false);
  },

  /**
   * Speaks text aloud using SpeechSynthesis.
   * @param {string} text
   * @param {Object} [options]
   * @param {string} [options.voice]  - Voice name preference
   * @param {number} [options.rate=1]
   * @param {number} [options.pitch=1]
   */
  speak(text, { voice, rate = 1, pitch = 1 } = {}) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate  = rate;
    utterance.pitch = pitch;

    if (voice) {
      const voices = window.speechSynthesis.getVoices();
      const match  = voices.find(v => v.name === voice);
      if (match) utterance.voice = match;
    }

    window.speechSynthesis.speak(utterance);
  },
};
