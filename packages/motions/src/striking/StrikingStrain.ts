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
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One weak canonical body/side metadata owner supplies each fresh rank closure; the closure computes its actual frame/shoulder rigid wrist/elbow residual.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses the original grip, side convention and measured lengths; no candidate is accepted by this rank and no physical fit or authored limit is changed.
 * @evidence contracts/development/implementation.md#efficient-algorithms The first actual body/side request reads grip and measured segment lengths once, and later requests create only a fresh closure over those fixed scalars/vectors. Every candidate keeps original constant rigid/vector math and actual shoulder observations; speedup is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The canonical body producer fixes its grip socket and measured lengths; explicit current side determines only its anatomical direction. A weak body key shares at most two such metadata records without retaining ROM tables, raw postures, shoulders or ranks. Every actual frame/shoulder is read anew, including cold raw-source callers.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Each caller owns a fresh rank closure over canonical geometry. Weak body keys retain at most two grip/direction/length records until body release, with no body backreference, ROM mapper, raw posture, shoulder, candidate history, score, handle or task retained.
 */
export function StrikingStrain(
  body: IHumanBody,
  side: HumanHand.Side,
): (frame: StrikingHeld.IHandFrame, shoulder: IAutoMovieVector3) => number {
  const { grip, fingers, forearm, upperArm }: IGeometry = geometry(body, side);
  return (frame: StrikingHeld.IHandFrame, shoulder: IAutoMovieVector3): number => {
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

/** Fixed canonical anatomy only; no requested pose or numerical rank result. */
interface IGeometry {
  /** Hand-local grip socket, metres. */
  grip: IAutoMovieVector3;
  /** Side's canonical forearm direction in the hand frame. */
  fingers: IAutoMovieVector3;
  /** Measured forearm length, metres. */
  forearm: number;
  /** Measured upper-arm length, metres. */
  upperArm: number;
}

/** First actual side demand retains the original ordered grip/measure reads. */
function geometry(body: IHumanBody, side: HumanHand.Side): IGeometry {
  let sides: Partial<Record<HumanHand.Side, IGeometry>> | undefined = GEOMETRY.get(body);
  if (sides === undefined) {
    sides = {};
    GEOMETRY.set(body, sides);
  }
  let fixed: IGeometry | undefined = sides[side];
  if (fixed === undefined) {
    const grip: IAutoMovieVector3 = HumanHand.offset(body, side, "grip").point;
    const fingers: IAutoMovieVector3 = { x: side === "left" ? 1 : -1, y: 0, z: 0 };
    const forearm: number = body.measure.forearm;
    const upperArm: number = body.measure.upperArm;
    fixed = { grip, fingers, forearm, upperArm };
    sides[side] = fixed;
  }
  return fixed;
}

/** Canonical body lifetime bounds each of its two pure anatomical metadata records. */
const GEOMETRY: WeakMap<IHumanBody, Partial<Record<HumanHand.Side, IGeometry>>> = new WeakMap();
