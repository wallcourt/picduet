"use client";

import { useEffect, useState } from "react";
import type { ImageModel } from "@/lib/models";
import { DEFAULT_IMAGE_MODELS } from "@/lib/models";

interface ModelSelectorProps {
  value: string;
  onChange: (modelId: string) => void;
  dotColor?: string;
}

function groupByProvider(models: ImageModel[]) {
  const groups: Record<string, ImageModel[]> = {};
  for (const m of models) {
    if (!groups[m.provider]) groups[m.provider] = [];
    groups[m.provider].push(m);
  }
  return groups;
}

export default function ModelSelector({
  value,
  onChange,
  dotColor = "bg-emerald-400",
}: ModelSelectorProps) {
  const [models, setModels] = useState<ImageModel[]>(DEFAULT_IMAGE_MODELS);

  useEffect(() => {
    fetch("/api/models")
      .then((r) => r.json())
      .then((data) => {
        if (data.models?.length) setModels(data.models);
      })
      .catch(() => {});
  }, []);

  const grouped = groupByProvider(models);
  const selected = models.find((m) => m.id === value);

  return (
    <div>
      <div className="relative">
        <span
          className={`pointer-events-none absolute left-3.5 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full ${dotColor}`}
        />
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-border-hover bg-surface py-3 pl-9 pr-10 text-sm font-medium text-foreground transition-colors focus:border-border-hover focus:outline-none"
        >
          {Object.entries(grouped).map(([provider, providerModels]) => (
            <optgroup key={provider} label={provider}>
              {providerModels.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>
      {selected && (
        <span className="mt-1.5 block text-xs text-tertiary">
          {selected.provider}
        </span>
      )}
    </div>
  );
}
