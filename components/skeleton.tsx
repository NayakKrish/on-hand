function Bone({ className }: { className?: string }) {
  return <div className={`shimmer ${className ?? ""}`} />;
}

export function ChipSkeletonRow({ count = 8 }: { count?: number }) {
  const widths = [
    "w-28",
    "w-36",
    "w-24",
    "w-40",
    "w-32",
    "w-20",
    "w-44",
    "w-28",
  ];
  return (
    <div className="flex flex-wrap gap-2" aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <Bone
          key={i}
          className={`h-8 rounded-full ${widths[i % widths.length]}`}
        />
      ))}
    </div>
  );
}

export function KitchenPantrySkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <p className="sr-only">Loading pantry</p>
      <div className="space-y-2">
        <Bone className="h-3 w-24 rounded-full" />
        <ChipSkeletonRow count={8} />
      </div>
      <div className="space-y-2">
        <Bone className="h-3 w-32 rounded-full" />
        <ChipSkeletonRow count={10} />
      </div>
    </div>
  );
}

export function DishSearchSkeleton() {
  return (
    <ul
      className="mt-2 space-y-1 overflow-hidden rounded-2xl bg-cream p-2"
      aria-busy="true"
    >
      {[1, 2, 3].map((i) => (
        <li key={i} className="space-y-2 px-2 py-2">
          <Bone className="h-4 w-40 rounded-full" />
          <Bone className="h-3 w-full rounded-full" />
        </li>
      ))}
    </ul>
  );
}

export function DeckSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-live="polite">
      <p className="sr-only">Walking the kitchen graph</p>
      <div className="flex items-center justify-between">
        <Bone className="h-3 w-28 rounded-full" />
        <Bone className="h-3 w-24 rounded-full" />
      </div>
      <div className="relative mx-auto max-w-md px-10 sm:px-12">
        <div className="min-h-95 rounded-3xl bg-cream p-5 shadow-[0_22px_50px_rgba(42,33,24,0.12)]">
          <Bone className="mx-auto mb-5 h-1.5 w-12 rounded-full" />
          <Bone className="h-3 w-36 rounded-full" />
          <Bone className="mt-4 h-10 w-3/4 rounded-full" />
          <Bone className="mt-3 h-4 w-full rounded-full" />
          <Bone className="mt-2 h-4 w-5/6 rounded-full" />
          <Bone className="mt-6 h-16 w-full rounded-2xl" />
          <Bone className="mt-4 h-4 w-28 rounded-full" />
          <div className="mt-10 flex gap-2">
            <Bone className="h-9 w-20 rounded-full" />
            <Bone className="ml-auto h-9 w-20 rounded-full" />
          </div>
        </div>
        <Bone className="-mt-3 mx-3 h-14 rounded-3xl" />
        <Bone className="-mt-2.5 mx-6 h-12 rounded-3xl" />
      </div>
    </div>
  );
}

export function DishSkeleton() {
  return (
    <div className="space-y-5 pb-8" aria-busy="true" aria-live="polite">
      <p className="sr-only">Loading dish</p>
      <Bone className="h-3 w-56 rounded-full" />
      <Bone className="h-10 w-2/3 rounded-full" />
      <Bone className="h-5 w-full rounded-full" />
      <Bone className="h-5 w-4/5 rounded-full" />
      <Bone className="h-14 w-full rounded-2xl" />
      <div className="space-y-2">
        <Bone className="h-6 w-40 rounded-full" />
        <ChipSkeletonRow count={6} />
      </div>
      <div className="space-y-3">
        <Bone className="h-6 w-32 rounded-full" />
        <Bone className="h-4 w-full rounded-full" />
        <Bone className="h-4 w-5/6 rounded-full" />
        <Bone className="h-4 w-full rounded-full" />
        <Bone className="h-4 w-2/3 rounded-full" />
      </div>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true">
      <Bone className="h-8 w-40 rounded-full" />
      <Bone className="h-4 w-3/4 rounded-full" />
      <Bone className="h-40 w-full rounded-3xl" />
    </div>
  );
}

export function BusyStrip() {
  return (
    <div className="mt-3" aria-busy="true">
      <p className="sr-only">Finding the next cluster</p>
      <Bone className="h-2 w-full rounded-full" />
    </div>
  );
}
