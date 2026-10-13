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
 */
export const test_process_ownership_linux_identity = (): void => {
  // Fields 3 through 21 are state plus 18 values; field 22 is start time.
  const preceding = ["S", ...Array.from({ length: 18 }, (_, index) => String(index + 1))].join(" ");
  const first = `10 (worker ) with spaces)) ${preceding} 9007199254740992 23 24`;
  const second = `10 (worker ) with spaces)) ${preceding} 9007199254740993 23 24`;
  TestValidator.equals("exact first start tick", ProcessOwnershipUnit.linuxIdentity(" boot-a\n", first), "boot-a:9007199254740992");
  TestValidator.equals("adjacent large start tick", ProcessOwnershipUnit.linuxIdentity("boot-a", second), "boot-a:9007199254740993");
  TestValidator.equals("reboot changes identity", ProcessOwnershipUnit.linuxIdentity("boot-b", first), "boot-b:9007199254740992");
  const missing = Object.assign(new Error("record absent"), { code: "ENOENT" });
  TestValidator.equals("missing native record", ProcessOwnershipUnit.readFailure(missing), null);
  const denied = Object.assign(new Error("access denied"), { code: "EACCES" });
  for (const failure of [denied, new Error("unknown discovery failure"), null, undefined, "broken transport"]) {
    const observed = observeThrownValue(() => ProcessOwnershipUnit.readFailure(failure));
    TestValidator.predicate("nonabsence failure stays unchanged", observed.threw && observed.error === failure);
  }
};
