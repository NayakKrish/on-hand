import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { DeckCard, EmptySuggestion, SteerReason } from "@/lib/types";

type DeckState = {
  cards: DeckCard[];
  emptyReasons: string[];
  suggestions: EmptySuggestion[];
  seenSlugs: string[];
  steer: SteerReason | null;
  lastRejectedSlug: string | null;
  status: "idle" | "loading" | "ready" | "error";
  error: string | null;
};

const initialState: DeckState = {
  cards: [],
  emptyReasons: [],
  suggestions: [],
  seenSlugs: [],
  steer: null,
  lastRejectedSlug: null,
  status: "idle",
  error: null,
};

const deckSlice = createSlice({
  name: "deck",
  initialState,
  reducers: {
    deckLoading(state) {
      state.status = "loading";
      state.error = null;
    },
    deckReady(
      state,
      action: PayloadAction<{
        cards: DeckCard[];
        emptyReasons: string[];
        suggestions: EmptySuggestion[];
      }>,
    ) {
      state.cards = action.payload.cards;
      state.emptyReasons = action.payload.emptyReasons;
      state.suggestions = action.payload.suggestions;
      state.status = "ready";
      state.error = null;
    },
    deckError(state, action: PayloadAction<string>) {
      state.status = "error";
      state.error = action.payload;
    },
    markSeen(state, action: PayloadAction<string>) {
      if (!state.seenSlugs.includes(action.payload)) {
        state.seenSlugs.push(action.payload);
      }
    },
    setSteer(
      state,
      action: PayloadAction<{ reason: SteerReason; lastRejectedSlug: string }>,
    ) {
      state.steer = action.payload.reason;
      state.lastRejectedSlug = action.payload.lastRejectedSlug;
    },
    startFreshDeck(state) {
      state.seenSlugs = [];
      state.steer = null;
      state.lastRejectedSlug = null;
      state.cards = [];
      state.emptyReasons = [];
      state.suggestions = [];
      state.status = "idle";
      state.error = null;
    },
    resetDeck() {
      return initialState;
    },
  },
});

export const {
  deckLoading,
  deckReady,
  deckError,
  markSeen,
  setSteer,
  startFreshDeck,
  resetDeck,
} = deckSlice.actions;
export default deckSlice.reducer;
