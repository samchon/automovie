import {
  Vector3,
  AutoMovieEnginePhysics,
} from "@automovie/engine";
import type {
  IAutoMovieMotionHumanArmGeometry,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanAuditSkin } from "../../audit/internal/AutoMovieMotionHumanAuditSkin";
import { HumanArmGeometry as G } from "./HumanArmGeometry";
import { HumanArmShapes as S } from "./HumanArmShapes";
import type { HumanArmTrajectoryContext } from "./HumanArmTrajectoryContext";
import type { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";
import { HumanArmTrajectoryTerms as T } from "./HumanArmTrajectoryTerms";

/*
 * A waypoint's record, built: the arm resting there placed (`resting`) and its
 * colliders, and each site's touched collider and outward normal, the collider
 * nearest the site's point when the point lies on it, among the riding arm's
 * own segment's for a site that rides an arm.
 * Parameter problem: The trajectory's problem.
 * Parameter setups: Each arm's setup.
 * Parameter resting: Each arm resting at the waypoint, coordinates: the rest arm,
 * or at a fixed last waypoint the arm the action leaves to.
 * Parameter frames: Each arm's frame there.
 * Parameter sites: Each arm's site there, on the hold.
 * Returns: The record.
 */
export function HumanArmTrajectoryWaypoint(
  problem: HumanArmTrajectoryContext.IProblem,
  setups: readonly IAutoMovieMotionHumanArmGeometry.ISetup[],
  resting: readonly (readonly number[])[],
  frames: IAutoMovieMotionHumanArmGeometry.IFrame[],
  sites: (M.ISite | undefined)[],
): HumanArmTrajectoryWaypoint.IWaypoint {
  const placed: IAutoMovieMotionHumanArmGeometry.IPlaced[] = setups.map(
    (
      setup: IAutoMovieMotionHumanArmGeometry.ISetup,
      a: number,
    ): IAutoMovieMotionHumanArmGeometry.IPlaced =>
      G.placed(setup, frames[a]!, resting[a]!),
  );
  const colliders: IAutoMovieMotionHumanArmGeometry.IShape[][] = frames.map(
    (
      frame: IAutoMovieMotionHumanArmGeometry.IFrame,
      a: number,
    ): IAutoMovieMotionHumanArmGeometry.IShape[] =>
      S.colliders(frame, placed[a]!),
  );
  const touched: number[] = sites.map((): number => -1);
  const heights: (number | undefined)[] = sites.map((): undefined => undefined);
  const normals: (IAutoMovieVector3 | undefined)[] = sites.map(
    (site: M.ISite | undefined, a: number): IAutoMovieVector3 | undefined => {
      // A grip on a held object touches no surface of the body: it is held to
      // its point on every axis, so it has no touched collider.
      if (site === undefined || problem.arms[a]!.grasp !== undefined)
        return undefined;
      const on: M.ISite["on"] = site.on;
      const candidates: IAutoMovieMotionHumanArmGeometry.IShape[] =
        on === undefined ? frames[a]!.shapes : colliders[on.arm]!;
      const owners: NormalsOwnersItem[] =
        on === undefined
          ? []
          : frames[on.arm]!.colliders.flatMap(
              (
                col: IAutoMovieMotionHumanArmGeometry.IFrame["colliders"][number],
              ): OwnersItemResult[] =>
                col.shapes.map((): NormalsOwnersResult => col.owner),
            );
      let best: number = -1;
      let least: number = Infinity;
      candidates.forEach(
        (shape: IAutoMovieMotionHumanArmGeometry.IShape, i: number): void => {
          if (on !== undefined && owners[i] !== on.owner) return;
          const d: number = AutoMovieEnginePhysics.physicalShapeSegmentDistance(
            shape.pose,
            shape.shape,
            site.point,
            site.point,
          );
          if (d < least) {
            least = d;
            best = i;
          }
        },
      );

      // A site touches the collider its point lies on, within the depth a
      // pressed skin gives (`AutoMovieMotionHumanAuditSkin.BUILT`); a site
      // in free space, however near a collider, touches none.
      if (best < 0 || least > AutoMovieMotionHumanAuditSkin.BUILT)
        return undefined;
      touched[a] = best;
      if (on === undefined) heights[a] = least;
      const s: IAutoMovieMotionHumanArmGeometry.IShape = candidates[best]!;
      return AutoMovieEnginePhysics.physicalShapeNormal(
        s.pose,
        s.shape,
        site.point,
        Vector3.normalize(Vector3.subtract(site.point, s.centre)),
      );
    },
  );
  return {
    frames,
    sites,
    placed,
    colliders,
    touched,
    heights,
    normals,
    reachable: frames.map(
      (frame: IAutoMovieMotionHumanArmGeometry.IFrame, a: number): number[] =>
        S.reachable(frame, placed[a]!, T.REACH),
    ),
  };
}

/*
 * What an arms' trajectory reads at one waypoint, built once per waypoint by
 * its context (`HumanArmTrajectoryContext`).
 */
export namespace HumanArmTrajectoryWaypoint {
  /*
   * What a context holds at one waypoint for every arm, built once with the
   * context: its frames and sites, the arm resting there placed and its
   * colliders, each site's touched collider and normal, and the shapes the arm
   * can reach. The pair allowances read there are the context's own tables
   * (`HumanArmTrajectoryAllowances`).
   */
  export interface IWaypoint {
    /*
     * Each arm's frame.
     */
    frames: IAutoMovieMotionHumanArmGeometry.IFrame[];
    /*
     * Each arm's site, on the hold.
     */
    sites: (M.ISite | undefined)[];
    /*
     * Each arm resting at the waypoint, placed: the rest arm, or at a fixed
     * last waypoint the arm the action leaves to, which the waypoint holds.
     */
    placed: IAutoMovieMotionHumanArmGeometry.IPlaced[];
    /*
     * Each arm's colliders resting there, which the other arm's probes are read
     * against.
     */
    colliders: IAutoMovieMotionHumanArmGeometry.IShape[][];
    /*
     * Each arm's site's touched collider; -1 where none.
     */
    touched: number[];
    /*
     * Signed height of a fixed site over that collider, metres.
     */
    heights: (number | undefined)[];
    /*
     * Each arm's site's outward normal.
     */
    normals: (IAutoMovieVector3 | undefined)[];
    /*
     * Each arm's frame's shapes any placement of the arm can come within the
     * pairs' reach of, ascending (`HumanArmShapes.reachable`).
     */
    reachable: number[][];
  }
}

/*
 * The alternatives of `NormalsOwnersResult`'s site.
 */
type NormalsOwnersResult = "upper" | "lower" | "hand";

/*
 * The alternatives of `OwnersItemResult`'s site.
 */
type OwnersItemResult = "upper" | "lower" | "hand";

/*
 * The alternatives of `NormalsOwnersItem`'s site.
 */
type NormalsOwnersItem = "upper" | "lower" | "hand";
