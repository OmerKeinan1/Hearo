import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { CalmingProtocol } from "@/components/features/calming/CalmingProtocol";
import { CrisisAffordance } from "@/components/features/crisis/CrisisAffordance";
import { useSessionStore } from "@/lib/storage/session-store";

/** Self-tap calming protocol (B-03 v1). Reached from:
 *  - the in-session "I need a moment" affordance (replaces the session route)
 *  - the Home "Need a moment?" button (pushes onto the stack)
 *
 *  On completion: records `lastEndedBy = "calming-protocol"` and routes to
 *  /after via `replace`, matching how every other session-end pathway closes
 *  the loop. There is intentionally NO mid-protocol exit affordance — see
 *  calming-protocol spec §"No mid-flow exit". */
export default function Calming() {
  const router = useRouter();
  const setLastEndedBy = useSessionStore((s) => s.setLastEndedBy);

  function handleProtocolEnd() {
    setLastEndedBy("calming-protocol");
    router.replace("/after");
  }

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <View className="flex-row justify-between items-center pt-2 px-8">
        <CrisisAffordance />
      </View>
      <CalmingProtocol onProtocolEnd={handleProtocolEnd} />
    </SafeAreaView>
  );
}
