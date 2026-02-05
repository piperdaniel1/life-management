-- Add item type (task vs event) and scheduling columns to todos table
ALTER TABLE public.todos
  ADD COLUMN item_type text NOT NULL DEFAULT 'task'
    CHECK (item_type IN ('task', 'event')),
  ADD COLUMN scheduled_date date,
  ADD COLUMN start_time time,
  ADD COLUMN end_time time;

-- Events must have a date and start_time; end_time is optional
ALTER TABLE public.todos
  ADD CONSTRAINT event_requires_date_and_start
    CHECK (
      item_type = 'task'
      OR (item_type = 'event' AND scheduled_date IS NOT NULL AND start_time IS NOT NULL)
    );

CREATE INDEX idx_todos_scheduled_date ON public.todos(user_id, scheduled_date);
CREATE INDEX idx_todos_type_date ON public.todos(user_id, item_type, scheduled_date);
