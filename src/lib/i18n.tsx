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
