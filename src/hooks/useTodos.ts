import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Todo, TodoInsert, TodoUpdate } from "@/types/models";

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTodos = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("todos")
      .select("*")
      .order("is_complete", { ascending: true })
      .order("position", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setTodos(data as Todo[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTodos();

    const channel = supabase
      .channel("todos-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "todos" },
        () => {
          fetchTodos();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTodos]);

  const addTodo = async (todo: Omit<TodoInsert, "user_id">) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Not authenticated");
      return;
    }
    const { error } = await supabase
      .from("todos")
      .insert({ ...todo, user_id: user.id });
    if (error) setError(error.message);
  };

  const updateTodo = async (id: string, updates: TodoUpdate) => {
    const { error } = await supabase
      .from("todos")
      .update(updates as never)
      .eq("id", id);
    if (error) setError(error.message);
  };

  const deleteTodo = async (id: string) => {
    const { error } = await supabase.from("todos").delete().eq("id", id);
    if (error) setError(error.message);
  };

  return { todos, loading, error, addTodo, updateTodo, deleteTodo };
}
