import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanHand } from "../posture/HumanHand";
import type { StrikingHeld } from "./StrikingHeld";

/**
 * Rank actual hand frames by the straight-wrist arm's length residual.
 * The canonical grip offset, forearm line and measured segment lengths are
 * fixed for this body's side, while each candidate frame and shoulder is read
 * anew. This is a coarse rank; StrikingRoll still fits the preferred frames.
 *
 * @param body The unchanged canonical body.
 * @param side The holding side.
 * @returns A synchronous candidate rank in metres for a world frame and shoulder.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States frame/shoulder units, fixed body/side prerequisites and the distinction between rank and physical acceptance.
 * @evidence contracts/development/implementation.md#principled-implementation A straight wrist puts the elbow one measured forearm length behind the wrist along the canonical hand line; the absolute error from the shoulder's upper-arm sphere ranks candidate poses.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Fixed body/side geometry is captured once, and the returned function computes only the candidate's rigid wrist/elbow placement and residual.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses the original grip, side convention and measured lengths; no candidate is accepted by this rank and no physical fit or authored limit is changed.
 * @evidence contracts/development/implementation.md#efficient-algorithms O(1) fixed setup and O(1) rigid/vector work per candidate avoid repeating the same grip lookup, direction allocation and segment-property reads for the hand search's candidate count. Speedup is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The immutable canonical body contract fixes grip/lengths and the explicit side fixes the forearm direction; each changing frame/shoulder is still evaluated without a result cache.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller owns the returned scalar-only geometry reader for its search; it captures fixed vectors/lengths and no body, pose, candidate history, handle or task.
 */
export function StrikingStrain(
  body: IHumanBody,
  side: HumanHand.Side,
): (frame: StrikingHeld.IHandFrame, shoulder: IAutoMovieVector3) => number {
  const grip: IAutoMovieVector3 = HumanHand.offset(body, side, "grip").point;
  const fingers: IAutoMovieVector3 = { x: side === "left" ? 1 : -1, y: 0, z: 0 };
  const forearm: number = body.measure.forearm;
  const upperArm: number = body.measure.upperArm;
  return (frame: StrikingHeld.IHandFrame, shoulder: IAutoMovieVector3): number => {
    const elbow: IAutoMovieVector3 = Vector3.subtract(
      Vector3.subtract(
        frame.point,
        Quaternion.rotateVector(frame.rotation, grip),
      ),
      Vector3.scale(Quaternion.rotateVector(frame.rotation, fingers), forearm),
    );
    return Math.abs(Vector3.length(Vector3.subtract(elbow, shoulder)) - upperArm);
  };
}
