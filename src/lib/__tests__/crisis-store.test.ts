import { useCrisisStore, CRISIS_NUMBER } from "@/lib/crisis-store";

// Tier 1 — safety-critical. Wrong state here = a veteran in crisis can't reach
// help. The hard-coded number is a regression tripwire on purpose.
describe("crisis-store", () => {
  beforeEach(() => {
    useCrisisStore.setState({ isOpen: false, showingTrustedStub: false });
  });

  it("exposes the ERAN hotline number 1201", () => {
    expect(CRISIS_NUMBER).toBe("1201");
  });

  it("open() opens the sheet and resets the trusted stub", () => {
    useCrisisStore.setState({ showingTrustedStub: true });
    useCrisisStore.getState().open();
    expect(useCrisisStore.getState().isOpen).toBe(true);
    expect(useCrisisStore.getState().showingTrustedStub).toBe(false);
  });

  it("close() closes the sheet and resets the trusted stub", () => {
    useCrisisStore.setState({ isOpen: true, showingTrustedStub: true });
    useCrisisStore.getState().close();
    expect(useCrisisStore.getState().isOpen).toBe(false);
    expect(useCrisisStore.getState().showingTrustedStub).toBe(false);
  });

  it("showTrustedStub() flips only the stub flag, leaving the sheet open", () => {
    useCrisisStore.getState().open();
    useCrisisStore.getState().showTrustedStub();
    expect(useCrisisStore.getState().showingTrustedStub).toBe(true);
    expect(useCrisisStore.getState().isOpen).toBe(true);
  });
});
