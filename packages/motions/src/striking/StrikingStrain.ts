import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanStrikingHeld,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanHand } from "../posture/HumanHand";

/**
 * Rank actual hand frames by the straight-wrist arm's length residual.
 * The canonical grip offset, forearm line and measured segment lengths are
 * read once for the returned closure, while each candidate frame and
 * shoulder is read anew. This is a coarse rank; StrikingRoll still fits the
 * preferred frames.
 *
 * @param body The unchanged canonical body.
 * @param side The holding side.
 * @returns A synchronous candidate rank in metres for a world frame and shoulder.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States frame/shoulder units, the fixed body/side prerequisites the closure reads once and the distinction between rank and physical acceptance.
 * @evidence contracts/development/implementation.md#principled-implementation A straight wrist puts the elbow one measured forearm length behind the wrist along the canonical hand line; the absolute error from the shoulder's upper-arm sphere ranks candidate poses.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One preparation reads the grip socket and the two measured lengths; the closure computes each actual frame/shoulder rigid wrist/elbow residual.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses the canonical grip, side convention and measured lengths; no candidate is accepted by this rank and no physical fit or authored limit is changed.
 * @evidence contracts/development/implementation.md#efficient-algorithms One grip offset and two measure reads per preparation, which its callers make once per candidate search; every candidate then takes constant rigid/vector math.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The closure shares its fixed grip, direction and lengths across one search's candidates; nothing is kept between preparations, so no registry beside the body holds derived metadata.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Each caller owns its fresh closure over two vectors and two lengths, released with it; no module state, raw posture, shoulder, candidate history or handle is retained.
 */
export function StrikingStrain(
  body: IAutoMovieMotionHumanBody,
  side: AutoMovieHumanSide,
): (frame: IAutoMovieMotionHumanStrikingHeld.IHandFrame, shoulder: IAutoMovieVector3) => number {
  const grip: IAutoMovieVector3 = HumanHand.offset(body, side, "grip").point;

  // The forearm's line in the hand's rest frame: the fingers point away
  // from the body's midline along the hand bone's x axis.
  const fingers: IAutoMovieVector3 = { x: side === "left" ? 1 : -1, y: 0, z: 0 };
  const forearm: number = body.measure.forearm;
  const upperArm: number = body.measure.upperArm;
  return (frame: IAutoMovieMotionHumanStrikingHeld.IHandFrame, shoulder: IAutoMovieVector3): number => {
    const elbow: IAutoMovieVector3 = Vector3.subtract(
      Vector3.subtract(
        frame.point,
        Quaternion.rotateVector(frame.rotation, grip),
      ),
      Vector3.scale(Quaternion.rotateVector(frame.rotation, fingers), forearm),
    );
    return Math.abs(Vector3.distance(elbow, shoulder) - upperArm);
  };
}
