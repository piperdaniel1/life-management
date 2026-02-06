import type { Database } from "./database";

export type Todo = Database["public"]["Tables"]["todos"]["Row"];
export type TodoInsert = Database["public"]["Tables"]["todos"]["Insert"];
export type TodoUpdate = Database["public"]["Tables"]["todos"]["Update"];

export type Item = Todo;
export type ItemType = "task" | "event";

export type TimeEntry = Database["public"]["Tables"]["time_entries"]["Row"];
export type TimeEntryInsert = Database["public"]["Tables"]["time_entries"]["Insert"];
export type TimeEntryUpdate = Database["public"]["Tables"]["time_entries"]["Update"];

export type TimeTrackingDownload = Database["public"]["Tables"]["time_tracking_downloads"]["Row"];

export type List = Database["public"]["Tables"]["lists"]["Row"];
export type ListInsert = Database["public"]["Tables"]["lists"]["Insert"];
export type ListUpdate = Database["public"]["Tables"]["lists"]["Update"];
