import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFrame } from "../../posture/internal/HumanFrame";

/** The alternatives of `ReachElbow`'s site. */
type ReachElbow = "natural" | "level";

/** The alternatives of `ReachPosture`'s site. */
type ReachPosture = "root" | "yaw";

/** The alternatives of `LayElbow`'s site. */
type LayElbow = "natural" | "level";

/** The alternatives of `LayPosture`'s site. */
type LayPosture = "root" | "yaw";

/**
 * The direction a hand lies on a surface region when the arm chooses it
 * (`lay`), and the direction a hand that continues its forearm points at a
 * place (`reach`). Read by the touch stroke (`AutoMovieMotionHumanTouch`),
 * whose transport is a joint-space carry and so needs no path of its own.
 */
export namespace AutoMovieMotionHumanTouchPath {
  /**
   * The direction an effector's along axis lies on a region when the arm
   * chooses it: from the elbow to the place, across the region's normal. The
   * hand then continues the forearm that reaches the place, so a palm on the
   * performer's own belly lies across it and one on a thigh points down it. The
   * elbow is read hanging under the shoulder, or, for an arm held level, out to
   * the side at the shoulder's height, so a saluting hand continues a forearm
   * that rises to the brow from there.
   *
   * @param body The body.
   * @param posture The posture so far.
   * @param side The hand.
   * @param point The region's point, world.
   * @param normal The region's unit normal.
   * @param fallback The direction when the elbow's direction runs along the
   *   normal.
   * @param elbow Where the elbow is read: hanging (`natural`) or `level` with
   *   the shoulder; hanging when absent.
   * @returns The unit direction.
   */
  export function lay(
    body: IAutoMovieMotionHumanBody,
    posture: Pick<IAutoMovieMotionHumanPosture, LayPosture>,
    side: AutoMovieHumanSide,
    point: IAutoMovieVector3,
    normal: IAutoMovieVector3,
    fallback: IAutoMovieVector3,
    elbow: LayElbow = "natural",
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
   * The direction a hand that continues its forearm onto a place points: from
   * the elbow to the place, as a saluting hand runs straight from the forearm
   * to the brow. Unlike `lay`, the direction is not laid across the region; the
   * hand meets the place end on.
   *
   * @param body The body.
   * @param posture The posture so far.
   * @param side The hand.
   * @param point The place, world.
   * @param elbow Where the elbow is read: hanging (`natural`) or `level` with
   *   the shoulder; hanging when absent.
   * @param from The elbow's place, world, when it has been solved; read from
   *   the body's measures when absent.
   * @returns The unit direction; straight up when the place is on the elbow.
   */
  export function reach(
    body: IAutoMovieMotionHumanBody,
    posture: Pick<IAutoMovieMotionHumanPosture, ReachPosture>,
    side: AutoMovieHumanSide,
    point: IAutoMovieVector3,
    elbow: ReachElbow = "natural",
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
/** The alternatives of `ElbowOfElbow`'s site. */
type ElbowOfElbow = "natural" | "level";

/** The alternatives of `ElbowOfPosture`'s site. */
type ElbowOfPosture = "root" | "yaw";

/**
 * Where the elbow is read for a hand's lay: hanging under the shoulder, or out
 * to the side at the shoulder's height for an arm held level.
 */
function elbowOf(
  body: IAutoMovieMotionHumanBody,
  posture: Pick<IAutoMovieMotionHumanPosture, ElbowOfPosture>,
  side: AutoMovieHumanSide,
  elbow: ElbowOfElbow,
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
