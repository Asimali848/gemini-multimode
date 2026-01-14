
import React from 'react';

export const MODELS = {
  CHAT: 'gemini-3-flash-preview',
  IMAGE: 'gemini-2.5-flash-image',
  LIVE: 'gemini-2.5-flash-native-audio-preview-12-2025'
};

export const Icons = {
  Chat: () => <i className="fa-solid fa-comments"></i>,
  Image: () => <i className="fa-solid fa-wand-magic-sparkles"></i>,
  Live: () => <i className="fa-solid fa-microphone-lines"></i>,
  Search: () => <i className="fa-solid fa-magnifying-glass"></i>,
  History: () => <i className="fa-solid fa-clock-rotate-left"></i>,
  Settings: () => <i className="fa-solid fa-sliders"></i>,
  Send: () => <i className="fa-solid fa-paper-plane"></i>,
  Trash: () => <i className="fa-solid fa-trash-can"></i>,
  Download: () => <i className="fa-solid fa-download"></i>,
  Stop: () => <i className="fa-solid fa-circle-stop"></i>,
  Sparkle: () => <i className="fa-solid fa-sparkles"></i>
};
