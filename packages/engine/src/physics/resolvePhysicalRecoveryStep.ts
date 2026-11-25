import type { IAutoMoviePhysicalRecoveryState } from "@automovie/interface";

import { physicalRecoveryStepRecord } from "./physicalRecoveryStepRecord";

/**
 * The recorded steps with a limb's step under way resolved: its latest
 * unresolved record marked with when and how it ended, for replay, audio and
 * support audits.
 *
 * @param steps The recovery's recorded steps, in time order.
 * @param bone The limb's endpoint bone.
 * @param resolved When the step was resolved, local seconds, and how.
 * @returns A new list, or the input itself when the limb has no record.
 */
export function resolvePhysicalRecoveryStep(
  steps: IAutoMoviePhysicalRecoveryState["steps"],
  bone: string,
  resolved: NonNullable<
    IAutoMoviePhysicalRecoveryState["steps"][number]["resolved"]
  >,
): IAutoMoviePhysicalRecoveryState["steps"] {
  const at: number = physicalRecoveryStepRecord(steps, bone);
  return at < 0
    ? steps
    : steps.map(
        (
          step: IAutoMoviePhysicalRecoveryState["steps"][number],
          index: number,
        ): IAutoMoviePhysicalRecoveryState["steps"][number] =>
          index === at ? { ...step, resolved } : step,
      );
}
