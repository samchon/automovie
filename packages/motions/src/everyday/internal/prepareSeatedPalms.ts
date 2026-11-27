import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
} from "@automovie/interface";

import { handReach } from "./handReach";
import { prepareThighSkin } from "./prepareThighSkin";
import { seatedFlatHand } from "./seatedFlatHand";

/*
 * Prepare thigh-local rays and the flat palms' geometry for a seated shift. The
 * placed posture changes by translating its root and fitting its planted legs.
 * Thigh motion transports the same skin point, and the arm's changing world
 * rotation only changes the direction of a hand-local support query.
 */
export function prepareSeatedPalms(
  body: IAutoMovieMotionHumanBody,
  entry: IAutoMovieMotionHumanPosture,
): Record<AutoMovieHumanSide, IPalm> {
  const local: IAutoMovieMotionHumanPosture = {
    ...entry,
    root: { x: 0, y: 0, z: 0 },
    limbs: {},
  };
  const identity: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };
  return { left: prepare("left"), right: prepare("right") };

  /*
   * Read the thigh and fixed palm geometry once for the named side.
   */
  function prepare(side: AutoMovieHumanSide): IPalm {
    return {
      skin: prepareThighSkin(body, side),
      reach: handReach(
        body,
        seatedFlatHand(body, local, side, 1),
        side,
        identity,
        "palm",
      ),
    };
  }
}

/*
 * The thigh intersection and hand support function in their own rigid
 * coordinates.
 */
interface IPalm {
  /*
   * Put the fixed skin hit onto a current resolved thigh bone.
   */
  readonly skin: ReturnType<typeof prepareThighSkin>;

  /*
   * Depth of the flat hand past its palm in a given wrist-local direction,
   * metres.
   */
  readonly reach: ReturnType<typeof handReach>;
}
