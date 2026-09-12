-- Events: arrival time
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS arrive_at timestamp with time zone;

-- Reminders: offset + delivery bookkeeping
ALTER TABLE public.event_reminders ADD COLUMN IF NOT EXISTS offset_minutes integer;
ALTER TABLE public.event_reminders ADD COLUMN IF NOT EXISTS sent_at timestamp with time zone;
CREATE INDEX IF NOT EXISTS event_reminders_due_idx ON public.event_reminders (remind_at) WHERE sent_at IS NULL;

-- Per-user notification preferences
CREATE TABLE IF NOT EXISTS public.notification_settings (
  user_id uuid PRIMARY KEY,
  notifications_enabled boolean NOT NULL DEFAULT true,
  sound_enabled boolean NOT NULL DEFAULT true,
  push_enabled boolean NOT NULL DEFAULT false,
  default_offsets integer[] NOT NULL DEFAULT ARRAY[1440, 60],
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.notification_settings TO authenticated;
GRANT ALL ON public.notification_settings TO service_role;
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own notification settings" ON public.notification_settings
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert own notification settings" ON public.notification_settings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update own notification settings" ON public.notification_settings
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Delivered notifications (in-app inbox)
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE,
  reminder_id uuid REFERENCES public.event_reminders(id) ON DELETE SET NULL,
  title text NOT NULL,
  body text NOT NULL,
  read_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notifications_user_idx ON public.notifications (user_id, created_at DESC);
GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "update own notifications" ON public.notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "delete own notifications" ON public.notifications
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Which members receive notifications for a given event (no rows = everyone)
CREATE TABLE IF NOT EXISTS public.event_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (event_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.event_recipients TO authenticated;
GRANT ALL ON public.event_recipients TO service_role;
ALTER TABLE public.event_recipients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated read recipients" ON public.event_recipients
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "admins insert recipients" ON public.event_recipients
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins delete recipients" ON public.event_recipients
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Web push subscriptions per device
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.push_subscriptions TO authenticated;
GRANT ALL ON public.push_subscriptions TO service_role;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own push subscriptions" ON public.push_subscriptions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert own push subscriptions" ON public.push_subscriptions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete own push subscriptions" ON public.push_subscriptions
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER notification_settings_touch_updated_at
  BEFORE UPDATE ON public.notification_settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Realtime for the notification inbox
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
