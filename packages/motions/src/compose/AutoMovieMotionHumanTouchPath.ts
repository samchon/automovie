import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanFrame } from "../posture/HumanFrame";
import type { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";

/**
 * The direction a hand lies on a surface region when the arm chooses it
 * (`lay`), and the direction a hand that continues its forearm points at a
 * place (`reach`). Read by the touch stroke
 * (`AutoMovieMotionHumanTouch`), whose transport is a joint-space carry and
 * so needs no path of its own.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the two questions the namespace answers and its reader.
 * @evidence contracts/development/design.md#principled-representation A projection on the region's frame (`lay`), or the plain line (`reach`), from the performer's elbow hanging under the shoulder or held level with it; no region or body is named.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two functions, `lay` and `reach`, sharing one private elbow place (`elbowOf`); read by the touch stroke.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reads the body's measures and the posture's floor frame; nothing is solved or stored.
 */
export namespace AutoMovieMotionHumanTouchPath {
  /**
   * The direction an effector's along axis lies on a region when the arm
   * chooses it: from the elbow to the place, across the region's normal.
   * The hand then continues the forearm that reaches the place, so a palm
   * on the performer's own belly lies across it and one on a thigh points
   * down it. The elbow is read hanging under the shoulder, or, for an arm
   * held level, out to the side at the shoulder's height, so a saluting
   * hand continues a forearm that rises to the brow from there.
   *
   * @param body The body.
   * @param posture The posture so far.
   * @param side The hand.
   * @param point The region's point, world.
   * @param normal The region's unit normal.
   * @param fallback The direction when the elbow's direction runs along the normal.
   * @param elbow Where the elbow is read: hanging (`natural`) or `level` with the shoulder; hanging when absent.
   * @returns The unit direction.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the direction, what it is read from and the fallback.
   * @evidence contracts/development/implementation.md#principled-implementation A hand laid on a surface keeps the wrist near neutral when its long axis continues the forearm; the forearm's direction is read from the elbow hanging under the shoulder, the place the elbow leaves least, or, for an arm held level, out to the side at the shoulder's height (`elbow: "level"`).
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One elbow place and one projection.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A direction shorter than 0.3 of the way across the normal falls back, so a near-parallel direction is never normalised.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads the elbow place through `elbowOf`, the one `reach` shares, and `HumanFrame.point`.
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
    elbow: "natural" | "level" = "natural",
  ): IAutoMovieVector3 {
    const way: IAutoMovieVector3 = Vector3.subtract(
      point,
      elbowOf(body, posture, side, elbow),
    );
    const across: IAutoMovieVector3 = Vector3.subtract(
      way,
      Vector3.scale(normal, Vector3.dot(way, normal)),
    );
    return Vector3.length(across) > 0.3 * Vector3.length(way)
      ? Vector3.normalize(across)
      : fallback;
  }

  /**
   * The direction a hand that continues its forearm onto a place points:
   * from the elbow to the place, as a saluting hand runs straight from the
   * forearm to the brow. Unlike `lay`, the direction is not laid across the
   * region; the hand meets the place end on.
   *
   * @param body The body.
   * @param posture The posture so far.
   * @param side The hand.
   * @param point The place, world.
   * @param elbow Where the elbow is read: hanging (`natural`) or `level` with the shoulder; hanging when absent.
   * @param from The elbow's place, world, when it has been solved; read from the body's measures when absent.
   * @returns The unit direction; straight up when the place is on the elbow.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the direction, how it differs from `lay` and the degenerate case.
   * @evidence contracts/development/implementation.md#principled-implementation A hand and wrist held straight continue the forearm, so the hand's long axis is the line from the elbow to what its end meets.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One elbow place and one difference.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The elbow place is the one `lay` reads, stated once in `elbowOf`.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares the elbow place with `lay`.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function reach(
    body: IHumanBody,
    posture: Pick<IHumanPosture, "root" | "yaw">,
    side: HumanHand.Side,
    point: IAutoMovieVector3,
    elbow: "natural" | "level" = "natural",
    from?: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    const way: IAutoMovieVector3 = Vector3.subtract(
      point,
      from ?? elbowOf(body, posture, side, elbow),
    );
    return Vector3.length(way) > 1e-9
      ? Vector3.normalize(way)
      : { x: 0, y: 1, z: 0 };
  }
}

/** Where the elbow is read for a hand's lay: hanging under the shoulder, or out to the side at the shoulder's height for an arm held level. */
function elbowOf(
  body: IHumanBody,
  posture: Pick<IHumanPosture, "root" | "yaw">,
  side: HumanHand.Side,
  elbow: "natural" | "level",
): IAutoMovieVector3 {
  const outward: number = side === "left" ? 1 : -1;
  return HumanFrame.point(
    { origin: posture.root, yaw: posture.yaw },
    elbow === "level"
      ? {
          x: outward * (body.measure.shoulderHalfWidth + body.measure.upperArm),
          y: body.measure.shoulderHeight,
          z: 0,
        }
      : {
          x: outward * body.measure.shoulderHalfWidth,
          y: body.measure.shoulderHeight - body.measure.upperArm,
          z: 0,
        },
  );
}
