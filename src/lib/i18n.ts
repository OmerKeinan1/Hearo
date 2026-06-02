import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";

const resources = {
  en: {
    translation: {
      welcome: {
        line: "A quiet place\nto walk again.",
        begin: "Begin",
      },
      permissions: {
        title: "Two things\nthis app will need.",
        pulseTitle: "Your pulse",
        pulseWhy: "So it knows when to slow down for you.",
        pulseAllow: "Allow Apple Health",
        notifsTitle: "Reminders",
        notifsWhy: "To be here when you said you would.",
        notifsAllow: "Allow",
        privacy: "Nothing leaves your phone unless you ask.",
        continue: "Continue",
      },
      reminders: {
        pickTime: "When would you like the daily reminder?",
        confirm: "Save",
        notificationTitle: "HearO",
        notificationBody: "A quiet walk is ready when you are.",
        enableInSettings: "Enable in Settings",
      },
      setup: {
        sceneQuestion: "Where would you\nlike to walk?",
        soundsQuestion: "Which sounds are\nyou ready to hear?",
        soundsHint: "Pick what feels true. You can change this anytime.",
        ready: "Ready",
        back: "Back",
      },
      home: {
        greeting: {
          morning: "Good morning,\n{{name}}.",
          afternoon: "Good afternoon,\n{{name}}.",
          evening: "Good evening,\n{{name}}.",
          night: "Good night,\n{{name}}.",
        },
        greetingNoName: {
          morning: "Good morning.",
          afternoon: "Good afternoon.",
          evening: "Good evening.",
          night: "Good night.",
        },
        todaysWalk: "Today's walk",
        durationHint: "About six minutes",
        begin: "Begin",
        change: "Change what's planned",
        withSound: "with {{sound}}",
      },
      session: {
        softer: "Softer",
        louder: "Louder",
        pulse: "Pulse",
        pause: "Pause",
        breatheIn: "Breathe in",
        breatheOut: "Breathe out",
      },
      after: {
        duration: "You were here\nfor six minutes.",
        pulseLabel: "Your pulse",
        reflectionQuestion: "How was that?",
        stillHere: "Still here",
        shaken: "Shaken",
        steady: "Steady",
        done: "Done",
      },
      crisis: {
        title: "Need someone\nto talk to\nright now?",
        call: "Call ERAN",
        number: "1201",
        free: "Free, 24/7,\nanonymous.",
        trusted: "A person you trust",
        trustedContacts: {
          addSomeone: "Add someone",
          pickHeading: "Pick someone you trust",
          listFull: "The list is full. Remove someone first to add another.",
          denyExplanation: "ERAN's trained for this. They answer day and night.",
        },
        close: "Close",
      },
    },
  },
  he: {
    translation: {
      welcome: {
        line: "מקום שקט\nללכת בו שוב.",
        begin: "התחל",
      },
      permissions: {
        title: "שני דברים\nשהאפליקציה תזדקק להם.",
        pulseTitle: "הדופק שלך",
        pulseWhy: "כדי שתדע מתי להאט בשבילך.",
        pulseAllow: "אפשר ל-Apple Health",
        notifsTitle: "תזכורות",
        notifsWhy: "כדי להיות כאן כשאמרת שתהיה.",
        notifsAllow: "אפשר",
        privacy: "שום דבר לא עוזב את הטלפון שלך אלא אם תבקש.",
        continue: "המשך",
      },
      reminders: {
        pickTime: "מתי תרצה את התזכורת היומית?",
        confirm: "שמור",
        notificationTitle: "HearO",
        notificationBody: "הליכה שקטה מחכה לך כשתהיה מוכן.",
        enableInSettings: "הפעל בהגדרות",
      },
      setup: {
        sceneQuestion: "איפה תרצה\nללכת?",
        soundsQuestion: "אילו צלילים אתה\nמוכן לשמוע?",
        soundsHint: "בחר את מה שמרגיש נכון. תוכל לשנות זאת בכל עת.",
        ready: "מוכן",
        back: "חזור",
      },
      home: {
        greeting: {
          morning: "בוקר טוב,\n{{name}}.",
          afternoon: "צהריים טובים,\n{{name}}.",
          evening: "ערב טוב,\n{{name}}.",
          night: "לילה טוב,\n{{name}}.",
        },
        greetingNoName: {
          morning: "בוקר טוב.",
          afternoon: "צהריים טובים.",
          evening: "ערב טוב.",
          night: "לילה טוב.",
        },
        todaysWalk: "ההליכה של היום",
        durationHint: "בערך שש דקות",
        begin: "התחל",
        change: "שנה את התכנון",
        withSound: "עם {{sound}}",
      },
      session: {
        softer: "רך יותר",
        louder: "חזק יותר",
        pulse: "דופק",
        pause: "השהה",
        breatheIn: "שאיפה",
        breatheOut: "נשיפה",
      },
      after: {
        duration: "היית כאן\nשש דקות.",
        pulseLabel: "הדופק שלך",
        reflectionQuestion: "איך היה?",
        stillHere: "עדיין כאן",
        shaken: "מעורער",
        steady: "יציב",
        done: "סיום",
      },
      crisis: {
        title: "צריך מישהו\nלדבר איתו\nעכשיו?",
        call: 'התקשר לער"ן',
        number: "1201",
        free: "חינם, 24/7,\nאנונימי.",
        trusted: "אדם שאתה סומך עליו",
        trustedContacts: {
          addSomeone: "הוסף מישהו",
          pickHeading: "בחר מישהו שאתה סומך עליו",
          listFull: "הרשימה מלאה. הסר מישהו כדי להוסיף עוד.",
          denyExplanation: "ער\"ן מאומנים לזה. הם עונים יום ולילה.",
        },
        close: "סגור",
      },
    },
  },
} as const;

const locales = Localization.getLocales();
const deviceLanguage = locales[0]?.languageCode ?? "he";
const initialLanguage = deviceLanguage === "en" ? "en" : "he";

i18n.use(initReactI18next).init({
  resources,
  lng: initialLanguage,
  fallbackLng: "he",
  interpolation: { escapeValue: false },
});

export const isRTL = () => i18n.language === "he";
export default i18n;
