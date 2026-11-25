import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanHand,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFrame } from "./HumanFrame";

/** The unchanged floor directions for one side, before turning by yaw. */
type IAxes = Readonly<
  Record<IAutoMovieMotionHumanHand.Axis, Readonly<IAutoMovieVector3>>
>;

/** The named axes mirror about the performer's centreline. */
const AXES: Readonly<Record<AutoMovieHumanSide, IAxes>> = {
  left: axes(1),
  right: axes(-1),
};

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
  const named: IAxes = side === "left" ? AXES.left : AXES.right;
  let local: IAutoMovieVector3;
  if (typeof direction === "string") local = named[direction];
  else if ("between" in direction) {
    if (!(direction.share >= 0 && direction.share <= 1))
      throw new Error("A between share lies in [0, 1]");
    const a: IAutoMovieVector3 = named[direction.between[0]];
    const b: IAutoMovieVector3 = named[direction.between[1]];
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
      x: named.out.x * direction.explicit.out,
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
   * @returns A fresh world vector for each named floor axis and requested
   *   yaw in degrees. The local axis stays fixed and each query applies its
   *   own heading.
   */
  export function prepare(
    side: AutoMovieHumanSide,
  ): (
    yaw: number,
    direction: IAutoMovieMotionHumanHand.Axis,
  ) => IAutoMovieVector3 {
    const local: IAxes = side === "left" ? AXES.left : AXES.right;
    return (
      yaw: number,
      direction: IAutoMovieMotionHumanHand.Axis,
    ): IAutoMovieVector3 =>
      HumanFrame.point({ origin: { x: 0, y: 0, z: 0 }, yaw }, local[direction]);
  }
}

/** Bind the six local unit axes for the acting hand's lateral sign. */
function axes(sign: number): IAxes {
  return {
    out: { x: sign, y: 0, z: 0 },
    in: { x: -sign, y: 0, z: 0 },
    up: { x: 0, y: 1, z: 0 },
    down: { x: 0, y: -1, z: 0 },
    forward: { x: 0, y: 0, z: 1 },
    back: { x: 0, y: 0, z: -1 },
  };
}
