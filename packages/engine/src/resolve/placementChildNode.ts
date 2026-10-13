import { placementNodePrefix } from "./placementNodePrefix";

/**
 * The scene-graph id of one node lowered under a placement.
 *
 * A bone of a placed actor and a joint of a placed prop are the same naming
 * question, so they get the same answer: `"frontDoor"` plus `"hinge"` is
 * `"frontDoor/hinge"`, which is what a clip track, a bound profile limit and a
 * viewer lookup must all spell identically.
 */
export const placementChildNode = (placement: string, child: string): string =>
  `${placementNodePrefix(placement)}${child}`;
