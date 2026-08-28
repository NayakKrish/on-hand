import createWebStorage from "redux-persist/lib/storage/createWebStorage";

const createNoopStorage = () => ({
  getItem() {
    return Promise.resolve(null);
  },
  setItem(_name: string, value: string) {
    void _name;
    return Promise.resolve(value);
  },
  removeItem() {
    return Promise.resolve();
  },
});

export const persistStorage =
  typeof window === "undefined" ? createNoopStorage() : createWebStorage("local");
