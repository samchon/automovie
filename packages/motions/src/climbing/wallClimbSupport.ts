import type {
  IAutoMovieMotionHumanClimbLadder,
  IAutoMovieMotionHumanSupport,
  IAutoMovieMotionHumanWallClimb,
} from "@automovie/interface";

/** The hands and feet, in a fixed traversal order for each stance. */
const LIMBS: readonly IAutoMovieMotionHumanClimbLadder.Limb[] = [
  "leftHand",
  "rightHand",
  "leftFoot",
  "rightFoot",
];

/**
 * Build the stances for `HumanChain.support` from a route on fixed wall holds.
 * Each move changes one contact, retaining the other three. Hand targets
 * locate the grip socket and foot targets locate the toes. Quaine and
 * Martin measured the change from four contacts to three in *A biomechanical
 * study of equilibrium in sport rock climbing* (1999, DOI
 * 10.1016/S0966-6362(99)00024-7).
 * The support planner owns contact placement, timing and reach refusals.
 * Finger closure and wall contact forces are outside the point fit.
 *
 * @param route The starting holds and the ordered one-limb changes.
 * @returns The support parameters for the route.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the route's input and output, contact modes, physical premise and fit ownership.
 * @evidence contracts/development/implementation.md#principled-implementation The assignment of the moving limb changes while the other three keep their holds, matching the single-limb transfer in the climbing study. The planner fits the emitted contacts in their resolved world frames.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure A local assignment map accumulates moves and each snapshot becomes one support stance.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses all hold locations as authored and delegates kinematic fitting and reach to the existing support action.
 * @evidence contracts/development/implementation.md#efficient-algorithms Traverses the moves once and materializes four contact records per stance, the size the support planner consumes.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Retains unchanged hold assignments from the previous move and reuses the support action for all planning.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only the returned stances and their target references survive the call, proportional to the authored route.
 */
export function wallClimbSupport(
  route: IAutoMovieMotionHumanWallClimb,
): IAutoMovieMotionHumanSupport.IParams {
  const holds: Record<
    IAutoMovieMotionHumanClimbLadder.Limb,
    IAutoMovieMotionHumanWallClimb.Hold
  > = { ...route.start };
  const stance = (): IAutoMovieMotionHumanSupport.IStance => ({
    contacts: LIMBS.map(
      (
        limb: IAutoMovieMotionHumanClimbLadder.Limb,
      ): IAutoMovieMotionHumanSupport.IContact => ({
        part: limb,
        kind: limb.endsWith("Hand") ? "grip" : "bear",
        target: holds[limb],
      }),
    ),
  });
  const stances: IAutoMovieMotionHumanSupport.IStance[] = [stance()];
  for (const move of route.moves) {
    holds[move.limb] = move.to;
    stances.push(stance());
  }
  return { stances };
}
