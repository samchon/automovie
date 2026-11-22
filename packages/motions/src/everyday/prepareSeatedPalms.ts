import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
} from "@automovie/interface";

import { handReach } from "./handReach";
import { prepareThighSkin } from "./prepareThighSkin";

/** The thigh intersection and hand support function in their own rigid coordinates. */
interface IPalm {
  /** Put the fixed skin hit onto a current resolved thigh bone. */
  readonly skin: ReturnType<typeof prepareThighSkin>;

  /** Depth of the flat hand past its palm in a given wrist-local direction, metres. */
  readonly reach: ReturnType<typeof handReach>;
}

/**
 * Prepare thigh-local rays and the flat palms' geometry for a seated shift.
 * The placed posture changes by translating its root and fitting its planted
 * legs. Thigh motion transports the same skin point, and the arm's changing
 * world rotation only changes the direction of a hand-local support query.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the body-local geometry and current thigh and wrist frames.
 * @evidence contracts/development/implementation.md#principled-implementation Prepares the canonical local skin ray and the original full flat hand shape and extent reader for each side at its entry articulation.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Bind two fixed geometry readers per side; the ongoing seated writer selects the current transform and direction.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses the real body surfaces and colliders and keeps the current joint observations, palm direction, and hand extent computation.
 * @evidence contracts/development/implementation.md#efficient-algorithms Pays the flat hand's FK and the thigh ray march once per side in setup; subsequent reads transform one point and scan the fixed hand extents.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Root translation and world wrist rotation preserve the flat hand's local geometry. Only scalar extents in the actual requested direction are evaluated live.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One fixed thigh point and bounded placed flat hand geometry per side release with the plan; no current posture, FK loan or queried time is retained.
 */
export function prepareSeatedPalms(
  body: IAutoMovieMotionHumanBody,
  entry: IAutoMovieMotionHumanPosture,
): Record<AutoMovieHumanSide, IPalm> {
  const local: IAutoMovieMotionHumanPosture = {
    ...entry, root: { x: 0, y: 0, z: 0 }, limbs: {},
  };
  const identity: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };
  return { left: prepare("left"), right: prepare("right") };

  /** Read the thigh and fixed palm geometry once for the named side. */
  function prepare(side: AutoMovieHumanSide): IPalm {
    return {
      skin: prepareThighSkin(body, side),
      reach: handReach(body, local, side, identity, "palm", "flat"),
    };
  }
}
