import { TestValidator } from "@nestia/e2e";

import { ProcessOwnershipUnit } from "../internal/ProcessOwnershipUnit";
import { observeThrownValue } from "../internal/observeThrownValue";

/**
 * Linux identity joins boot generation with exact start ticks from field 22,
 * without treating the parenthesized command name as space-delimited fields.
 * Discovery failure grants no fabricated identity.
 *
 * Scenarios:
 *
 * 1. A name containing spaces and closing parentheses still yields field 22;
 *    large adjacent ticks and changed boot IDs remain distinct identities.
 * 2. A missing native record is absence, while access errors and unexpected
 *    thrown values propagate exactly rather than inventing stop authority.
 * 3. Empty boot text, empty records, missing field 22 and nondecimal ticks
 *    refuse instead of fabricating an identity ending in undefined.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls production Linux text decoding and native-read error classification through the existing loader; exact tick strings and original thrown values are asserted, and malformed native fields must throw an Error.
 * @evidence contracts/testing.md#independent-expectations The Kernel proc field table places start_time at field22 after state and eighteen preceding values; independently arranged adjacent decimal ticks expose Number rounding, and ENOENT versus EACCES distinguishes absence from failure. These text cases do not prove a live Linux kernel or stopping an OS process.
 * @evidence contracts/testing.md#distinguishing-cases Covers spaces/closing parentheses in comm, adjacent beyond-safe-integer ticks, boot changes, blank boot/record, omitted/nondecimal start text, ENOENT and nonabsence errors including null/undefined/string throws; capture authority and Windows transport belong to neighboring tests.
 * @evidence contracts/testing.md#execution-ownership The named exported unit entry invokes portable production decoders via the existing ProcessOwnershipUnit source loader, with authored native-text values only; no proc filesystem, subprocess, browser, GPU or dynamically registered test is started.
 */
export function test_process_ownership_linux_identity(): void {
  // Fields 3 through 21 are state plus 18 values; field 22 is start time.
  const preceding: string = [
    "S",
    ...Array.from({ length: 18 }, (_: unknown, index: number): string =>
      String(index + 1),
    ),
  ].join(" ");
  const first: string = `10 (worker ) with spaces)) ${preceding} 9007199254740992 23 24`;
  const second: string = `10 (worker ) with spaces)) ${preceding} 9007199254740993 23 24`;
  TestValidator.equals(
    "exact first start tick",
    ProcessOwnershipUnit.linuxIdentity(" boot-a\n", first),
    "boot-a:9007199254740992",
  );
  TestValidator.equals(
    "adjacent large start tick",
    ProcessOwnershipUnit.linuxIdentity("boot-a", second),
    "boot-a:9007199254740993",
  );
  TestValidator.equals(
    "reboot changes identity",
    ProcessOwnershipUnit.linuxIdentity("boot-b", first),
    "boot-b:9007199254740992",
  );
  for (const [boot, stat] of [
    ["", first],
    ["boot-a", ""],
    ["boot-a", `10 (worker) ${preceding}`],
    ["boot-a", `10 (worker) ${preceding} missing 23 24`],
  ] as const) {
    const malformed: ReturnType<typeof observeThrownValue> = observeThrownValue(
      (): string => ProcessOwnershipUnit.linuxIdentity(boot, stat),
    );
    TestValidator.predicate(
      "malformed native identity refuses instead of publishing undefined ticks",
      malformed.threw && malformed.error instanceof Error,
    );
  }
  const missing: Error & { code: string } = Object.assign(
    new Error("record absent"),
    { code: "ENOENT" },
  );
  TestValidator.equals(
    "missing native record",
    ProcessOwnershipUnit.readFailure(missing),
    null,
  );
  const denied: Error & { code: string } = Object.assign(
    new Error("access denied"),
    { code: "EACCES" },
  );
  for (const failure of [
    denied,
    new Error("unknown discovery failure"),
    null,
    undefined,
    "broken transport",
  ]) {
    const observed: ReturnType<typeof observeThrownValue> = observeThrownValue(
      (): null => ProcessOwnershipUnit.readFailure(failure),
    );
    TestValidator.predicate(
      "nonabsence failure stays unchanged",
      observed.threw && observed.error === failure,
    );
  }
}
