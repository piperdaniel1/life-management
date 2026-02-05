import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { isEventPast } from "@/lib/dateUtils";
import type { Item, TodoInsert, TodoUpdate } from "@/types/models";

export function useItems() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const autoCompletedRef = useRef<Set<string>>(new Set());

  const autoCompleteEvents = useCallback((data: Item[]) => {
    const toComplete = data.filter(
      (item) =>
        item.item_type === "event" &&
        !item.is_complete &&
        item.scheduled_date &&
        !autoCompletedRef.current.has(item.id) &&
        isEventPast(item.scheduled_date, item.end_time),
    );

    if (toComplete.length > 0) {
      // Mark locally as complete immediately (optimistic)
      setItems((prev) =>
        prev.map((item) =>
          toComplete.some((tc) => tc.id === item.id)
            ? { ...item, is_complete: true }
            : item,
        ),
      );

      // Fire background updates
      for (const item of toComplete) {
        autoCompletedRef.current.add(item.id);
        supabase
          .from("todos")
          .update({ is_complete: true } as never)
          .eq("id", item.id)
          .then();
      }
    }
  }, []);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("todos")
      .select("*")
      .order("is_complete", { ascending: true })
      .order("scheduled_date", { ascending: true, nullsFirst: false })
      .order("start_time", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      const items = data as Item[];
      setItems(items);
      autoCompleteEvents(items);
    }
    setLoading(false);
  }, [autoCompleteEvents]);

  useEffect(() => {
    fetchItems();

    const channel = supabase
      .channel("items-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "todos" },
        () => {
          fetchItems();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchItems]);

  const addItem = async (item: Omit<TodoInsert, "user_id">) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Not authenticated");
      return;
    }
    const { error } = await supabase
      .from("todos")
      .insert({ ...item, user_id: user.id });
    if (error) setError(error.message);
  };

  const updateItem = async (id: string, updates: TodoUpdate) => {
    const { error } = await supabase
      .from("todos")
      .update(updates as never)
      .eq("id", id);
    if (error) setError(error.message);
  };

  const deleteItem = async (id: string) => {
    const { error } = await supabase.from("todos").delete().eq("id", id);
    if (error) setError(error.message);
  };

  return { items, loading, error, addItem, updateItem, deleteItem };
}
