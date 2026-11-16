import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";

/**
 * The rotation one hand keeps through a keyed contact sequence
 * (`manipulate`): the fingers toward the hand's first site from the body's
 * root, laid across the site's normal, and the palm against the normal. The
 * plan places the hand with it and the fingering reads every digit's tip
 * where it puts it, so both see one hand.
 *
 * @param hold The posture the act is entered with.
 * @param presses The sequence's sites with their hands, in order.
 * @param side The hand.
 * @returns The hand's world rotation from its rest.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the two directions, the fallback and who reads the rotation.
 * @evidence contracts/development/implementation.md#principled-implementation The anatomical pair of fingers and palm turned by `HumanHand.rotation`, the fingers along the reach laid across the surface.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One site, one projection, one rotation.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A reach along the normal itself, with no part across it, points the fingers forward rather than dividing by zero.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Linear in the sites with no algorithm to choose.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Called once per hand and plan.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
 */
export function manipulateFacing(
  hold: IHumanPosture,
  presses: readonly manipulateFacing.ISite[],
  side: HumanHand.Side,
): IAutoMovieQuaternion {
  const mine: manipulateFacing.ISite[] = presses.filter(
    (p: manipulateFacing.ISite): boolean => p.side === side,
  );
  const first: manipulateFacing.ISite = mine.length > 0 ? mine[0]! : presses[0]!;
  const toward: IAutoMovieVector3 = Vector3.subtract(first.site, hold.root);
  const along: IAutoMovieVector3 = Vector3.subtract(
    toward,
    Vector3.scale(first.normal, Vector3.dot(toward, first.normal)),
  );
  return HumanHand.rotation(side, {
    fingers: Vector3.length(along) > 0 ? along : { x: 0, y: 0, z: 1 },
    palm: Vector3.scale(first.normal, -1),
  });
}

/**
 * Companion of {@link manipulateFacing}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents each member.
 * @evidence contracts/development/design.md#principled-representation A site, its normal and its hand.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The three facts the rotation reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts World vectors, no frame of its own.
 */
export namespace manipulateFacing {
  /** A site a hand presses, as the rotation reads it. */
  export interface ISite {
    /** The site, world metres. */
    site: IAutoMovieVector3;

    /** Its outward normal, world. */
    normal: IAutoMovieVector3;

    /** The pressing hand. */
    side: HumanHand.Side;
  }
}
