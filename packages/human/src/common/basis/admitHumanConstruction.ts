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
 *
 * @evidence contracts/common.md#principled-implementation Runs each original assertion followed by optional readings/census, keeps its first refusal, and propagates observer exceptions outside anatomical refusals.
 * @evidence contracts/common.md#clear-and-simple-design One aggregate report owns admission results; createHumanFaceConstructionEntries owns publication and rejection of the constructed geometry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Refusals retain actual causes; ordinary authoring uses the same assertions while inspection adds actual measured rows.
 * @evidence contracts/common.md#meaningful-documentation Documents callback order, optional result fields and the distinct observer failure effect.
 * @evidence contracts/performance.md#efficient-algorithms For C checks and R reading/P census rows, aggregation is O(C+R+P) plus callback costs; the full check pass prevents an early refusal hiding later owners.
 * @evidence contracts/performance.md#reuse-equivalent-work Uses the supplied captured callbacks once without rebuilding geometry; mutable checks and observer effects are not memoized across requests.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Local report arrays grow with this check population and transfer on return; observer failure abandons those arrays and no handle is opened.
 */
export function admitHumanConstruction(
  checks: readonly IHumanConstructionCheck[],
  onCheckCompleted?: (owner: string, accepted: boolean) => void,
): IAutoMovieHumanConstructionAdmission {
  const failures: IAutoMovieHumanConstructionAdmission["failures"] = [];
  const clearances: IAutoMovieHumanConstructionClearanceReading[] = [];
  const parts: IAutoMovieHumanConstructionPartReading[] = [];
  const report: (owner: string, error: unknown) => void = (
    owner: string,
    error: unknown,
  ): void => {
    failures.push({
      owner,
      cause: error instanceof Error ? error.message : String(error),
    });
  };
  for (const check of checks) {
    const priorFailures: number = failures.length;
    let refused: boolean = false;
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
