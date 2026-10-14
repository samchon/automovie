import type { IAutoMovieReferenceIdentity } from "@automovie/mcp";
import { TestValidator } from "@nestia/e2e";
import { appendReferenceInventoryFile } from "../../../../packages/mcp/src/internal/appendReferenceInventoryFile";
import { admitReferenceInventoryIdentity } from "../../../../packages/mcp/src/internal/admitReferenceInventoryIdentity";
import { resolveReferenceIoFailure } from "../../../../packages/mcp/src/internal/resolveReferenceIoFailure";
import { observeInitialReferenceLayer } from "../../../../packages/mcp/src/internal/observeInitialReferenceLayer";
import { ReferenceError } from "../../../../packages/mcp/src/internal/ReferenceError";

import { observeThrownValue } from "../internal/observeThrownValue";

/** The maintained policy functions, without substitute source signatures. */
const ReferenceInventoryUnit: {
  append: typeof appendReferenceInventoryFile;
  admit: typeof admitReferenceInventoryIdentity;
  fail: typeof resolveReferenceIoFailure;
  initial: typeof observeInitialReferenceLayer;
} = {
  append: appendReferenceInventoryFile,
  admit: admitReferenceInventoryIdentity,
  fail: resolveReferenceIoFailure,
  initial: observeInitialReferenceLayer,
};

/**
 * Inventory policies admit an exact finite population and retain loss causes.
 * Typed observations exercise its policy without emulating a filesystem.
 *
 * Scenarios:
 * 1. Exactly 10,000 admitted paths append; the next append throws a refusal.
 * 2. Single-link regular identities admit; linked/special observations refuse.
 * 3. Initial layer absence requires root recheck; root loss and mid-walk loss
 *    remain failures, and primitive errors retain sanitized categories.
 *
 * @evidence contracts/testing.md#behavioral-verification Invokes actual inventory append/admission, initial-layer observation and I/O classification owners. It checks inclusive 10000 admission and next-entry refusal, regular single-link acceptance versus five identity refusals, root recheck only for initial absence, exact propagated failure identity and ten native/primitive error classifications.
 * @evidence contracts/testing.md#independent-expectations Literal 10000 limit, authored regular identity/patches, explicit recheck counts and native-code/category pairs define expectations independently of implementation output. Already created failure objects supply identity oracles; direct policy calls do not independently prove that a complete native traversal publishes no partial population after overflow.
 * @evidence contracts/testing.md#distinguishing-cases Keeps exact and over-limit population, single versus zero/two links, link/directory/other identities, present/absent initial layer, root loss during absence recovery, ordinary/permission initial failures, mid-walk absence classification, known native codes, null/undefined/string/plain-object errors and original intentional refusal identity. Reader listing/read units own composition and physical observation sequences.
 * @evidence contracts/testing.md#execution-ownership The named asynchronous test_reference_physical_inventory owns three portable groups through direct maintained policy imports and explicit observation callbacks. Arrays, scalar identities and Errors are resident inputs; no filesystem emulator/native path, descriptor, process, server, browser or renderer is started by this unit.
 */
export async function test_reference_physical_inventory(): Promise<void> {
  const files: string[] = [];
  for (let index: number = 0; index < 10_000; index++)
    ReferenceInventoryUnit.append(files, `docs/settings/${index}.md`);
  TestValidator.equals("exact inventory limit", files.length, 10_000);
  const overflow: ReturnType<typeof observeThrownValue> = observeThrownValue((): void => ReferenceInventoryUnit.append(files, "docs/settings/overflow.md"));
  TestValidator.predicate("inventory overflow", overflow.threw && overflow.error instanceof ReferenceError && overflow.error.code === "RESOURCE_LIMIT");
  const regular: IAutoMovieReferenceIdentity = {
    kind: "file", device: 1n, inode: 2n, links: 1n, size: 8n, modified: 3n, changed: 4n,
  };
  TestValidator.equals("single-link regular entry", observeThrownValue((): void => ReferenceInventoryUnit.admit(regular)).threw, false);
  for (const patch of [{ links: 2n }, { links: 0n }, { kind: "link" }, { kind: "directory" }, { kind: "other" }] as const) {
    const refusal: ReturnType<typeof observeThrownValue> = observeThrownValue((): void => ReferenceInventoryUnit.admit({ ...regular, ...patch }));
    TestValidator.predicate("linked or special inventory entry", refusal.threw && refusal.error instanceof ReferenceError && refusal.error.code === "PATH_IDENTITY_CHANGED");
  }
  const admitted: { identity: string } = { identity: "current-layer" };
  let rechecks: number = 0;
  TestValidator.equals("present initial layer", await ReferenceInventoryUnit.initial(async (): Promise<typeof admitted> => admitted, async (): Promise<void> => { rechecks++; }), admitted);
  TestValidator.equals("present layer needs no absence recovery", rechecks, 0);
  const absent: Error & { code: string } = Object.assign(new Error("initial layer absent"), { code: "ENOENT" });
  TestValidator.equals("initial layer may be empty", await ReferenceInventoryUnit.initial(async (): Promise<never> => { throw absent; }, async (): Promise<void> => { rechecks++; }), null);
  TestValidator.equals("absence requires root recheck", rechecks, 1);
  const rootLost: Error & { code: string } = Object.assign(new Error("root lost"), { code: "ENOENT" });
  let rootFailure: unknown;
  try {
    await ReferenceInventoryUnit.initial(async (): Promise<never> => { throw absent; }, async (): Promise<void> => { throw rootLost; });
  } catch (error) { rootFailure = error; }
  TestValidator.predicate("absent root is never an empty layer", rootFailure === rootLost);
  for (const failure of [
    new Error("native inspection failed"),
    Object.assign(new Error("native inspection denied"), { code: "EACCES" }),
  ]) {
    let observed: unknown;
    let threw: boolean = false;
    try { await ReferenceInventoryUnit.initial(async (): Promise<never> => { throw failure; }, async (): Promise<void> => { rechecks++; }); }
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
    const result: ReturnType<typeof observeThrownValue> = observeThrownValue((): never => ReferenceInventoryUnit.fail(failure));
    TestValidator.predicate("native failure classification", result.threw && result.error instanceof ReferenceError && result.error.code === code);
  }
  TestValidator.predicate("intentional refusal identity survives", observeThrownValue((): never => ReferenceInventoryUnit.fail(overflow.error)).error === overflow.error);
}
