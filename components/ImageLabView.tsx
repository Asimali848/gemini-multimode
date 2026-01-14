
import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { GeneratedImage } from '../types';
import { MODELS, Icons } from '../constants';

const ImageLabView: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [images, setImages] = useState<GeneratedImage[]>([]);

  const generateImage = async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const response = await ai.models.generateContent({
        model: MODELS.IMAGE,
        contents: {
          parts: [{ text: prompt }]
        },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio as any
          }
        }
      });

      let imageUrl = '';
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }

      if (imageUrl) {
        const newImg: GeneratedImage = {
          id: Date.now().toString(),
          url: imageUrl,
          prompt: prompt,
          aspectRatio: aspectRatio,
          timestamp: Date.now()
        };
        setImages(prev => [newImg, ...prev]);
        setPrompt('');
      }
    } catch (error) {
      console.error('Image generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = (url: string, id: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `gemini-gen-${id}.png`;
    link.click();
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <header className="mb-6">
        <h2 className="text-2xl font-bold text-white">Image Lab</h2>
        <p className="text-slate-400 text-sm">Create stunning visuals with Gemini 2.5 Flash Image</p>
      </header>

      <div className="flex flex-col lg:flex-row gap-8 overflow-hidden">
        {/* Controls Sidebar */}
        <div className="w-full lg:w-80 space-y-6">
          <div className="glass p-5 rounded-2xl space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-slate-300 mb-2 block">Prompt</span>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe what you want to see..."
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent min-h-[120px] transition-all"
              />
            </label>

            <div>
              <span className="text-sm font-medium text-slate-300 mb-3 block">Aspect Ratio</span>
              <div className="grid grid-cols-3 gap-2">
                {['1:1', '4:3', '3:4', '16:9', '9:16'].map((ratio) => (
                  <button
                    key={ratio}
                    onClick={() => setAspectRatio(ratio)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      aspectRatio === ratio
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={generateImage}
              disabled={!prompt.trim() || isGenerating}
              className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                prompt.trim() && !isGenerating
                  ? 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white shadow-xl shadow-indigo-500/20 active:scale-95'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              {isGenerating ? (
                <>
                  <i className="fa-solid fa-spinner animate-spin"></i>
                  Generating...
                </>
              ) : (
                <>
                  <Icons.Image />
                  Generate
                </>
              )}
            </button>
          </div>

          <div className="glass p-5 rounded-2xl">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Tips</h3>
            <ul className="text-xs space-y-2 text-slate-400">
              <li className="flex gap-2">
                <span className="text-indigo-400">•</span>
                Use descriptive adjectives (e.g., "cinematic", "vibrant", "minimalist").
              </li>
              <li className="flex gap-2">
                <span className="text-indigo-400">•</span>
                Mention lighting (e.g., "golden hour", "neon glow").
              </li>
              <li className="flex gap-2">
                <span className="text-indigo-400">•</span>
                Specify the style (e.g., "oil painting", "digital 3D render").
              </li>
            </ul>
          </div>
        </div>

        {/* Gallery Area */}
        <div className="flex-1 glass rounded-2xl overflow-hidden flex flex-col border border-slate-800">
          <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/30">
            <h3 className="font-semibold flex items-center gap-2">
              <Icons.History />
              Recent Creations
            </h3>
            <span className="text-xs text-slate-500">{images.length} images generated</span>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
            {images.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                <i className="fa-solid fa-images text-6xl mb-4"></i>
                <p className="text-lg">Your generated images will appear here</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {images.map((img) => (
                  <div key={img.id} className="group relative glass rounded-xl overflow-hidden border border-slate-800 transition-all hover:border-indigo-500/50">
                    <img 
                      src={img.url} 
                      alt={img.prompt} 
                      className="w-full h-auto object-cover aspect-square md:aspect-auto"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                      <p className="text-xs text-slate-300 line-clamp-2 mb-3 bg-slate-900/80 p-2 rounded-lg backdrop-blur-sm">
                        {img.prompt}
                      </p>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => downloadImage(img.url, img.id)}
                          className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2"
                        >
                          <Icons.Download /> Download
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageLabView;
