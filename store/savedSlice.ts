import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type SavedDish = {
  slug: string;
  name: string;
  gloss: string;
};

type SavedState = {
  items: SavedDish[];
};

const initialState: SavedState = { items: [] };

const savedSlice = createSlice({
  name: "saved",
  initialState,
  reducers: {
    toggleSaved(state, action: PayloadAction<SavedDish>) {
      const exists = state.items.some((item) => item.slug === action.payload.slug);
      if (exists) {
        state.items = state.items.filter((item) => item.slug !== action.payload.slug);
      } else {
        state.items.unshift(action.payload);
      }
    },
    resetSaved() {
      return initialState;
    },
  },
});

export const { toggleSaved, resetSaved } = savedSlice.actions;
export default savedSlice.reducer;
