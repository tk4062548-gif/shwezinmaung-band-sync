import { Link } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { useUnreadCount } from "@/lib/notifications";

export function NotificationBell() {
  const { t } = useI18n();
  const unread = useUnreadCount();

  return (
    <Button variant="ghost" size="icon" asChild aria-label={t("notifications")}>
      <Link to="/notifications" className="relative">
        <Bell className="size-5" />
        {unread > 0 ? (
          <span className="absolute right-0.5 top-0.5 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-4 text-primary-foreground">
            {unread > 99 ? "99+" : unread}
          </span>
        ) : null}
      </Link>
    </Button>
  );
}
