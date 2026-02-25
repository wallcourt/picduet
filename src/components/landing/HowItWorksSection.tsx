const steps = [
  {
    number: 1,
    title: "Write & enhance your prompt",
    description:
      "Write a rough idea or a detailed description — then toggle Enhance to let AI rewrite it into a vivid, optimized prompt before generation.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
        />
      </svg>
    ),
  },
  {
    number: 2,
    title: "Two models compete",
    description:
      "Your prompt is sent to two different AI models. You see both results side-by-side — but the models stay hidden.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
        />
      </svg>
    ),
  },
  {
    number: 3,
    title: "Pick the winner",
    description:
      "Choose your favorite image and reveal which AI model made it. The winning image becomes your starting point.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
        />
      </svg>
    ),
  },
  {
    number: 4,
    title: "Refine with follow-ups",
    description:
      "Not quite perfect? Send follow-up prompts to iterate on your winner — adjust details, change the mood, or push the style further until it's exactly right.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182"
        />
      </svg>
    ),
  },
];

export default function HowItWorksSection() {
  return (
    <section className="border-t border-border px-4 py-20">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center text-2xl font-bold text-foreground sm:text-3xl">
          How it works
        </h2>
        <p className="mt-3 text-center text-muted">
          Compare, choose, and iterate until it&apos;s perfect.
        </p>

        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <div
              key={step.number}
              className="rounded-2xl border border-border bg-surface p-6"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-background text-muted">
                {step.icon}
              </div>
              <div className="mt-4 text-xs font-medium text-tertiary">
                Step {step.number}
              </div>
              <h3 className="mt-1 text-lg font-semibold text-foreground">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
