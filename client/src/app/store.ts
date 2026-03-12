import { configureStore } from "@reduxjs/toolkit";
import exampleReducer from "../features/example/exampleSlice";
import filterManagementReducer from '../features/FilterManagement/FilterManagementSlice';
import inquiriesReducer from "../features/Inquiries/inquiriesSlice";
import tasksReducer from "../features/tasks/tasksSlice";
import historyReducer from "../features/data-history/historySlice";
import tableReducer from "../features/tabl_data/tableSlice";

export const store = configureStore({
  reducer: {
    filterManagement: filterManagementReducer,
    example: exampleReducer,
    inquiries: inquiriesReducer,
    tasks: tasksReducer,
    historys: historyReducer, // לפי השם שנתת בסלייס
    table: tableReducer,      // 👈 זה מה שחסר לך
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
