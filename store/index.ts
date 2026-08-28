import { combineReducers, configureStore } from "@reduxjs/toolkit";
import {
  FLUSH,
  PAUSE,
  PERSIST,
  persistReducer,
  persistStore,
  PURGE,
  REGISTER,
  REHYDRATE,
} from "redux-persist";
import constraints from "./constraintsSlice";
import deck from "./deckSlice";
import pantry from "./pantrySlice";
import saved from "./savedSlice";
import { persistStorage } from "./storage";

const persistConfig = {
  key: "on-hand",
  storage: persistStorage,
  whitelist: ["pantry", "constraints", "saved"],
};

const appReducer = combineReducers({
  pantry,
  constraints,
  deck,
  saved,
});

const persistedReducer = persistReducer(persistConfig, appReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof appReducer>;
export type AppDispatch = typeof store.dispatch;
