import type {
  IAutoMovieMotionHumanClimbLadder,
  IAutoMovieMotionHumanSupport,
  IAutoMovieMotionHumanWallClimb,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";

/** The hands and feet, in a fixed traversal order for each stance. */
const LIMBS: readonly IAutoMovieMotionHumanClimbLadder.Limb[] = [
  "leftHand",
  "rightHand",
  "leftFoot",
  "rightFoot",
];

/**
 * Build the stances for `HumanChain.support` from a route on fixed wall holds.
 * Each move changes one assignment and leaves at least three contacts.
 * Releasing one foot before the other takes its hold stages a swap.
 * Hand targets locate the grip socket and foot targets locate the toes. Quaine and
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
 * @evidence contracts/development/implementation.md#principled-implementation Each move changes only the assignment of the moving limb. An explicit release keeps three contacts, matching the three-contact state in the climbing study. The planner fits the emitted contacts in their resolved world frames.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure A local assignment map accumulates moves and each snapshot becomes one support stance.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses all hold locations as authored and delegates kinematic fitting and reach to the existing support action.
 * @evidence contracts/development/implementation.md#efficient-algorithms Traverses the moves once and materializes four contact records per stance, the size the support planner consumes.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Retains unchanged hold assignments from the previous move and reuses the support action for all planning.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only the returned stances and their target references survive the call, proportional to the authored route.
 */
export function wallClimbSupport(
  route: IAutoMovieMotionHumanWallClimb,
): IAutoMovieMotionHumanSupport.IParams {
  const holds: Partial<Record<
    IAutoMovieMotionHumanClimbLadder.Limb,
    IAutoMovieMotionHumanWallClimb.Hold
  >> = { ...route.start };
  const stance = (
    move?: IAutoMovieMotionHumanWallClimb.IMove,
  ): IAutoMovieMotionHumanSupport.IStance => {
    const contacts: IAutoMovieMotionHumanSupport.IContact[] = [];
    for (const limb of LIMBS) {
      const target: IAutoMovieMotionHumanWallClimb.Hold | undefined = holds[limb];
      if (target === undefined) continue;
      contacts.push({
        part: limb,
        kind: limb.endsWith("Hand") ? "grip" : "bear",
        target,
      });
    }
    return {
      contacts,
      ...(move?.seconds === undefined ? {} : { seconds: move.seconds }),
      ...(move?.event === undefined ? {} : { event: move.event }),
      ...(move?.turn === undefined ? {} : { turn: move.turn }),
    };
  };
  const stances: IAutoMovieMotionHumanSupport.IStance[] = [stance()];
  for (const move of route.moves) {
    if (move.to === null) {
      if (LIMBS.some((limb: IAutoMovieMotionHumanClimbLadder.Limb): boolean => holds[limb] === undefined))
        throw new HumanRefusal({
          kind: "parameter",
          axis: "moves",
          value: move.limb,
          feasible: null,
          reason: "a wall-climb release must leave three contacts",
          fix: "acquire a hold with the free limb before releasing another",
        });
      delete holds[move.limb];
    } else holds[move.limb] = move.to;
    stances.push(stance(move));
  }
  return { stances };
}
