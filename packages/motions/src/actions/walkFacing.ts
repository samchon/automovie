import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { IHumanEntryState } from "../law/IHumanEntryState";

/**
 * How much of its speed and step a walk keeps when the body does not face
 * the way it goes: all of it forward, `BACKWARD` going backward, and going
 * sideways the step that does not cross the feet, the feet's rest
 * separation, blended by the squared cosine and sine of the angle between
 * the way and the facing at the walk's start. The cadence is the gait's
 * own either way.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each direction's share, its source or its provisional status, the blend and what is kept.
 * @evidence contracts/development/design.md#principled-representation One share of the forward gait, applied to its speed and its longest step alike, so the cadence stays.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The facing's type, the backward ratio and the share the walk reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No length is typed: the side step is the body's own foot separation.
 */
export namespace walkFacing {
  /** Which way a walking body faces, apart from the way it goes: a fixed heading, degrees about +Y (0 faces +Z), or the heading toward a floor point turned by `turn` degrees (0 when absent), read where each footprint lies (`walkSteps`). */
  export type IFacing =
    | { yaw: number }
    | { toward: IAutoMovieVector3; turn?: number };

  /** The share of the forward walking speed a backward walk keeps: the ratio of the backward to the forward walk-to-run transition speeds of the same young adults, 1.58 +/- 0.16 against 1.99 +/- 0.20 m/s (Hreljac et al. 2005, J Sports Sci Med 4:446, 12 adults on a treadmill); cadence is the same either way (Laufer 2005, J Gerontol A 60:627, 30 young adults on a walkway), so the stride carries the ratio. */
  export const BACKWARD: number = 1.58 / 1.99;

  /**
   * The share of its walking speed and step a walk keeps going a way it does
   * not face.
   *
   * @param body The body.
   * @param entry The state the walk starts from; its feet's midpoint is where the way and the facing are read.
   * @param way The walk's points: its first `via`, or `to`.
   * @param facing Which way the body faces.
   * @param longest The forward gait's longest step, metres.
   * @returns The share, in (0, 1].
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, where they are read and the result.
   * @evidence contracts/development/implementation.md#principled-implementation Backward walking keeps its cadence and shortens its stride by the cited speed ratio (Hreljac et al. 2005; Laufer 2005); a side step is bounded by the feet it must not cross, the body's rest separation (no measure of a sustained side-walk was found; provisional, the cadence is kept).
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two headings, one angle and one blend.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The side share is the body's own foot separation, never a typed length; a walk with no way keeps its gait.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Called once per plan.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function share(
    body: IHumanBody,
    entry: IHumanEntryState,
    way: { to: IAutoMovieVector3; via?: readonly IAutoMovieVector3[] },
    facing: IFacing,
    longest: number,
  ): number {
    const from: IAutoMovieVector3 = {
      x: (entry.feet.left.ankle.x + entry.feet.right.ankle.x) / 2,
      y: 0,
      z: (entry.feet.left.ankle.z + entry.feet.right.ankle.z) / 2,
    };
    const first: IAutoMovieVector3 = way.via?.[0] ?? way.to;
    if (Math.hypot(first.x - from.x, first.z - from.z) < 1e-6) return 1;
    const goes: number = Math.atan2(first.x - from.x, first.z - from.z);
    const faces: number =
      "yaw" in facing
        ? (facing.yaw * Math.PI) / 180
        : Math.atan2(facing.toward.x - from.x, facing.toward.z - from.z) +
          ((facing.turn ?? 0) * Math.PI) / 180;
    const off: number = goes - faces;
    const across: number = Math.min(
      1,
      (Math.abs(body.rest.get("leftFoot")!.x) +
        Math.abs(body.rest.get("rightFoot")!.x)) /
        longest,
    );
    return (
      Math.cos(off) ** 2 * (Math.cos(off) >= 0 ? 1 : BACKWARD) +
      Math.sin(off) ** 2 * across
    );
  }
}
