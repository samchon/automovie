import type { IAutoMovieReferenceIdentity } from "@automovie/mcp";
import { TestValidator } from "@nestia/e2e";

import { ReferenceInventoryUnit } from "../internal/ReferenceInventoryUnit";
import { observeThrownValue } from "../internal/observeThrownValue";

/**
 * The native walker admits an exact finite inventory and retains loss causes.
 * Typed observations exercise its policy without emulating a filesystem.
 *
 * Scenarios:
 * 1. Exactly 10,000 admitted paths append; the next refuses the whole result.
 * 2. Single-link regular identities admit; linked/special observations refuse.
 * 3. Initial layer absence requires root recheck; root loss and mid-walk loss
 *    remain failures, and primitive errors retain sanitized categories.
 */
export const test_reference_physical_inventory = async (): Promise<void> => {
  const files: string[] = [];
  for (let index = 0; index < 10_000; index++)
    ReferenceInventoryUnit.append(files, `docs/settings/${index}.md`);
  TestValidator.equals("exact inventory limit", files.length, 10_000);
  const overflow = observeThrownValue(() => ReferenceInventoryUnit.append(files, "docs/settings/overflow.md"));
  TestValidator.predicate("inventory overflow", overflow.threw && (overflow.error as { code: string }).code === "RESOURCE_LIMIT");
  const regular: IAutoMovieReferenceIdentity = {
    kind: "file", device: 1n, inode: 2n, links: 1n, size: 8n, modified: 3n, changed: 4n,
  };
  TestValidator.equals("single-link regular entry", observeThrownValue(() => ReferenceInventoryUnit.admit(regular)).threw, false);
  for (const patch of [{ links: 2n }, { links: 0n }, { kind: "link" }, { kind: "directory" }, { kind: "other" }] as const) {
    const refusal = observeThrownValue(() => ReferenceInventoryUnit.admit({ ...regular, ...patch }));
    TestValidator.predicate("linked or special inventory entry", refusal.threw && (refusal.error as { code: string }).code === "PATH_IDENTITY_CHANGED");
  }
  const admitted = { identity: "current-layer" };
  let rechecks = 0;
  TestValidator.equals("present initial layer", await ReferenceInventoryUnit.initial(async () => admitted, async () => { rechecks++; }), admitted);
  TestValidator.equals("present layer needs no absence recovery", rechecks, 0);
  const absent = Object.assign(new Error("initial layer absent"), { code: "ENOENT" });
  TestValidator.equals("initial layer may be empty", await ReferenceInventoryUnit.initial(async () => { throw absent; }, async () => { rechecks++; }), null);
  TestValidator.equals("absence requires root recheck", rechecks, 1);
  const rootLost = Object.assign(new Error("root lost"), { code: "ENOENT" });
  let rootFailure: unknown;
  try {
    await ReferenceInventoryUnit.initial(async () => { throw absent; }, async () => { throw rootLost; });
  } catch (error) { rootFailure = error; }
  TestValidator.predicate("absent root is never an empty layer", rootFailure === rootLost);
  for (const failure of [
    new Error("native inspection failed"),
    Object.assign(new Error("native inspection denied"), { code: "EACCES" }),
  ]) {
    let observed: unknown;
    let threw = false;
    try { await ReferenceInventoryUnit.initial(async () => { throw failure; }, async () => { rechecks++; }); }
    catch (error) { observed = error; threw = true; }
    TestValidator.predicate("nonabsence initial failure propagates", threw && observed === failure);
  }
  TestValidator.equals("other failures never recover as empty", rechecks, 1);
  for (const [failure, code] of [
    [rootLost, "MISSING_FILE"],
    [Object.assign(new Error("population disappeared mid-walk"), { code: "ENOENT" }), "MISSING_FILE"],
    [{ code: "EACCES" }, "PERMISSION_DENIED"], [{ code: "EPERM" }, "PERMISSION_DENIED"],
    [{ code: "ELOOP" }, "PATH_IDENTITY_CHANGED"], [{ code: "ENOTDIR" }, "PATH_IDENTITY_CHANGED"],
    [null, "IO_ERROR"], [undefined, "IO_ERROR"], ["broken", "IO_ERROR"], [{}, "IO_ERROR"],
  ] as const) {
    const result = observeThrownValue(() => ReferenceInventoryUnit.fail(failure));
    TestValidator.predicate("native failure classification", result.threw && (result.error as { code: string }).code === code);
  }
  TestValidator.predicate("intentional refusal identity survives", observeThrownValue(() => ReferenceInventoryUnit.fail(overflow.error)).error === overflow.error);
};
