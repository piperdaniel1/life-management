-- Allow full-day events (events without a start_time).
-- Previously events required both scheduled_date AND start_time.
-- Now only scheduled_date is required for events.

ALTER TABLE public.todos
  DROP CONSTRAINT event_requires_date_and_start;

ALTER TABLE public.todos
  ADD CONSTRAINT event_requires_date
    CHECK (
      item_type = 'task'
      OR (item_type = 'event' AND scheduled_date IS NOT NULL)
    );
