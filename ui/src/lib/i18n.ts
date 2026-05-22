import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";

const resources = {
  en: {
    translation: {
      welcome: {
        line: "a quiet place\nto walk again.",
        begin: "begin",
      },
      permissions: {
        title: "two things\nthis app will need.",
        pulseTitle: "your pulse",
        pulseWhy: "so it knows when to slow down for you.",
        pulseAllow: "allow apple health",
        notifsTitle: "reminders",
        notifsWhy: "to be here when you said you would.",
        notifsAllow: "allow",
        privacy: "nothing leaves your phone unless you ask.",
        continue: "continue",
      },
      setup: {
        sceneQuestion: "where would you\nlike to walk?",
        soundsQuestion: "which sounds are\nyou ready to hear?",
        soundsHint: "pick what feels true. you can change this anytime.",
        ready: "ready",
        back: "back",
      },
      home: {
        greeting: "good evening,\nshai.",
        todaysWalk: "today's walk",
        durationHint: "about six minutes",
        begin: "begin",
        change: "change what's planned",
        withSound: "with {{sound}}",
      },
      session: {
        scene: "river walk, evening",
        voice: {
          opening: "you're walking\nalong the river.\nthe air is cool.",
          during: "the city moves around you.\na motorcycle passes.\nyou keep walking.",
          calming: "that sound is part of the street.\nyou're still walking.\nyou're still safe.",
        },
        softer: "softer",
        louder: "louder",
        pulse: "pulse",
        pause: "pause",
      },
      after: {
        duration: "you were here\nfor six minutes.",
        pulseLabel: "your pulse",
        reflectionQuestion: "how was that?",
        stillHere: "still here",
        shaken: "shaken",
        steady: "steady",
        done: "done",
      },
      scenes: {
        river: { label: "river walk, evening", short: "river path" },
        park: { label: "park, evening", short: "park" },
        cafe: { label: "cafe, morning", short: "cafe" },
        road: { label: "quiet road", short: "quiet road" },
      },
      sounds: {
        motorcycle: "motorcycle",
        helicopter: "helicopter",
        fireworks: "fireworks",
        siren: "siren",
        backfire: "car backfire",
        shouting: "shouting",
      },
      crisis: {
        title: "need someone\nto talk to\nright now?",
        call: "call ERAN",
        number: "1201",
        free: "free, 24/7,\nanonymous.",
        trusted: "a person you trust",
        close: "close",
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
      setup: {
        sceneQuestion: "איפה תרצה\nללכת?",
        soundsQuestion: "אילו צלילים אתה\nמוכן לשמוע?",
        soundsHint: "בחר את מה שמרגיש נכון. תוכל לשנות זאת בכל עת.",
        ready: "מוכן",
        back: "חזור",
      },
      home: {
        greeting: "ערב טוב,\nשי.",
        todaysWalk: "ההליכה של היום",
        durationHint: "בערך שש דקות",
        begin: "התחל",
        change: "שנה את התכנון",
        withSound: "עם {{sound}}",
      },
      session: {
        scene: "טיול לאורך הנהר, ערב",
        voice: {
          opening: "אתה הולך\nלאורך הנהר.\nהאוויר קריר.",
          during: "העיר נעה סביבך.\nאופנוע חולף.\nאתה ממשיך ללכת.",
          calming: "הצליל הזה הוא חלק מהרחוב.\nאתה עדיין הולך.\nאתה עדיין בטוח.",
        },
        softer: "רך יותר",
        louder: "חזק יותר",
        pulse: "דופק",
        pause: "השהה",
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
      scenes: {
        river: { label: "טיול לאורך הנהר, ערב", short: "שביל הנהר" },
        park: { label: "פארק, ערב", short: "פארק" },
        cafe: { label: "בית קפה, בוקר", short: "בית קפה" },
        road: { label: "כביש שקט", short: "כביש שקט" },
      },
      sounds: {
        motorcycle: "אופנוע",
        helicopter: "מסוק",
        fireworks: "זיקוקים",
        siren: "סירנה",
        backfire: "פיצוץ מנוע",
        shouting: "צעקות",
      },
      crisis: {
        title: "צריך מישהו\nלדבר איתו\nעכשיו?",
        call: 'התקשר לער"ן',
        number: "1201",
        free: "חינם, 24/7,\nאנונימי.",
        trusted: "אדם שאתה סומך עליו",
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
