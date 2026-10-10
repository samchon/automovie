import type { IAutoMovieHumanConstructionAdmission } from "../structures/IAutoMovieHumanConstructionAdmission";
import type { IAutoMovieHumanConstructionClearanceReading } from "../structures/IAutoMovieHumanConstructionClearanceReading";
import type { IAutoMovieHumanConstructionPartReading } from "../structures/IAutoMovieHumanConstructionPartReading";
import type { IHumanConstructionCheck } from "./IHumanConstructionCheck";

/**
 * Read every original check after all requested geometry has been constructed.
 * Errors are retained as explicit refusals rather than swallowed or marked as
 * success. Ordinary builders still refuse this report before publication; an
 * explicit construction consumer can inspect the same rejected geometry.
 * A measuring check also contributes its readings; a reading that throws is
 * recorded as that owner's refusal.
 * `onCheckCompleted` receives the original owner and its actual result after
 * assert, reading and census finish. It sees no geometry, changes no verdict,
 * and an observer exception propagates to the caller outside the refusal
 * collection. Omission preserves the prior execution path.
 */
export function admitHumanConstruction(
  checks: readonly IHumanConstructionCheck[],
  onCheckCompleted?: (owner: string, accepted: boolean) => void,
): IAutoMovieHumanConstructionAdmission {
  const failures: IAutoMovieHumanConstructionAdmission["failures"] = [];
  const clearances: IAutoMovieHumanConstructionClearanceReading[] = [];
  const parts: IAutoMovieHumanConstructionPartReading[] = [];
  const report = (owner: string, error: unknown): void => {
    failures.push({
      owner,
      cause: error instanceof Error ? error.message : String(error),
    });
  };
  for (const check of checks) {
    const priorFailures = failures.length;
    let refused = false;
    try {
      check.assert();
    } catch (error) {
      refused = true;
      report(check.owner, error);
    }
    // A reading that cannot be taken is a refusal of its own: an unmeasured
    // relation must not read as a measured pass. An owner that already
    // refused keeps its one cause.
    try {
      if (check.read !== undefined) clearances.push(...check.read());
    } catch (error) {
      if (!refused) {
        refused = true;
        report(check.owner, error);
      }
    }
    try {
      if (check.census !== undefined) parts.push(...check.census());
    } catch (error) {
      if (!refused) report(check.owner, error);
    }
    // Completion is reported only after this owner's assert/read/census have
    // actually returned or their failures were retained. Observer errors are
    // caller failures and propagate instead of becoming anatomical refusals.
    onCheckCompleted?.(check.owner, failures.length === priorFailures);
  }
  return {
    accepted: failures.length === 0,
    failures,
    ...(clearances.length === 0 ? {} : { clearances }),
    ...(parts.length === 0 ? {} : { parts }),
  };
}
