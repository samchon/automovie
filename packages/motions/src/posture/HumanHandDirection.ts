import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanHand,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFrame } from "./HumanFrame";
import type { HumanHand } from "./HumanHand";

/**
 * A named direction of a hand as a world vector: how `HumanHand.Direction`,
 * an axis of the performer's floor frame, a share of the way between two
 * axes or explicit components, is read for one hand of a performer.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is read and for whom.
 * @evidence contracts/development/design.md#principled-representation One function over the closed union `HumanHand.Direction`, in the performer's floor frame turned by the heading.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The cold reading and explicit fixed-hand named-axis preparation serve HumanHand and armPhrase; HumanHand owns the existing direction types.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts `out` and `in` mirror by the acting hand, so one name serves both hands and no left or right table exists.
 */
export namespace HumanHandDirection {
  /**
   * The world unit vector of a named direction for a hand of a performer
   * heading `yaw`.
   *
   * @param side The acting hand, which `out` and `in` mirror by.
   * @param yaw The performer's heading, degrees about +Y.
   * @param direction The direction, on any rung.
   * @returns The unit vector, world frame.
   * @throws {Error} When a between joins opposite axes or its share lies outside [0, 1], when explicit components are all zero, or when an explicit source is empty.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each input, the result's frame and the four refusals.
   * @evidence contracts/development/implementation.md#principled-implementation An axis is an exact unit vector with one component +1 or -1 and the rest zero, so its normalization would multiply every component by exactly one. Between/explicit vectors keep their original normalization and all rungs are turned by the actual heading.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure A private axis switch takes the current side sign without a per-call closure; one branch per rung then turns the actual normalized direction by the heading.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Opposite axes, a share outside [0, 1], zero components and an empty source each throw instead of yielding an arbitrary direction.
   * @evidence contracts/development/implementation.md#efficient-algorithms Named axes omit the provably redundant magnitude classification, square root and normalized-vector allocation. Between/explicit directions retain every original test and normalization; all paths still construct a fresh actual world vector, with no measured speedup claim.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Every current side, heading and direction is evaluated independently; the private axis and HumanFrame owners share code only, retaining no completed numeric work across calls.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function of(
    side: AutoMovieHumanSide,
    yaw: number,
    direction: IAutoMovieMotionHumanHand.Direction,
  ): IAutoMovieVector3 {
    const sign: number = side === "left" ? 1 : -1;
    let local: IAutoMovieVector3;
    if (typeof direction === "string") local = axis(direction, sign);
    else if ("between" in direction) {
      if (!(direction.share >= 0 && direction.share <= 1))
        throw new Error("A between share lies in [0, 1]");
      const a: IAutoMovieVector3 = axis(direction.between[0], sign);
      const b: IAutoMovieVector3 = axis(direction.between[1], sign);
      if (Vector3.dot(a, b) < -0.5)
        throw new Error("A direction between opposite axes is undefined");
      local = Vector3.add(
        Vector3.scale(a, 1 - direction.share),
        Vector3.scale(b, direction.share),
      );
    } else {
      if (direction.source.trim() === "")
        throw new Error("An explicit direction states its source");
      local = {
        x: sign * direction.explicit.out,
        y: direction.explicit.up,
        z: direction.explicit.forward,
      };
      if (!(Vector3.length(local) > 1e-9))
        throw new Error("An explicit direction has a length");
    }
    const unit: IAutoMovieVector3 = typeof direction === "string" && local !== undefined
      ? local : Vector3.normalize(local);
    return HumanFrame.point(
      { origin: { x: 0, y: 0, z: 0 }, yaw },
      unit,
    );
  }
  /**
   * Prepare a fixed hand's named axes for changing actual headings.
   *
   * @param side The unchanged acting hand; the ordinary right-side fallback is preserved.
   * @returns A fresh world vector for each current yaw in degrees and named floor axis. Current heading reads remain the caller's; only lazily demanded axis scalars and one exact last-yaw transform preparation are shared.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States fixed side, current degree heading/name inputs, lazy axis/transform preparation, fresh output and unchanged cold fallback for malformed names.
   * @evidence contracts/development/implementation.md#principled-implementation Each closed named axis is the same exact unit vector as of, turned by the same HumanFrame.point scalar grouping. HumanFrame.prepare owns fixed transform coefficients, guarded with Object.is on the actual current yaw so signed zero remains distinct.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One bounded lazy axis map and one last-yaw frame precede the original point transform; armPhrase's out/up/forward reads share this producer without moving any live offset or entry-heading access.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The raw of path remains live and unchanged. Invalid names delegate that same path rather than inventing a direction; every output is fresh, all current headings are observed and no world vector, target, pose or sampled result is cached.
   * @evidence contracts/development/implementation.md#efficient-algorithms At most six local axis records and one current-heading coefficient preparation serve Q actual reads; unchanged headings avoid repeated trigonometry while every axis-specific scalar transform and fresh world vector remains. Runtime improvement is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Fixed side/name defines each private unit axis; the last exact current yaw alone establishes reusable trigonometric prerequisites. Changed yaw rebuilds its frame, with no fixed-entry or immutable-input premise added to the caller's borrowed posture.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The owning arm/action retains at most six private unit axes and one copied zero-origin transform with its numeric yaw until release. It retains no posture, source object, current output, target, callback loan or growing history.
   */
  export function prepare(side: AutoMovieHumanSide):
    (yaw: number, direction: IAutoMovieMotionHumanHand.Axis) => IAutoMovieVector3 {
    const sign: number = side === "left" ? 1 : -1;
    const axes: Map<IAutoMovieMotionHumanHand.Axis, IAutoMovieVector3> = new Map();
    let frame: { yaw: number; read: HumanFrame.IPrepared } | undefined;
    return (yaw: number, direction: IAutoMovieMotionHumanHand.Axis): IAutoMovieVector3 => {
      let local: IAutoMovieVector3 | undefined = axes.get(direction);
      if (local === undefined) {
        local = axis(direction, sign);
        if (local === undefined) return of(side, yaw, direction);
        axes.set(direction, local);
      }
      if (frame === undefined || !Object.is(frame.yaw, yaw))
        frame = { yaw, read: HumanFrame.prepare({ origin: { x: 0, y: 0, z: 0 }, yaw }) };
      return frame.read.point(local);
    };
  }
}

/** The same fresh floor-axis vector, with the acting hand's current sign. */
function axis(name: IAutoMovieMotionHumanHand.Axis, sign: number): IAutoMovieVector3 {
  switch (name) {
    case "out":
      return { x: sign, y: 0, z: 0 };
    case "in":
      return { x: -sign, y: 0, z: 0 };
    case "up":
      return { x: 0, y: 1, z: 0 };
    case "down":
      return { x: 0, y: -1, z: 0 };
    case "forward":
      return { x: 0, y: 0, z: 1 };
    case "back":
      return { x: 0, y: 0, z: -1 };
  }
}
