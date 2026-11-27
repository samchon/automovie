import type {
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieMotionHumanStretch,
} from "@automovie/interface";

/** One support the entry stands on. */
type Support = IAutoMovieMotionHumanEntryState["supports"][number];

/**
 * Whether the law's own standing entry admits the compact hold: standing on the
 * ground alone, nothing held or used, and a posture without digits, a rotation
 * or a limb goal that touches, clears or rests on anything.
 *
 * @param context The stretch's context.
 * @returns Whether the hold may play from the compact plan.
 */
export function stretchHoldInputs(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanStretch.IParams>,
): boolean {
  const entry: IAutoMovieMotionHumanEntryState = context.entry;
  return (
    entry.base.kind === "standing" &&
    Object.keys(entry.holds).length === 0 &&
    Object.keys(entry.uses).length === 0 &&
    entry.supports.every(
      (support: Support): boolean => support.support.kind === "ground",
    ) &&
    entry.posture.digits === undefined &&
    entry.posture.rotation === undefined &&
    Object.values(entry.posture.limbs).every(
      (goal: IAutoMovieHumanLimbGoal | undefined): boolean =>
        goal === undefined ||
        (goal.on === undefined &&
          goal.clear === undefined &&
          goal.rests === undefined &&
          goal.clearanceOn === undefined),
    )
  );
}
