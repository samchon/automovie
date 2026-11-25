import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanManipulateFacing,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanHand } from "../posture/HumanHand";

/**
 * The rotation one hand keeps through a keyed contact sequence (`manipulate`):
 * the fingers toward the hand's first site from the body's root, laid across
 * the site's normal, and the palm against the normal. The plan places the hand
 * with it and the fingering reads every digit's tip where it puts it, so both
 * see one hand.
 *
 * @param hold The posture the act is entered with.
 * @param presses The sequence's sites with their hands, in order.
 * @param side The hand.
 * @returns The hand's world rotation from its rest.
 */
export function manipulateFacing(
  hold: IAutoMovieMotionHumanPosture,
  presses: readonly IAutoMovieMotionHumanManipulateFacing.ISite[],
  side: AutoMovieHumanSide,
): IAutoMovieQuaternion {
  const mine: IAutoMovieMotionHumanManipulateFacing.ISite | undefined =
    presses.find(
      (p: IAutoMovieMotionHumanManipulateFacing.ISite): boolean =>
        p.side === side,
    );
  const first: IAutoMovieMotionHumanManipulateFacing.ISite =
    mine === undefined ? presses[0]! : mine;
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
