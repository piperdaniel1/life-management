import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { List, ListInsert, ListUpdate } from "@/types/models";

export function useLists() {
  const [lists, setLists] = useState<List[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLists = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("lists")
      .select("*")
      .order("position", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      setError(error.message);
    } else {
      setLists(data as List[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLists();

    const channel = supabase
      .channel("lists-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "lists" },
        () => {
          fetchLists();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchLists]);

  const addList = async (list: Omit<ListInsert, "user_id">) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Not authenticated");
      return;
    }
    const { error } = await supabase
      .from("lists")
      .insert({ ...list, user_id: user.id });
    if (error) setError(error.message);
  };

  const updateList = async (id: string, updates: ListUpdate) => {
    const { error } = await supabase
      .from("lists")
      .update(updates as never)
      .eq("id", id);
    if (error) setError(error.message);
  };

  const deleteList = async (id: string) => {
    const { error } = await supabase.from("lists").delete().eq("id", id);
    if (error) setError(error.message);
  };

  return { lists, loading, error, addList, updateList, deleteList };
}
