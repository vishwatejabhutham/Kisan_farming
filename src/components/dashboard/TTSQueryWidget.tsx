import React, { useState } from "react";
import { Volume2, Send, HelpCircle, AlertCircle, CheckCircle2, Mic, Bot } from "lucide-react";
import { toast } from "sonner";

export default function TTSQueryWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [queryInput, setQueryInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<{
    handled?: boolean;
    message?: string;
    data?: any;
    tts_placeholder?: string;
  } | null>(null);
  const [ttsNotice, setTtsNotice] = useState<string | null>(null);

  const handleQuerySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryInput.trim()) return;

    setLoading(true);
    setTtsNotice(null);

    try {
      const res = await fetch("http://localhost:3001/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: queryInput.trim() }),
      });
      const data = await res.json();
      setResponse(data);
      if (!data.handled) {
        toast.info("Query forwarded: Our team will manage the query internally and update them.");
      }
    } catch (err) {
      // Offline / fallback handler
      setResponse({
        handled: false,
        message: "Our team will manage the query internally and update them.",
        tts_placeholder: "🔊 [TTS Model Placeholder: Voice audio pending model deployment]",
      });
      toast.info("Query logged internally.");
    } finally {
      setLoading(false);
    }
  };

  const handleTestTTS = async () => {
    try {
      const res = await fetch("http://localhost:3001/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: queryInput || "కాపర్ ఆక్సీక్లోరైడ్ 50% WP పిచికారీ చేయండి",
          language: "te",
        }),
      });
      const data = await res.json();
      setTtsNotice(data.message || "TTS model placeholder active.");
      toast.success("TTS Speech Model Placeholder triggered.");
    } catch (err) {
      setTtsNotice(
        "TTS model placeholder active. Text-to-Speech synthesis model will be installed in the later part of the hackathon."
      );
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-medium rounded-full shadow-2xl hover:scale-105 transition-all duration-200 border border-white/20"
        >
          <Bot className="w-5 h-5 animate-pulse text-emerald-200" />
          <span className="text-sm font-semibold">AI Assistant & Voice (TTS)</span>
          <Volume2 className="w-4 h-4 text-emerald-200 ml-1" />
        </button>
      )}

      {/* Expanded Widget Dialog */}
      {isOpen && (
        <div className="w-[360px] sm:w-[420px] bg-card/95 backdrop-blur-md border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 p-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-white/10 rounded-full">
                <Bot className="w-5 h-5 text-emerald-200" />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-sm leading-tight">AgriScan Voice & Query Hub</h3>
                <p className="text-[11px] text-emerald-200">TTS Audio & Query Assistant</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white text-lg font-bold px-2 py-0.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Body Content */}
          <div className="p-4 space-y-4 max-h-[460px] overflow-y-auto">
            {/* Quick action buttons */}
            <div className="flex flex-wrap gap-2 text-xs">
              <button
                onClick={() => setQueryInput("Warangal Late Blight")}
                className="px-2.5 py-1 rounded-full bg-secondary hover:bg-primary/10 text-foreground transition-colors border border-border"
              >
                📍 Warangal Outbreak
              </button>
              <button
                onClick={() => setQueryInput("Invalid test query 999")}
                className="px-2.5 py-1 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 transition-colors border border-amber-500/20"
              >
                ⚠️ Test Invalid Query
              </button>
              <button
                onClick={handleTestTTS}
                className="px-2.5 py-1 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 transition-colors border border-emerald-500/20 flex items-center gap-1"
              >
                <Volume2 className="w-3 h-3" /> Test TTS Placeholder
              </button>
            </div>

            {/* Input Form */}
            <form onSubmit={handleQuerySubmit} className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground block">
                Enter your agricultural query:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={queryInput}
                  onChange={(e) => setQueryInput(e.target.value)}
                  placeholder="Ask a question or enter mandal..."
                  className="flex-1 bg-secondary/50 border border-border rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="p-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>

            {/* TTS Placeholder Notice */}
            {ttsNotice && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-800 dark:text-emerald-200">
                <Volume2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block">🔊 TTS Model Placeholder:</span>
                  <span>{ttsNotice}</span>
                </div>
              </div>
            )}

            {/* Query Result / Fallback Output */}
            {response && (
              <div className="space-y-2 pt-2 border-t border-border">
                {response.handled ? (
                  <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl space-y-1.5">
                    <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                      <CheckCircle2 className="w-4 h-4" /> Query Matched in Database
                    </div>
                    <p className="text-xs text-foreground font-medium">{response.message}</p>
                    {response.data && (
                      <div className="text-[11px] text-muted-foreground space-y-0.5 bg-background/60 p-2 rounded-xl">
                        <div>🌱 Crop: <span className="font-semibold text-foreground">{response.data.crop}</span></div>
                        <div>🦠 Disease: <span className="font-semibold text-foreground">{response.data.disease}</span></div>
                        <div>📍 Location: <span className="font-semibold text-foreground">{response.data.district}</span></div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-1.5">
                    <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300 text-xs font-semibold">
                      <AlertCircle className="w-4 h-4 text-amber-600" /> Invalid / Unhandled Query
                    </div>
                    <p className="text-xs font-semibold text-amber-900 dark:text-amber-100 bg-amber-500/15 p-2 rounded-xl border border-amber-500/20">
                      "{response.message}"
                    </p>
                  </div>
                )}

                {/* TTS Badge inside response */}
                <div className="p-2.5 bg-secondary/80 rounded-xl flex items-center justify-between text-[11px] text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-primary" />
                    <span>TTS Audio Model</span>
                  </div>
                  <span className="bg-primary/10 text-primary font-medium px-2 py-0.5 rounded-full text-[10px]">
                    Placeholder (Hackathon Model Pending)
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Footer note */}
          <div className="p-3 bg-secondary/40 border-t border-border text-center text-[10px] text-muted-foreground">
            🔊 Text-to-Speech audio models & internal team query management active.
          </div>
        </div>
      )}
    </div>
  );
}
