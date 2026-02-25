export interface Plan {
  name: string;
  key: string;
  duels: number;
  monthlyPrice: number;
  annualPrice: number;
  features: string[];
  popular?: boolean;
}

export const plans: Plan[] = [
  {
    name: "Starter",
    key: "starter",
    duels: 50,
    monthlyPrice: 8,
    annualPrice: 80,
    features: ["50 duels per month", "All AI models", "Image refinement", "Share & discover"],
  },
  {
    name: "Pro",
    key: "pro",
    duels: 200,
    monthlyPrice: 16,
    annualPrice: 160,
    features: ["200 duels per month", "All AI models", "Image refinement", "Share & discover"],
    popular: true,
  },
  {
    name: "Power",
    key: "power",
    duels: 500,
    monthlyPrice: 32,
    annualPrice: 320,
    features: ["500 duels per month", "All AI models", "Image refinement", "Share & discover"],
  },
];
