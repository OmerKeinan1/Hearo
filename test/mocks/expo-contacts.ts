// Shared manual mock for `expo-contacts`.
//
// expo-contacts ships an ES-class native module whose superclass is undefined
// under jest-expo ("Super expression must either be null or a function"), so it
// cannot be auto-mocked or imported directly in a test. Suites opt in with:
//
//   jest.mock("expo-contacts", () => require("../../../test/mocks/expo-contacts"));
//   import * as contactsMock from "../../../test/mocks/expo-contacts";
//
// then configure return values per-test and call `contactsMock.__reset()` in a
// beforeEach to restore the baseline + clear call history.

export const getPermissionsAsync = jest.fn();
export const requestPermissionsAsync = jest.fn();
export const getContactByIdAsync = jest.fn();
export const getContactsAsync = jest.fn();

// Field/sort enums the code references by value at call time.
export const Fields = { Name: "Name", PhoneNumbers: "PhoneNumbers" };
export const SortTypes = { FirstName: "FirstName" };

/** Restore baseline implementations and clear call history. Call in beforeEach. */
export function __reset(): void {
  getPermissionsAsync.mockReset().mockResolvedValue({ status: "granted" });
  requestPermissionsAsync.mockReset().mockResolvedValue({ status: "granted" });
  getContactByIdAsync.mockReset().mockResolvedValue(undefined);
  getContactsAsync.mockReset().mockResolvedValue({ data: [] });
}
