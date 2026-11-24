import type {
  IAutoMoviePhysicalRecoveryState,
  IAutoMovieStepPlanner,
} from "@automovie/interface";

/**
 * The steps a recovery has under way: its swing and, while a four-support body
 * steps a diagonal pair, the swing's partner, which lifts with it and lands by
 * its own contact (`advancePhysicalBalance`; Chen et al. 2022, Section 2.1,
 * Example 1). Each is asked for, still giving up its share of the stance,
 * until its limb lifts.
 *
 * @param state The recovery's state, if any.
 * @returns The swing first, then its partner; empty with no swing.
 */
export function physicalRecoverySwing(
  state: IAutoMoviePhysicalRecoveryState | undefined,
): IAutoMovieStepPlanner.IStep[] {
  return state?.swing
    ? [state.swing, ...(state.pair ? [state.pair.step] : [])]
    : [];
}

/** Which limbs a recovery's steps under way hold, lifted or still asked for. */
export namespace physicalRecoverySwing {
  /**
   * The step under way for a limb, if any.
   *
   * @param state The recovery's state, if any.
   * @param bone The limb's endpoint bone.
   * @returns Its step, or undefined.
   */
  export function of(
    state: IAutoMoviePhysicalRecoveryState | undefined,
    bone: string,
  ): IAutoMovieStepPlanner.IStep | undefined {
    return physicalRecoverySwing(state).find(
      (step: IAutoMovieStepPlanner.IStep): boolean => step.bone === bone,
    );
  }

  /**
   * The limbs a recovery swing has lifted: under way and no longer seated,
   * which the stance and support tracking no longer carry.
   *
   * @param state The recovery's state, if any.
   * @returns Their endpoint bones, the swing's first.
   */
  export function lifted(
    state: IAutoMoviePhysicalRecoveryState | undefined,
  ): string[] {
    return physicalRecoverySwing(state)
      .map((step: IAutoMovieStepPlanner.IStep): string => step.bone)
      .filter((bone: string): boolean => !state?.seating?.[bone]);
  }

  /**
   * The limbs asked to step that have not lifted: still support, each giving
   * up its share over its unloading ramp.
   *
   * @param state The recovery's state, if any.
   * @returns Their endpoint bones, the swing's first.
   */
  export function requested(
    state: IAutoMoviePhysicalRecoveryState | undefined,
  ): string[] {
    return physicalRecoverySwing(state)
      .map((step: IAutoMovieStepPlanner.IStep): string => step.bone)
      .filter((bone: string): boolean => !!state?.seating?.[bone]);
  }

  /**
   * A step timed from a moment again: its start moved there and its end with
   * it, keeping its duration. A request not yet lifted keeps being timed from
   * now until it lifts, and is timed from its lift-off then.
   *
   * @param step The step.
   * @param seconds The new start, local seconds.
   * @returns A new step; the input is unchanged.
   */
  export function retime(
    step: IAutoMovieStepPlanner.IStep,
    seconds: number,
  ): IAutoMovieStepPlanner.IStep {
    return { ...step, end: seconds + (step.end - step.start), start: seconds };
  }

  /**
   * Where a limb's step under way is recorded: its latest unresolved record.
   *
   * @param steps The recovery's recorded steps, in time order.
   * @param bone The limb's endpoint bone.
   * @returns The record's index, or -1 when the limb has none.
   */
  export function record(
    steps: IAutoMoviePhysicalRecoveryState["steps"],
    bone: string,
  ): number {
    for (let index: number = steps.length - 1; index >= 0; index--)
      if (steps[index]!.bone === bone && !steps[index]!.resolved) return index;
    return -1;
  }

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
  export function resolve(
    steps: IAutoMoviePhysicalRecoveryState["steps"],
    bone: string,
    resolved: NonNullable<
      IAutoMoviePhysicalRecoveryState["steps"][number]["resolved"]
    >,
  ): IAutoMoviePhysicalRecoveryState["steps"] {
    const at: number = record(steps, bone);
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
}
