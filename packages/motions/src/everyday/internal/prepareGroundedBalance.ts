import { Vector3, AutoMovieEngineMath } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBalance,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanPhysics } from "../../law/HumanPhysics";
import { HumanFrame } from "../../posture/HumanFrame";
import { HumanBalance } from "../HumanBalance";
import { prepareHumanTrunkBalance } from "./prepareHumanTrunkBalance";

/**
 * Correct over the specified bearing soles, or in the sagittal plane over both
 * feet for a two-footed reach.
 */
export function prepareGroundedBalance(
  body: IAutoMovieMotionHumanBody,
  window: HumanPhysics.Window,
  bearing?: (seconds: number) => readonly AutoMovieHumanSide[],
): IAutoMovieMotionHumanPrimitive["write"] {
  const trunk: ReturnType<typeof prepareHumanTrunkBalance> | undefined =
    window?.by === "trunk" ? prepareHumanTrunkBalance(body) : undefined;
  return (
    posture,
    seconds,
    _before,
    resolution,
    projection,
  ): IAutoMovieMotionHumanPosture => {
    const weight: number = HumanPhysics.weightAt(window, seconds);
    if (weight === 0 || window === null) return posture;
    const sides: readonly AutoMovieHumanSide[] | undefined = bearing?.(seconds);
    if (trunk !== undefined)
      return trunk(posture, weight, resolution, projection, sides);

    const support: IAutoMovieMotionHumanBalance.ISupport = HumanBalance.support(
      body,
      posture,
      resolution,
      projection,
      sides,
    );
    if (sides !== undefined) {
      const hull: IAutoMovieVector3[] = AutoMovieEngineMath.convexHull2D(support.points);
      if (hull.length < 3 || AutoMovieEngineMath.pointInHull(support.centre, hull)) return posture;
      const edge: ReturnType<typeof AutoMovieEngineMath.nearestHullEdge> = AutoMovieEngineMath.nearestHullEdge(
        support.centre,
        hull,
      );
      const nearest: IAutoMovieVector3 = AutoMovieEngineMath.closestPointOnSegmentXZ(
        support.centre,
        edge.start,
        edge.end,
      );
      return {
        ...posture,
        root: {
          x: posture.root.x + weight * (nearest.x - support.centre.x),
          y: posture.root.y,
          z: posture.root.z + weight * (nearest.z - support.centre.z),
        },
      };
    }

    // Intersect the sagittal line of travel with the hull of the bearing soles.
    const direction: IAutoMovieVector3 = HumanFrame.forward(posture.yaw);
    const shift: HumanPhysics.SupportOffset = HumanPhysics.supportOffset(
      support,
      direction,
    );
    return shift === null || shift === 0
      ? posture
      : {
          ...posture,
          root: Vector3.addScaled(posture.root, direction, weight * shift),
        };
  };
}
