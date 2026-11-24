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
}
