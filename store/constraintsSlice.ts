import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Diet } from "@/lib/types";

type ConstraintsState = {
  maxMinutes: number;
  diet: Diet;
  shopOne: boolean;
  namedDishSlug: string | null;
  namedDishName: string | null;
};

const initialState: ConstraintsState = {
  maxMinutes: 30,
  diet: "veg",
  shopOne: false,
  namedDishSlug: null,
  namedDishName: null,
};

const constraintsSlice = createSlice({
  name: "constraints",
  initialState,
  reducers: {
    setMaxMinutes(state, action: PayloadAction<number>) {
      state.maxMinutes = action.payload;
    },
    setDiet(state, action: PayloadAction<Diet>) {
      state.diet = action.payload;
    },
    setShopOne(state, action: PayloadAction<boolean>) {
      state.shopOne = action.payload;
    },
    setNamedDish(
      state,
      action: PayloadAction<{ slug: string; name: string } | null>,
    ) {
      state.namedDishSlug = action.payload?.slug ?? null;
      state.namedDishName = action.payload?.name ?? null;
    },
    resetConstraints() {
      return initialState;
    },
  },
});

export const { setMaxMinutes, setDiet, setShopOne, setNamedDish, resetConstraints } =
  constraintsSlice.actions;
export default constraintsSlice.reducer;
