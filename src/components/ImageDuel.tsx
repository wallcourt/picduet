"use client";

import ImageCard from "./ImageCard";
import { DEFAULT_IMAGE_MODELS } from "@/lib/models";

interface ImageDuelProps {
  imageA: string | null;
  imageB: string | null;
  errorA?: string;
  errorB?: string;
  modelA: string;
  modelB: string;
  loading: boolean;
  selectedWinner: "a" | "b" | null;
  onSelectWinner: (winner: "a" | "b") => void;
  onModelAChange: (modelId: string) => void;
  onModelBChange: (modelId: string) => void;
  revealed?: boolean;
}

function getModelName(modelId: string): string {
  const model = DEFAULT_IMAGE_MODELS.find((m) => m.id === modelId);
  return model?.name || modelId.split("/").pop() || modelId;
}

export default function ImageDuel({
  imageA,
  imageB,
  errorA,
  errorB,
  modelA,
  modelB,
  loading,
  selectedWinner,
  onSelectWinner,
  onModelAChange,
  onModelBChange,
  revealed,
}: ImageDuelProps) {
  // Hide model selectors when images are loaded but no winner picked yet
  const hasImages = !!(imageA || imageB);
  const blind = hasImages && !loading && revealed === false;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-start">
      <ImageCard
        imageUrl={imageA}
        error={errorA}
        modelId={modelA}
        modelName={getModelName(modelA)}
        loading={loading}
        accent="a"
        selected={selectedWinner === "a"}
        onSelect={() => onSelectWinner("a")}
        onModelChange={onModelAChange}
        hideModelSelector={blind}
      />

      <div className="flex items-center justify-center py-4 sm:pt-16">
        <span className="text-sm text-tertiary">vs</span>
      </div>

      <ImageCard
        imageUrl={imageB}
        error={errorB}
        modelId={modelB}
        modelName={getModelName(modelB)}
        loading={loading}
        accent="b"
        selected={selectedWinner === "b"}
        onSelect={() => onSelectWinner("b")}
        onModelChange={onModelBChange}
        hideModelSelector={blind}
      />
    </div>
  );
}
