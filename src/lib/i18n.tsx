import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

export type Lang = "mm" | "en";

const dict = {
  appName: { mm: "ရွှေဇင်မောင် တီးဝိုင်းပွဲချီစာရင်း", en: "Shwe Zin Maung Band Schedule" },
  tagline: {
    mm: "တီးဝိုင်းပွဲအချိန်စာရင်းကို တစ်နေရာတည်းမှာ စီမံပါ",
    en: "One place for every show the band plays",
  },
  signIn: { mm: "အကောင့်ဝင်ရန်", en: "Sign in" },
  continueWithGoogle: { mm: "Google ဖြင့် ဆက်လက်ဝင်ရန်", en: "Continue with Google" },
  orUseEmail: { mm: "သို့မဟုတ် အီးမေးလ်ဖြင့်", en: "or use email" },
  signUp: { mm: "အကောင့်သစ်ဖွင့်ရန်", en: "Create account" },
  signOut: { mm: "ထွက်ရန်", en: "Sign out" },
  email: { mm: "အီးမေးလ်", en: "Email" },
  password: { mm: "စကားဝှက်", en: "Password" },
  name: { mm: "အမည်", en: "Name" },
  dashboard: { mm: "ပွဲစာရင်း", en: "Schedule" },
  settings: { mm: "အပြင်အဆင်", en: "Settings" },
  language: { mm: "ဘာသာစကား", en: "Language" },
  myanmar: { mm: "မြန်မာ", en: "Myanmar" },
  english: { mm: "အင်္ဂလိပ်", en: "English" },
  search: { mm: "ပွဲအမည်၊ နေရာ၊ ရက်စွဲ ရှာရန်", en: "Search by name, place or date" },
  addEvent: { mm: "ပွဲအသစ် ထည့်ရန်", en: "Add new event" },
  editEvent: { mm: "ပွဲ ပြင်ရန်", en: "Edit event" },
  today: { mm: "ဒီနေ့ပွဲများ", en: "Today's events" },
  upcoming: { mm: "လာမည့်ပွဲများ", en: "Upcoming events" },
  past: { mm: "ကျော်လွန်ပွဲများ", en: "Past events" },
  listView: { mm: "စာရင်း", en: "List" },
  calendarView: { mm: "ပြက္ခဒိန်", en: "Calendar" },
  title: { mm: "ပွဲအမည်", en: "Event title" },
  dateTime: { mm: "ရက်စွဲနှင့် အချိန်", en: "Date & time" },
  location: { mm: "နေရာ / လိပ်စာ", en: "Location / address" },
  notes: { mm: "မှတ်ချက်", en: "Notes & details" },
  extraReminders: { mm: "အပို သတိပေးချက်များ", en: "Extra reminders" },
  addReminder: { mm: "သတိပေးချက် ထည့်ရန်", en: "Add reminder" },
  reminderTomorrow: { mm: "မနက်ဖြန် ပွဲရှိသည်", en: "Show is tomorrow" },
  completed: { mm: "ပြီးဆုံး", en: "Completed" },
  markCompleted: { mm: "ပြီးဆုံးအဖြစ် မှတ်ရန်", en: "Mark as completed" },
  markPending: { mm: "မပြီးဆုံးအဖြစ် ပြန်ထားရန်", en: "Mark as not completed" },
  save: { mm: "သိမ်းရန်", en: "Save" },
  cancel: { mm: "မလုပ်တော့", en: "Cancel" },
  delete: { mm: "ဖျက်ရန်", en: "Delete" },
  deleteConfirm: { mm: "ဤပွဲကို ဖျက်မှာ သေချာပါသလား?", en: "Delete this event?" },
  noEvents: { mm: "ပွဲစာရင်း မရှိပါ", en: "No events yet" },
  noResults: { mm: "ရှာသည့်အတိုင်း မတွေ့ပါ", en: "Nothing matches your search" },
  role: { mm: "အခန်းကနေရာ", en: "Role" },
  admin: { mm: "တီးဝိုင်းအကြီးအကဲ (စီမံခွင့်)", en: "Band leader (admin)" },
  viewer: { mm: "တီးဝိုင်းအဖွဲ့ဝင် (ကြည့်ရုံ)", en: "Band member (viewer)" },
  viewerNotice: {
    mm: "သင်သည် ကြည့်ရုံအဖွဲ့ဝင် ဖြစ်သည်။ ပွဲထည့်ခြင်း/ပြင်ခြင်းကို အကြီးအကဲသာ ပြုလုပ်နိုင်သည်။",
    en: "You have view-only access. Only the band leader can add or change events.",
  },
  loading: { mm: "ရယူနေသည်...", en: "Loading..." },
  backToList: { mm: "စာရင်းသို့ ပြန်", en: "Back to schedule" },
  saved: { mm: "သိမ်းပြီးပါပြီ", en: "Saved" },
  deleted: { mm: "ဖျက်ပြီးပါပြီ", en: "Deleted" },
  checkEmail: {
    mm: "အီးမေးလ်ထဲရှိ အတည်ပြုလင့်ခ်ကို နှိပ်ပြီး အကောင့်ဝင်ပါ",
    en: "Check your email for the confirmation link, then sign in",
  },
  haveAccount: { mm: "အကောင့်ရှိပြီးလား?", en: "Already have an account?" },
  noAccount: { mm: "အကောင့်မရှိဘူးလား?", en: "Need an account?" },
  eventsOnDay: { mm: "ရွေးချယ်ထားသည့်ရက်", en: "Selected day" },
  arriveAt: { mm: "ရောက်ရှိရမည့်အချိန်", en: "Arrival time" },
  arriveBy: { mm: "ရောက်ရန်", en: "Arrive by" },
  eventDate: { mm: "ပွဲရက်စွဲ", en: "Event date" },
  eventTime: { mm: "ပွဲအချိန်", en: "Event time" },
  notifications: { mm: "အသိပေးချက်များ", en: "Notifications" },
  notificationSettings: { mm: "အသိပေးချက် အပြင်အဆင်", en: "Notification settings" },
  noNotifications: { mm: "အသိပေးချက် မရှိပါ", en: "No notifications yet" },
  markAllRead: { mm: "အားလုံး ဖတ်ပြီးအဖြစ် မှတ်ရန်", en: "Mark all as read" },
  unread: { mm: "မဖတ်ရသေး", en: "Unread" },
  notificationsOn: { mm: "အသိပေးချက် ဖွင့်ရန်", en: "Notifications on" },
  soundOn: { mm: "အသံ ဖွင့်ရန်", en: "Notification sound" },
  pushOn: { mm: "ဖုန်းပေါ်တွင် အသိပေးချက် (Push)", en: "Push notifications on this device" },
  pushHint: {
    mm: "ဖွင့်လိုက်ပါက အက်ပ်ကို ပိတ်ထားချိန်တွင်လည်း သတိပေးချက်များ ဖုန်းပေါ်သို့ ရောက်လာမည်။",
    en: "When on, reminders reach your phone even if the app is closed.",
  },
  enablePush: { mm: "ဖွင့်ရန်", en: "Enable" },
  disablePush: { mm: "ပိတ်ရန်", en: "Turn off" },
  testNotification: { mm: "စမ်းသပ် အသိပေးချက် ပို့ရန်", en: "Send a test notification" },
  testSound: { mm: "အသံ စမ်းရန်", en: "Test sound" },
  pushUnsupported: {
    mm: "ဤဖုန်း/ဘရောက်ဇာတွင် push အသိပေးချက် မရနိုင်ပါ။",
    en: "This device or browser cannot receive push notifications.",
  },
  pushOpenNewTab: {
    mm: "အက်ပ်ကို ဘရောက်ဇာတွင် တစ်ခုတည်း ဖွင့်ပြီး ထပ်စမ်းပါ။",
    en: "Open the app in its own browser tab, then try again.",
  },
  pushDenied: {
    mm: "ဘရောက်ဇာတွင် အသိပေးချက်ခွင့်ကို ပိတ်ထားသည်။ Site settings မှ ပြန်ဖွင့်ပါ။",
    en: "Notifications are blocked in your browser. Allow them in site settings.",
  },
  pushNotConfigured: {
    mm: "Push အသိပေးချက် စနစ် အဆင်သင့် မဖြစ်သေးပါ။",
    en: "Push notifications are not configured yet.",
  },
  pushEnabled: { mm: "ဤဖုန်းအတွက် push ဖွင့်ပြီးပါပြီ", en: "Push enabled on this device" },
  reminderPrefs: { mm: "ပုံမှန် သတိပေးချက်များ", en: "Default reminders" },
  reminderPrefsHint: {
    mm: "ပွဲအသစ်ထည့်သည့်အခါ အလိုအလျောက် ရွေးထားမည့် သတိပေးအချိန်များ",
    en: "Pre-selected reminder times when a new event is created",
  },
  reminderTimes: { mm: "သတိပေးအချိန်များ", en: "Reminder times" },
  customReminder: { mm: "စိတ်ကြိုက် သတိပေးချက်", en: "Custom reminder" },
  days: { mm: "ရက်", en: "Days" },
  hours: { mm: "နာရီ", en: "Hours" },
  minutes: { mm: "မိနစ်", en: "Minutes" },
  add: { mm: "ထည့်ရန်", en: "Add" },
  manageReminders: { mm: "သတိပေးချက် စီမံခြင်း", en: "Manage reminders" },
  recipients: { mm: "အသိပေးမည့် အဖွဲ့ဝင်များ", en: "Who gets notified" },
  everyone: { mm: "အဖွဲ့ဝင် အားလုံး", en: "Everyone" },
  recipientsHint: {
    mm: "မရွေးထားပါက အဖွဲ့ဝင်အားလုံးသို့ ပို့မည်။",
    en: "If nobody is selected, everyone gets the reminder.",
  },
  selectEvent: { mm: "ပွဲ ရွေးပါ", en: "Choose an event" },
  sentAlready: { mm: "ပို့ပြီး", en: "Sent" },
  testSent: { mm: "စမ်းသပ် အသိပေးချက် ပို့လိုက်ပါပြီ", en: "Test notification sent" },
  noDevice: {
    mm: "ဤအကောင့်တွင် push ဖွင့်ထားသည့် ဖုန်း မရှိပါ။",
    en: "No device has push enabled for this account yet.",
  },
  manageMembers: { mm: "အဖွဲ့ဝင် စံခြင်း", en: "Manage members" },
  manageMembersHint: {
    mm: "အဖွဲ့ဝင်များကို အကြီးအကဲ (စီမံခွင့်) သို့မဟုတ် ကြည့်ရုံအဖွဲ့ဝင် အဖြစ် ပြောင်းလဲနိုင်သည်။",
    en: "Promote members to admin or set them back to view-only.",
  },
  makeAdmin: { mm: "အကြီးအကဲ ခန့်ရန်", en: "Make admin" },
  makeViewer: { mm: "ကြည့်ရုံသို့ ပြောင်းရန်", en: "Make viewer" },
  adminShort: { mm: "အကြီးအကဲ", en: "Admin" },
  viewerShort: { mm: "အဖွဲ့ဝင်", en: "Viewer" },
  unnamedMember: { mm: "အမည်မရှိ အဖွဲ့ဝင်", en: "Unnamed member" },
  you: { mm: "သင်", en: "you" },
  lastAdminHint: {
    mm: "နောက်ဆုံး အကြီးအကဲကို ပြောင်းလို့ မရပါ။ အခြားတစ်ဦးကို အကြီးအကဲ ခန့်ပြီးမှ ပြောင်းပါ။",
    en: "The last admin cannot be changed. Make someone else admin first.",
  },
} as const;

export type TKey = keyof typeof dict;

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (k: TKey) => string };

const I18nContext = createContext<Ctx>({ lang: "mm", setLang: () => {}, t: (k) => dict[k].mm });

const STORAGE_KEY = "szm-lang";

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("mm");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "mm") setLangState(stored);
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    window.localStorage.setItem(STORAGE_KEY, l);
  }, []);

  const value = useMemo<Ctx>(
    () => ({ lang, setLang, t: (k: TKey) => dict[k][lang] }),
    [lang, setLang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
