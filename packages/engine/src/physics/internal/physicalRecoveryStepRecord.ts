import type { IAutoMoviePhysicalRecoveryState } from "@automovie/interface";

/*
 * Where a limb's step under way is recorded: its latest unresolved record.
 * Parameter steps: The recovery's recorded steps, in time order.
 * Parameter bone: The limb's endpoint bone.
 * Returns: The record's index, or -1 when the limb has none.
 */
export function physicalRecoveryStepRecord(
  steps: IAutoMoviePhysicalRecoveryState["steps"],
  bone: string,
): number {
  for (let index: number = steps.length - 1; index >= 0; index--)
    if (steps[index]!.bone === bone && !steps[index]!.resolved) return index;
  return -1;
}
