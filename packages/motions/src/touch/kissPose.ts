import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanKiss,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanRise,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanHead } from "../compose/AutoMovieMotionHumanHead";
import { kissBody } from "./kissBody";

/**
 * Build each kiss-search candidate: the kiss's body at its full share
 * (`kissBody`, the model the displayed kiss writes), with the neck's
 * flexion and the head's turn added.
 *
 * @param body The unchanged canonical body for this synchronous search.
 * @param entry The entry posture the kiss is written over.
 * @param stance The standing placements every candidate rises from.
 * @param twist The fixed head twist, degrees.
 * @param seated Whether a seat bears the body, so it neither rises nor is lowered onto the feet.
 * @returns A fresh complete candidate posture for a pitch, roll, flexion and raise.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the entry, stance and angle units, the seated case and the fresh candidate returned.
 * @evidence contracts/development/implementation.md#principled-implementation Each candidate is the displayed kiss's own body at the full share (`kissBody`: the rise, the hips' shift, the lean and the lowering onto the planted legs) with the head's flexion and turn shared over the neck and the head, so the mouth the search scores is the mouth the figure shows.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One body model, then one head addition.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No candidate skips the lowering the display applies; no angle is clamped here.
 * @evidence contracts/development/implementation.md#efficient-algorithms The head twist's share is prepared once; each candidate costs one body model, the standing lowering's leg fits included.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The body model is `kissBody`, shared with the kiss's display; only the fixed twist's head share is shared across candidates.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The search owns this reader and the twist's share until it returns; each candidate posture is fresh and nothing else is retained.
 */
export function kissPose(
  body: IAutoMovieMotionHumanBody,
  entry: IAutoMovieMotionHumanPosture,
  stance: IAutoMovieMotionHumanRise.Stance,
  twist: number,
  seated: boolean,
): (
  s: Pick<
    IAutoMovieMotionHumanKiss.ISolved,
    "pitch" | "roll" | "flexion" | "raise" | "sink" | "twist" | "shift" | "advance" | "bearing"
  >,
) => IAutoMovieMotionHumanPosture {
  const initialTurn: ReturnType<typeof AutoMovieMotionHumanHead.share> =
    AutoMovieMotionHumanHead.share(2, twist);
  return (
    s: Pick<
      IAutoMovieMotionHumanKiss.ISolved,
      "pitch" | "roll" | "flexion" | "raise" | "sink" | "twist" | "shift" | "advance" | "bearing"
    >,
  ): IAutoMovieMotionHumanPosture => {
    const turn: ReturnType<typeof AutoMovieMotionHumanHead.share> = s.twist === undefined ? initialTurn : AutoMovieMotionHumanHead.share(2, s.twist);
    const leaned: IAutoMovieMotionHumanPosture = kissBody(
      body,
      entry,
      stance,
      s,
      1,
      seated,
    );
    const head: ReturnType<typeof AutoMovieMotionHumanHead.share> =
      AutoMovieMotionHumanHead.share(0, s.flexion);
    const held: (bone: "neck" | "head") => readonly [number, number, number] = (
      bone: "neck" | "head",
    ): readonly [number, number, number] => leaned.joints[bone] ?? [0, 0, 0];
    return {
      ...leaned,
      joints: {
        ...leaned.joints,
        neck: [
          held("neck")[0] + head.neck![0],
          held("neck")[1],
          held("neck")[2] + turn.neck![2],
        ],
        head: [
          held("head")[0] + head.head![0],
          held("head")[1],
          held("head")[2] + turn.head![2],
        ],
      },
    };
  };
}

/** The sagittal geometry shared by a direct kiss and the hand meeting. */
export namespace kissPose {
  /**
   * The pitch that aims the mouth's circular path toward a point, in degrees.
   * The forward-bow axis is the body's left. In the plane of that circle,
   * the vectors from the hip to the mouth and from the hip to the point
   * determine the minimum squared distance on the unconstrained arc.
   *
   * @param hip The hip pivot, world metres.
   * @param yaw The yaw about world up, degrees.
   * @param mouth The unbowed mouth, world metres.
   * @param point The point the arc approaches, world metres.
   * @returns A signed pitch in degrees.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the planar construction and each input's frame.
   * @evidence contracts/development/implementation.md#principled-implementation The angles of the two in-plane components give the maximum dot product and therefore the least distance on the rigid circle.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One axis and two dot products for atan2.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The caller keeps its own joint ranges and checks the actual displayed pose at the candidate angle.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure calculation on the caller's world frames.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The result is a scalar and owns no state.
   */
  export function pitch(
    hip: IAutoMovieVector3,
    yaw: number,
    mouth: IAutoMovieVector3,
    point: IAutoMovieVector3,
  ): number {
    const around: number = (yaw * Math.PI) / 180;
    const axis: IAutoMovieVector3 = {
      x: Math.cos(around),
      y: 0,
      z: -Math.sin(around),
    };
    const arc: IAutoMovieVector3 = Vector3.subtract(mouth, hip);
    const radial: IAutoMovieVector3 = Vector3.subtract(
      arc,
      Vector3.scale(axis, Vector3.dot(arc, axis)),
    );
    const toward: IAutoMovieVector3 = Vector3.subtract(point, hip);
    return (
      (Math.atan2(
        Vector3.dot(toward, Vector3.cross(axis, radial)),
        Vector3.dot(toward, radial),
      ) *
        180) /
      Math.PI
    );
  }
}
