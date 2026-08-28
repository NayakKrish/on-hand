"use client";

import { type ReactNode, useSyncExternalStore } from "react";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { persistor, store } from "@/store";

function Splash() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-paper text-ink">
      <p className="font-display text-4xl">On Hand</p>
      <p className="text-ink-soft">Opening the kitchen…</p>
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
