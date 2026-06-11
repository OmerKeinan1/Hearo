import { useCallback, useEffect, useState } from "react";
import { Dimensions, Linking, Pressable, ScrollView, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useTranslation } from "react-i18next";

import { CRISIS_NUMBER, useCrisisStore } from "@/lib/storage/crisis-store";
import { fonts, tokens } from "@/lib/ui/tokens";
import {
  addTrustedContact,
  getPermissionState,
  listAllContacts,
  MAX_CONTACTS,
  PermissionState,
  requestPermission,
  ResolvedContact,
  resolveTrustedContacts,
} from "@/lib/integrations/trustedContacts";

const SCREEN_HEIGHT = Dimensions.get("window").height;
const SHEET_HEIGHT = Math.min(SCREEN_HEIGHT * 0.78, 600);
const SLIDE_MS = 600;

type SheetView = "main" | "picker";

export function CrisisSheet() {
  const { t } = useTranslation();
  const isOpen = useCrisisStore((s) => s.isOpen);
  const close = useCrisisStore((s) => s.close);

  const translateY = useSharedValue(SHEET_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  const [view, setView] = useState<SheetView>("main");
  const [permission, setPermission] = useState<PermissionState>("undetermined");
  const [trusted, setTrusted] = useState<ResolvedContact[]>([]);
  const [pickerCandidates, setPickerCandidates] = useState<ResolvedContact[] | null>(null);

  const refreshState = useCallback(async () => {
    const perm = await getPermissionState();
    setPermission(perm);
    if (perm === "granted") {
      setTrusted(await resolveTrustedContacts());
    } else {
      setTrusted([]);
    }
  }, []);

  // Reset the sheet's inner view to "main" the moment the sheet *closes*, so
  // when it re-opens the slide-up animation never flashes a stale picker view
  // before our useEffect-driven reset catches up. Re-load contacts data each
  // time the sheet opens.
  useEffect(() => {
    if (isOpen) {
      void refreshState();
    } else {
      setView("main");
      setPickerCandidates(null);
    }
  }, [isOpen, refreshState]);

  useEffect(() => {
    if (isOpen) {
      translateY.value = withTiming(0, { duration: SLIDE_MS, easing: Easing.out(Easing.cubic) });
      backdropOpacity.value = withTiming(0.55, { duration: SLIDE_MS });
    } else {
      translateY.value = withTiming(SHEET_HEIGHT, { duration: SLIDE_MS, easing: Easing.out(Easing.cubic) });
      backdropOpacity.value = withTiming(0, { duration: SLIDE_MS });
    }
  }, [isOpen, translateY, backdropOpacity]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const onCallEran = () => {
    Linking.openURL(`tel:${CRISIS_NUMBER}`).catch(() => {});
  };

  const onCallTrusted = (contact: ResolvedContact) => {
    Linking.openURL(`tel:${contact.phone}`).catch(() => {});
  };

  const onAddSomeone = async () => {
    if (trusted.length >= MAX_CONTACTS) return; // cap defense
    let perm = permission;
    if (perm !== "granted") {
      perm = await requestPermission();
      setPermission(perm);
    }
    if (perm !== "granted") return;
    const candidates = await listAllContacts();
    // Filter out already-trusted to keep the picker tidy.
    const trustedIds = new Set(trusted.map((c) => c.id));
    setPickerCandidates(candidates.filter((c) => !trustedIds.has(c.id)));
    setView("picker");
  };

  const onPickContact = async (contact: ResolvedContact) => {
    const result = await addTrustedContact(contact.id);
    if (result.ok) {
      setTrusted(await resolveTrustedContacts());
    }
    setView("main");
    setPickerCandidates(null);
  };

  const onCancelPicker = () => {
    setView("main");
    setPickerCandidates(null);
  };

  return (
    <View
      pointerEvents={isOpen ? "auto" : "none"}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
        elevation: 1000,
      }}
    >
      <Animated.View
        style={[
          { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "#000" },
          backdropStyle,
        ]}
      >
        <Pressable
          onPress={close}
          style={{ flex: 1 }}
          accessibilityLabel="close crisis support"
        />
      </Animated.View>

      <Animated.View
        style={[
          {
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: SHEET_HEIGHT,
            backgroundColor: tokens.bgElev,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingHorizontal: 32,
            paddingTop: 36,
            paddingBottom: 28,
          },
          sheetStyle,
        ]}
      >
        {view === "main" ? (
          <MainView
            t={t}
            permission={permission}
            trusted={trusted}
            onCallEran={onCallEran}
            onCallTrusted={onCallTrusted}
            onAddSomeone={onAddSomeone}
            onClose={close}
          />
        ) : (
          <PickerView
            t={t}
            candidates={pickerCandidates ?? []}
            onPick={onPickContact}
            onCancel={onCancelPicker}
          />
        )}
      </Animated.View>
    </View>
  );
}

function MainView({
  t,
  permission,
  trusted,
  onCallEran,
  onCallTrusted,
  onAddSomeone,
  onClose,
}: {
  t: (key: string) => string;
  permission: PermissionState;
  trusted: ResolvedContact[];
  onCallEran: () => void;
  onCallTrusted: (c: ResolvedContact) => void;
  onAddSomeone: () => void;
  onClose: () => void;
}) {
  const showTrustedSection = permission !== "denied";
  const showAddButton = showTrustedSection && trusted.length < MAX_CONTACTS;
  const showFullMessage = showTrustedSection && trusted.length >= MAX_CONTACTS;

  return (
    <View style={{ flex: 1 }}>
      <Text
        style={{
          color: tokens.text,
          fontFamily: fonts.display,
          fontSize: 28,
          lineHeight: 38,
        }}
      >
        {t("crisis.title")}
      </Text>

      <Pressable onPress={onCallEran} hitSlop={8} style={{ marginTop: 36 }}>
        <Text
          style={{
            color: tokens.accent,
            fontFamily: fonts.displayMedium,
            fontSize: 30,
            lineHeight: 40,
          }}
        >
          {t("crisis.call")} {t("crisis.number")}
        </Text>
        <Text
          style={{
            color: tokens.textMute,
            fontFamily: fonts.body,
            fontSize: 14,
            lineHeight: 20,
            marginTop: 8,
          }}
        >
          {t("crisis.free")}
        </Text>
      </Pressable>

      <View
        style={{
          height: 1,
          backgroundColor: tokens.textMute,
          opacity: 0.25,
          marginTop: 24,
          marginBottom: 16,
        }}
      />

      {showTrustedSection ? (
        <View>
          <Text
            style={{
              color: tokens.textMute,
              fontFamily: fonts.body,
              fontSize: 13,
              letterSpacing: 1.4,
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            {t("crisis.trusted")}
          </Text>

          {trusted.map((c) => (
            <Pressable
              key={c.id}
              onPress={() => onCallTrusted(c)}
              hitSlop={6}
              style={{ paddingVertical: 8 }}
            >
              <Text
                style={{
                  color: tokens.text,
                  fontFamily: fonts.body,
                  fontSize: 17,
                }}
              >
                {c.name}
              </Text>
            </Pressable>
          ))}

          {showAddButton ? (
            <Pressable onPress={onAddSomeone} hitSlop={6} style={{ paddingVertical: 8 }}>
              <Text
                style={{
                  color: tokens.accent,
                  fontFamily: fonts.body,
                  fontSize: 15,
                }}
              >
                {t("crisis.trustedContacts.addSomeone")}  +
              </Text>
            </Pressable>
          ) : null}

          {showFullMessage ? (
            <Text
              style={{
                color: tokens.textMute,
                fontFamily: fonts.body,
                fontSize: 13,
                marginTop: 8,
              }}
            >
              {t("crisis.trustedContacts.listFull")}
            </Text>
          ) : null}
        </View>
      ) : (
        <Text
          style={{
            color: tokens.textMute,
            fontFamily: fonts.body,
            fontSize: 14,
            lineHeight: 20,
          }}
        >
          {t("crisis.trustedContacts.denyExplanation")}
        </Text>
      )}

      <View style={{ flex: 1 }} />

      <Pressable
        onPress={onClose}
        hitSlop={12}
        style={{ alignSelf: "flex-start" }}
      >
        <Text
          style={{
            color: tokens.textMute,
            fontFamily: fonts.body,
            fontSize: 15,
          }}
        >
          {t("crisis.close")}
        </Text>
      </Pressable>
    </View>
  );
}

function PickerView({
  t,
  candidates,
  onPick,
  onCancel,
}: {
  t: (key: string) => string;
  candidates: ResolvedContact[];
  onPick: (c: ResolvedContact) => void;
  onCancel: () => void;
}) {
  return (
    <View style={{ flex: 1 }}>
      <Text
        style={{
          color: tokens.text,
          fontFamily: fonts.display,
          fontSize: 24,
          lineHeight: 32,
          marginBottom: 18,
        }}
      >
        {t("crisis.trustedContacts.pickHeading")}
      </Text>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {candidates.map((c) => (
          <Pressable
            key={c.id}
            onPress={() => onPick(c)}
            hitSlop={4}
            style={{ paddingVertical: 12 }}
          >
            <Text
              style={{
                color: tokens.text,
                fontFamily: fonts.body,
                fontSize: 17,
              }}
            >
              {c.name}
            </Text>
            <Text
              style={{
                color: tokens.textMute,
                fontFamily: fonts.body,
                fontSize: 13,
                marginTop: 2,
              }}
            >
              {c.phone}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <Pressable onPress={onCancel} hitSlop={12} style={{ marginTop: 16, alignSelf: "flex-start" }}>
        <Text
          style={{
            color: tokens.textMute,
            fontFamily: fonts.body,
            fontSize: 15,
          }}
        >
          {t("crisis.close")}
        </Text>
      </Pressable>
    </View>
  );
}
