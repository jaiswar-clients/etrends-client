import { combineReducers, configureStore } from "@reduxjs/toolkit";
import userSlice from "./slices/user";
import {
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import storage from "redux-persist/lib/storage";
import { thunk } from "redux-thunk";
import { authApi } from "./api/auth";
import { clientApi } from "./api/client";
import { appApi } from "./api/app";
import { orderApi } from "./api/order";
import { productApi } from "./api/product";
import { reminderApi } from "./api/reminder";
import { reportApi } from "./api/report";
import { orderAiApi } from "./api/orderAi";

const rootReducer = combineReducers({
  user: userSlice,
  [authApi.reducerPath]: authApi.reducer,
  [clientApi.reducerPath]: clientApi.reducer,
  [appApi.reducerPath]: appApi.reducer,
  [orderApi.reducerPath]: orderApi.reducer,
  [productApi.reducerPath]: productApi.reducer,
  [reminderApi.reducerPath]: reminderApi.reducer,
  [reportApi.reducerPath]: reportApi.reducer,
  [orderAiApi.reducerPath]: orderAiApi.reducer,
});

const persistConfig = {
  key: "root",
  storage,
  blacklist: [
    authApi.reducerPath,
    clientApi.reducerPath,
    appApi.reducerPath,
    orderApi.reducerPath,
    productApi.reducerPath,
    reminderApi.reducerPath,
    reportApi.reducerPath,
    orderAiApi.reducerPath,
  ],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const makeStore = () =>
  configureStore({
    reducer: persistedReducer,
    devTools: process.env.NODE_ENV !== "production",
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        },
      })
        .concat(thunk)
        .concat(authApi.middleware)
        .concat(clientApi.middleware)
        .concat(appApi.middleware)
        .concat(orderApi.middleware)
        .concat(productApi.middleware)
        .concat(reminderApi.middleware)
        .concat(reportApi.middleware)
        .concat(orderAiApi.middleware),
  });

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>;
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
