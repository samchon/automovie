import { Quaternion } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFoot } from "../HumanFoot";

/** The alternatives of `PrepareHumanFootHeightPoint`'s site. */
type PrepareHumanFootHeightPoint = "heel" | "ball" | "toe" | "sole" | "mtp";

/**
 * Prepare only the world height of one fixed articulated sole socket.
 *
 * @param body The unchanged canonical body owning its socket and rest joints.
 * @param side The foot.
 * @param point The same sole socket or toes joint accepted by HumanFoot.point.
 * @param toes Fixed toe flexion, degrees; zero when absent.
 * @returns The exact metre Y component of HumanFoot.point for each actual
 *   placement.
 */
export function prepareHumanFootHeight(
  body: IAutoMovieMotionHumanBody,
  side: AutoMovieHumanSide,
  point: PrepareHumanFootHeightPoint,
  toes: number = 0,
): (foot: IAutoMovieMotionHumanFoot.IPlacement) => number {
  const local: ReturnType<typeof HumanFoot.offset> = HumanFoot.offset(
    body,
    side,
    point,
    toes,
  );
  return (foot: IAutoMovieMotionHumanFoot.IPlacement): number =>
    height(local, foot);
}
/** The alternatives of `PrepareHumanFootHeightArticulatedPoint`'s site. */
type PrepareHumanFootHeightArticulatedPoint =
  | "heel"
  | "ball"
  | "toe"
  | "sole"
  | "mtp";

/** Height readers whose fixed socket has changing toe flexion between reads. */
export namespace prepareHumanFootHeight {
  /**
   * Bind unchanged body/socket geometry once; each actual toe angle creates one
   * exact local offset and a height reader for that angle's placement trials.
   * Release the angle reader with its synchronous query and the fixed reader
   * with its swing/action. Neither reader retains a queried placement or
   * history.
   */
  export function articulated(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
    point: PrepareHumanFootHeightArticulatedPoint,
  ): (toes: number) => (foot: IAutoMovieMotionHumanFoot.IPlacement) => number {
    const offset: ReturnType<typeof HumanFoot.prepareOffset> =
      HumanFoot.prepareOffset(body, side, point);
    return (
      toes: number,
    ): ((foot: IAutoMovieMotionHumanFoot.IPlacement) => number) => {
      const local: IAutoMovieVector3 = offset(toes);
      return (foot: IAutoMovieMotionHumanFoot.IPlacement): number =>
        height(local, foot);
    };
  }
}

/** The exact original rigid point height, omitting only unread X/Z outputs. */
function height(
  local: IAutoMovieVector3,
  foot: IAutoMovieMotionHumanFoot.IPlacement,
): number {
  return foot.ankle.y + Quaternion.rotateVectorY(foot.rotation, local);
}
