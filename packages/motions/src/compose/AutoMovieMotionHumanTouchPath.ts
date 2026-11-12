import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanFrame } from "../posture/HumanFrame";
import type { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";

/**
 * The direction a hand lies on a surface region when the arm chooses it. Read
 * by the touch stroke
 * (`AutoMovieMotionHumanTouch`), whose transport is a joint-space carry and
 * so needs no path of its own.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the question the namespace answers and its reader.
 * @evidence contracts/development/design.md#principled-representation A projection on the region's frame from the performer's hanging elbow; no region or body is named.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One function, read by the touch stroke.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reads the body's measures and the posture's floor frame; nothing is solved or stored.
 */
export namespace AutoMovieMotionHumanTouchPath {
  /**
   * The direction an effector's along axis lies on a region when the arm
   * chooses it: from the hanging elbow to the place, across the region's
   * normal. The hand then continues the forearm that reaches the place, so a
   * palm on the performer's own belly lies across it and one on a thigh
   * points down it.
   *
   * @param body The body.
   * @param posture The posture so far.
   * @param side The hand.
   * @param point The region's point, world.
   * @param normal The region's unit normal.
   * @param fallback The direction when the elbow's direction runs along the normal.
   * @returns The unit direction.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the direction, what it is read from and the fallback.
   * @evidence contracts/development/implementation.md#principled-implementation A hand laid on a surface keeps the wrist near neutral when its long axis continues the forearm; the forearm's direction is read from the elbow hanging under the shoulder, the place the elbow leaves least.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One elbow place and one projection.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A direction shorter than 0.3 of the way across the normal falls back, so a near-parallel direction is never normalised.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `HumanFrame.point`.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function lay(
    body: IHumanBody,
    posture: Pick<IHumanPosture, "root" | "yaw">,
    side: HumanHand.Side,
    point: IAutoMovieVector3,
    normal: IAutoMovieVector3,
    fallback: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    const elbow: IAutoMovieVector3 = HumanFrame.point(
      { origin: posture.root, yaw: posture.yaw },
      {
        x: (side === "left" ? 1 : -1) * body.measure.shoulderHalfWidth,
        y: body.measure.shoulderHeight - body.measure.upperArm,
        z: 0,
      },
    );
    const way: IAutoMovieVector3 = Vector3.subtract(point, elbow);
    const across: IAutoMovieVector3 = Vector3.subtract(
      way,
      Vector3.scale(normal, Vector3.dot(way, normal)),
    );
    return Vector3.length(across) > 0.3 * Vector3.length(way)
      ? Vector3.normalize(across)
      : fallback;
  }
}
