import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { HumanFrame } from "./HumanFrame";
import type { HumanHand } from "./HumanHand";

/**
 * A named direction of a hand as a world vector: how `HumanHand.Direction`,
 * an axis of the performer's floor frame, a share of the way between two
 * axes or explicit components, is read for one hand of a performer.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is read and for whom.
 * @evidence contracts/development/design.md#principled-representation One function over the closed union `HumanHand.Direction`, in the performer's floor frame turned by the heading.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The reading alone; `HumanHand` owns the types and calls it as its `direction`.
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
   * @evidence contracts/development/implementation.md#principled-implementation An axis is a unit vector of the floor frame with +X the left hand's `out`; a between is the normalised blend of two axes; explicit components are read out, up and forward of the acting side; the heading then turns the result into the world.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One branch per rung of the union, then one turn by the heading.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Opposite axes, a share outside [0, 1], zero components and an empty source each throw instead of yielding an arbitrary direction.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Reuses `HumanFrame.point` for the heading.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function of(
    side: HumanHand.Side,
    yaw: number,
    direction: HumanHand.Direction,
  ): IAutoMovieVector3 {
    const sign: number = side === "left" ? 1 : -1;
    const axis = (name: HumanHand.Axis): IAutoMovieVector3 => {
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
    };
    let local: IAutoMovieVector3;
    if (typeof direction === "string") local = axis(direction);
    else if ("between" in direction) {
      if (!(direction.share >= 0 && direction.share <= 1))
        throw new Error("A between share lies in [0, 1]");
      const a: IAutoMovieVector3 = axis(direction.between[0]);
      const b: IAutoMovieVector3 = axis(direction.between[1]);
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
    return HumanFrame.point(
      { origin: { x: 0, y: 0, z: 0 }, yaw },
      Vector3.normalize(local),
    );
  }
}
