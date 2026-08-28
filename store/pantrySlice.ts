import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { DEMO_PANTRY_SLUGS } from "@/lib/demo-pantry";

type PantryState = {
  slugs: string[];
  leftovers: string[];
};

const initialState: PantryState = {
  slugs: [...DEMO_PANTRY_SLUGS],
  leftovers: [],
};

const pantrySlice = createSlice({
  name: "pantry",
  initialState,
  reducers: {
    toggleIngredient(state, action: PayloadAction<string>) {
      const slug = action.payload;
      if (state.slugs.includes(slug)) {
        state.slugs = state.slugs.filter((s) => s !== slug);
        state.leftovers = state.leftovers.filter((s) => s !== slug);
      } else {
        state.slugs.push(slug);
      }
    },
    addIngredient(state, action: PayloadAction<string>) {
      if (!state.slugs.includes(action.payload)) state.slugs.push(action.payload);
    },
    toggleLeftover(state, action: PayloadAction<string>) {
      const slug = action.payload;
      if (!state.slugs.includes(slug)) state.slugs.push(slug);
      if (state.leftovers.includes(slug)) {
        state.leftovers = state.leftovers.filter((s) => s !== slug);
      } else {
        state.leftovers.push(slug);
      }
    },
    resetPantry() {
      return initialState;
    },
  },
});

export const { toggleIngredient, addIngredient, toggleLeftover, resetPantry } =
  pantrySlice.actions;
export default pantrySlice.reducer;
