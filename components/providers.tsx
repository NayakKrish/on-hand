"use client";

import { type ReactNode, useSyncExternalStore } from "react";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { persistor, store } from "@/store";

function Splash() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-paper text-ink">
      <p className="font-display text-4xl">On Hand</p>
      <div className="w-52 space-y-2" aria-busy="true" aria-live="polite">
        <p className="sr-only">Opening the kitchen</p>
        <div className="shimmer mx-auto h-3 w-40 rounded-full" />
        <div className="shimmer mx-auto h-3 w-24 rounded-full" />
      </div>
    </div>
  );
}

const emptySubscribe = () => () => {};

export function Providers({ children }: { children: ReactNode }) {
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  if (!mounted) return <Splash />;

  return (
    <Provider store={store}>
      <PersistGate loading={<Splash />} persistor={persistor}>
        {children}
      </PersistGate>
    </Provider>
  );
}
