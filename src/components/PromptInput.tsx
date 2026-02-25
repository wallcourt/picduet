"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface PromptInputProps {
  onSubmit: (prompt: string, enhance: boolean) => void;
  loading: boolean;
  defaultPrompt?: string;
  refinementSource?: string | null;
  onClearRefinement?: () => void;
  uploadedImages?: string[];
  onUploadImage?: (dataUrl: string) => void;
  onRemoveImage?: (index: number) => void;
  enhance?: boolean;
  onToggleEnhance?: () => void;
}

export default function PromptInput({
  onSubmit,
  loading,
  defaultPrompt = "",
  refinementSource,
  onClearRefinement,
  uploadedImages = [],
  onUploadImage,
  onRemoveImage,
  enhance = false,
  onToggleEnhance,
}: PromptInputProps) {
  const [prompt, setPrompt] = useState(defaultPrompt);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPrompt(defaultPrompt);
  }, [defaultPrompt]);

  const autoResize = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    const maxHeight = 4 * 28;
    ta.style.height = Math.min(ta.scrollHeight, maxHeight) + "px";
  }, []);

  useEffect(() => {
    autoResize();
  }, [prompt, autoResize]);

  // Focus textarea when refinement starts
  useEffect(() => {
    if (refinementSource) {
      textareaRef.current?.focus();
    }
  }, [refinementSource]);

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!prompt.trim() || loading) return;
    onSubmit(prompt.trim(), enhance);
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !onUploadImage) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("Image must be under 10MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onUploadImage(reader.result);
      }
    };
    reader.readAsDataURL(file);

    e.target.value = "";
  }

  const hasContext = refinementSource || uploadedImages.length > 0;

  return (
    <div className="w-full">
      {/* Context preview row */}
      {hasContext && (
        <div className="mb-3 flex items-center gap-3 px-1">
          {refinementSource && (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={refinementSource}
                alt="Refinement source"
                className="h-16 w-16 rounded-lg border border-border object-cover"
              />
              {onClearRefinement && (
                <button
                  onClick={onClearRefinement}
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-surface-hover text-muted hover:text-foreground"
                >
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          )}
          {uploadedImages.map((img, i) => (
            <div key={i} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img}
                alt={`Upload ${i + 1}`}
                className="h-16 w-16 rounded-lg border border-border object-cover"
              />
              {onRemoveImage && (
                <button
                  onClick={() => onRemoveImage(i)}
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-surface-hover text-muted hover:text-foreground"
                >
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Input container */}
      <div className="rounded-2xl border border-border bg-surface">
        <div className="flex items-end gap-3 px-4 py-3">
          {/* Paperclip upload button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-tertiary transition-colors hover:text-muted"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13"
              />
            </svg>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={refinementSource ? "What would you like to change?" : "Describe the image you want to generate..."}
            rows={1}
            className="max-h-32 min-h-[44px] flex-1 resize-none bg-transparent py-2 text-base text-foreground placeholder-tertiary focus:outline-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />

          {/* Enhance toggle */}
          {onToggleEnhance && (
            <button
              type="button"
              onClick={onToggleEnhance}
              className={`flex shrink-0 self-center items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                enhance
                  ? "bg-accent/15 text-accent"
                  : "bg-surface-hover text-tertiary hover:text-muted"
              }`}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
              </svg>
              Enhance
            </button>
          )}

          {/* Send button */}
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={loading || !prompt.trim()}
            className="mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-text transition-opacity disabled:opacity-30"
          >
            {loading ? (
              <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
