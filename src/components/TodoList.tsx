import { FormEvent, useState } from "react";
import { useTodos } from "@/hooks/useTodos";
import { TodoItem } from "./TodoItem";

export function TodoList() {
  const { todos, loading, error, addTodo, updateTodo, deleteTodo } =
    useTodos();
  const [newTitle, setNewTitle] = useState("");

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    await addTodo({ title: trimmed });
    setNewTitle("");
  };

  const activeTodos = todos.filter((t) => !t.is_complete);
  const completedTodos = todos.filter((t) => t.is_complete);

  return (
    <div className="space-y-6">
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="What needs to be done?"
          className="min-w-0 flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
        >
          Add
        </button>
      </form>

      {error && (
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-600">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-center text-sm text-gray-500">Loading...</p>
      ) : todos.length === 0 ? (
        <p className="text-center text-sm text-gray-500">
          No todos yet. Add one above.
        </p>
      ) : (
        <div className="space-y-4">
          {activeTodos.length > 0 && (
            <ul className="space-y-2">
              {activeTodos.map((todo) => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  onUpdate={updateTodo}
                  onDelete={deleteTodo}
                />
              ))}
            </ul>
          )}

          {completedTodos.length > 0 && (
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Completed ({completedTodos.length})
              </h3>
              <ul className="space-y-2">
                {completedTodos.map((todo) => (
                  <TodoItem
                    key={todo.id}
                    todo={todo}
                    onUpdate={updateTodo}
                    onDelete={deleteTodo}
                  />
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
