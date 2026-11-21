import { ANKLE_DORSIFLEXION, Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFoot } from "../posture/HumanFoot";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/**
 * A foot that bears no weight relaxes (`ANKLE_DORSIFLEXION.unloaded`): it
 * cannot be pulled toward the shin as far as a loaded foot is pushed, so a
 * law that carries a swinging foot at a placement of its own (held flat, or
 * turned as it was set down) would ask the ankle past the passive limit
 * whenever the shank leans over it. The placement is turned toes down about
 * the ankle until the foot stands at that limit less `MARGIN` from the
 * shank the leg will take, read in closed form: the knee lies where the
 * thigh and the shank meet between the hip joint and the ankle, bent
 * forward along the heading.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States why an unloaded foot is turned, how far and how the shank is read.
 * @evidence contracts/development/design.md#principled-representation A pure correction of a foot placement against the passive range.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The margin and one correction.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The limit is the engine's range constant; the shank is the body's own lengths.
 */
export namespace AutoMovieMotionHumanFootRelax {
  /** How far inside the passive limit the foot is kept, degrees. */
  export const MARGIN: number = 2;

  /**
   * The placement an unloaded foot can hold.
   *
   * @param body The body.
   * @param posture The posture written so far, read for its root and heading.
   * @param side Which foot.
   * @param placement The placement the law asks.
   * @returns The placement turned toes down where the ask would pass the passive limit, else the ask.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the correction.
   * @evidence contracts/development/implementation.md#principled-implementation The knee by the law of cosines in the plane of the hip-to-ankle line and the heading; the dorsiflexion as the foot's tilt toward the shank from square; the excess turned away about their common normal.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Hip, knee, angle, turn.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A foot within the limit is returned unchanged.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work, no pose resolution.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The posture's heading reader.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function of(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    side: AutoMovieHumanSide,
    placement: IAutoMovieMotionHumanFoot.IPlacement,
  ): IAutoMovieMotionHumanFoot.IPlacement {
    const heading: ReturnType<typeof resolveHumanPosture.heading> =
      resolveHumanPosture.heading(posture);
    const hip: IAutoMovieVector3 = Vector3.add(
      posture.root,
      Quaternion.rotateVector(
        heading,
        body.rest.get(side === "left" ? "leftUpperLeg" : "rightUpperLeg")!,
      ),
    );
    const a: number = body.measure.thigh;
    const b: number = body.measure.shank;
    const toHip: IAutoMovieVector3 = Vector3.subtract(hip, placement.ankle);
    const d: number = Math.min(a + b - 1e-6, Vector3.length(toHip));
    if (!(d > 1e-6)) return placement;
    const u: IAutoMovieVector3 = Vector3.normalize(toHip);
    const ahead: IAutoMovieVector3 = Quaternion.rotateVector(heading, {
      x: 0,
      y: 0,
      z: 1,
    });
    const across: IAutoMovieVector3 = Vector3.subtract(
      ahead,
      Vector3.scale(u, Vector3.dot(ahead, u)),
    );
    const w: IAutoMovieVector3 =
      Vector3.length(across) > 1e-6 ? Vector3.normalize(across) : ahead;
    const cosine: number = Math.max(
      -1,
      Math.min(1, (b * b + d * d - a * a) / (2 * b * d)),
    );
    const shank: IAutoMovieVector3 = Vector3.add(
      Vector3.scale(u, cosine),
      Vector3.scale(w, Math.sqrt(1 - cosine * cosine)),
    );
    const toes: IAutoMovieVector3 = Quaternion.rotateVector(
      placement.rotation,
      {
        x: 0,
        y: 0,
        z: 1,
      },
    );
    const tilt: number =
      90 -
      (Math.acos(Math.max(-1, Math.min(1, Vector3.dot(toes, shank)))) * 180) /
        Math.PI;
    const excess: number = tilt - (ANKLE_DORSIFLEXION.unloaded - MARGIN);
    if (!(excess > 0)) return placement;
    const axis: IAutoMovieVector3 = Vector3.cross(shank, toes);
    if (!(Vector3.length(axis) > 1e-9)) return placement;
    // The turn is about the ball, so a foot whose ball is on the floor
    // rises onto it rather than driving its toes into the floor.
    const turn: ReturnType<typeof Quaternion.fromAxisAngle> =
      Quaternion.fromAxisAngle(Vector3.normalize(axis), excess);
    const ball: IAutoMovieVector3 = HumanFoot.point(
      body,
      side,
      "ball",
      placement,
    );
    return {
      ankle: Vector3.add(
        ball,
        Quaternion.rotateVector(turn, Vector3.subtract(placement.ankle, ball)),
      ),
      rotation: Quaternion.normalize(
        Quaternion.multiply(turn, placement.rotation),
      ),
    };
  }
}
