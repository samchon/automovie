import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanHand,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFrame } from "./HumanFrame";

/** The record of `IPrepareFrame`'s site. */
type IPrepareFrame = { yaw: number; read: HumanFrame.IPrepared };

/**
 * The world unit vector of a named direction for a hand of a performer heading
 * `yaw`.
 *
 * @param side The acting hand, which `out` and `in` mirror by.
 * @param yaw The performer's heading, degrees about +Y.
 * @param direction The direction, on any rung.
 * @returns The unit vector, world frame.
 * @throws {Error} When a between joins opposite axes or its share lies outside
 *   [0, 1], when explicit components are all zero, or when an explicit source
 *   is empty.
 */
export function HumanHandDirection(
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
  const unit: IAutoMovieVector3 =
    typeof direction === "string" ? local : Vector3.normalize(local);
  return HumanFrame.point({ origin: { x: 0, y: 0, z: 0 }, yaw }, unit);
}

/**
 * A named direction of a hand as a world vector: how `HumanHand.Direction`, an
 * axis of the performer's floor frame, a share of the way between two axes or
 * explicit components, is read for one hand of a performer.
 */
export namespace HumanHandDirection {
  /**
   * Prepare a fixed hand's named axes for changing actual headings.
   *
   * @param side The unchanged acting hand; the ordinary right-side fallback is
   *   preserved.
   * @returns A fresh world vector for each current yaw in degrees and named
   *   floor axis. Current heading reads remain the caller's; only lazily
   *   demanded axis scalars and one exact last-yaw transform preparation are
   *   shared.
   */
  export function prepare(
    side: AutoMovieHumanSide,
  ): (
    yaw: number,
    direction: IAutoMovieMotionHumanHand.Axis,
  ) => IAutoMovieVector3 {
    const sign: number = side === "left" ? 1 : -1;
    const axes: Map<IAutoMovieMotionHumanHand.Axis, IAutoMovieVector3> =
      new Map();
    let frame: IPrepareFrame | undefined;
    return (
      yaw: number,
      direction: IAutoMovieMotionHumanHand.Axis,
    ): IAutoMovieVector3 => {
      let local: IAutoMovieVector3 | undefined = axes.get(direction);
      if (local === undefined) {
        local = axis(direction, sign);
        if (local === undefined)
          return HumanHandDirection(side, yaw, direction);
        axes.set(direction, local);
      }
      if (frame === undefined || !Object.is(frame.yaw, yaw))
        frame = {
          yaw,
          read: HumanFrame.prepare({ origin: { x: 0, y: 0, z: 0 }, yaw }),
        };
      return frame.read.point(local);
    };
  }
}

/** The same fresh floor-axis vector, with the acting hand's current sign. */
function axis(
  name: IAutoMovieMotionHumanHand.Axis,
  sign: number,
): IAutoMovieVector3 {
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
