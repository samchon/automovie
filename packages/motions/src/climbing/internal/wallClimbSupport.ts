import type {
  IAutoMovieMotionHumanClimbLadder,
  IAutoMovieMotionHumanSupport,
  IAutoMovieMotionHumanWallClimb,
} from "@automovie/interface";

import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";

/*
 * Build the stances for `AutoMovieMotionHumanChain.support` from a route on fixed wall holds.
 * Each stance owns at least three distinct holds. Releasing one foot before the
 * other takes its hold stages a swap without sharing a contact point. Hand
 * targets locate the grip socket and foot targets locate the toes. Quaine and
 * Martin measured the change from four contacts to three in _A biomechanical
 * study of equilibrium in sport rock climbing_ (1999, DOI
 * 10.1016/S0966-6362(99)00024-7). The support planner owns contact placement,
 * timing and reach refusals. Finger closure and wall contact forces are outside
 * the point fit.
 * Parameter route: The starting holds and the ordered one-limb changes.
 * Returns: The support parameters for the route.
 * If two limbs claim one hold or an explicit release
 * would leave fewer than three assignments.
 */
export function wallClimbSupport(
  route: IAutoMovieMotionHumanWallClimb,
): IAutoMovieMotionHumanSupport.IParams {
  const holds: Partial<
    Record<
      IAutoMovieMotionHumanClimbLadder.Limb,
      IAutoMovieMotionHumanWallClimb.Hold
    >
  > = { ...route.start };
  const stance = (
    move?: IAutoMovieMotionHumanWallClimb.IMove,
  ): IAutoMovieMotionHumanSupport.IStance => {
    const contacts: IAutoMovieMotionHumanSupport.IContact[] = [];
    const occupied: Map<string, IAutoMovieMotionHumanClimbLadder.Limb> =
      new Map();
    for (const limb of LIMBS) {
      const target: IAutoMovieMotionHumanWallClimb.Hold | undefined =
        holds[limb];
      if (target === undefined) continue;
      const id: string = holdIdentity(target);
      const other: IAutoMovieMotionHumanClimbLadder.Limb | undefined =
        occupied.get(id);
      if (other !== undefined)
        throw new AutoMovieMotionHumanRefusal({
          kind: "parameter",
          axis: move === undefined ? "start" : "moves",
          value: target,
          reason: `${limb} and ${other} cannot occupy the same wall hold`,
          fix: "release the occupied hold before assigning it to another limb",
        });
      occupied.set(id, limb);
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
      if (
        LIMBS.some(
          (limb: IAutoMovieMotionHumanClimbLadder.Limb): boolean =>
            holds[limb] === undefined,
        )
      )
        throw new AutoMovieMotionHumanRefusal({
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

/*
 * The hands and feet, in a fixed traversal order for each stance.
 */
const LIMBS: readonly IAutoMovieMotionHumanClimbLadder.Limb[] = [
  "leftHand",
  "rightHand",
  "leftFoot",
  "rightFoot",
];

/*
 * Equality of one authored hold location before a scene resolves its frame.
 * Parameter target: The named prop point or explicit point in its authored frame.
 * Returns: The identity used to detect simultaneous claims to one location.
 */
function holdIdentity(target: IAutoMovieMotionHumanWallClimb.Hold): string {
  return target.kind === "prop"
    ? JSON.stringify(["prop", target.subject, target.point])
    : JSON.stringify([target.frame, target.at.x, target.at.y, target.at.z]);
}
