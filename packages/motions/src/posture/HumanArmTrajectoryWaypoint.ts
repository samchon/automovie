import {
  Vector3,
  physicalShapeNormal,
  physicalShapeSegmentDistance,
} from "@automovie/engine";
import type {
  IAutoMovieMotionHumanArmGeometry,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanAuditSkin } from "../audit/AutoMovieMotionHumanAuditSkin";
import { HumanArmGeometry as G } from "./HumanArmGeometry";
import { HumanArmShapes as S } from "./HumanArmShapes";
import type { HumanArmTrajectoryContext } from "./HumanArmTrajectoryContext";
import type { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";

/**
 * What an arms' trajectory reads at one waypoint, built once per waypoint
 * and kept by every later reading of the same arms
 * (`HumanArmTrajectoryContext.of`).
 */
export namespace HumanArmTrajectoryWaypoint {
  /**
   * What a context holds at one waypoint for every arm, built once and kept
   * by every later reading of the same arms that has the waypoint
   * (`HumanArmTrajectoryContext.of`): its frames and sites, which identify
   * it, the arm resting there placed and its colliders, each site's touched
   * collider and normal, and the memos of the allowances read there.
   */
  export interface IWaypoint {
    /** Each arm's frame. */
    frames: IAutoMovieMotionHumanArmGeometry.IFrame[];
    /** Each arm's site, on the hold. */
    sites: (M.ISite | undefined)[];
    /** Each arm resting at the waypoint, placed: the rest arm, or at a fixed last waypoint the arm the action leaves to, which the waypoint holds. */
    placed: IAutoMovieMotionHumanArmGeometry.IPlaced[];
    /** Each arm's colliders resting there, which the other arm's probes are read against. */
    colliders: IAutoMovieMotionHumanArmGeometry.IShape[][];
    /** Each arm's site's touched collider; -1 where none. */
    touched: number[];
    /** Each arm's site's outward normal. */
    normals: (IAutoMovieVector3 | undefined)[];
    /** Each arm's probes' allowances against the frame's shapes (`allowed`), by pair. */
    allowed: Map<number, number>[];
    /** Each arm's probes' allowances against the other arm's colliders (`between`), by pair. */
    between: Map<number, number>[];
    /** The body's corners' allowances inside each arm's colliders (`inside`), by pair. */
    inside: Map<number, number>[];
    /** Each arm's colliders, one entry per shape, once read. */
    flat: (IAutoMovieMotionHumanArmGeometry.IFrame["colliders"] | undefined)[];
  }

  /**
   * A waypoint's record, built: the arm resting there placed (`resting`) and
   * its colliders, and each site's touched collider and outward normal, the
   * collider nearest the site's point when the point lies on it, among the riding arm's own segment's
   * for a site that rides an arm.
   *
   * @param problem The trajectory's problem.
   * @param setups Each arm's setup.
   * @param resting Each arm resting at the waypoint, coordinates: the rest arm, or at a fixed last waypoint the arm the action leaves to.
   * @param frames Each arm's frame there.
   * @param sites Each arm's site there, on the hold.
   * @returns The record.
   */
  export function of(
    problem: HumanArmTrajectoryContext.IProblem,
    setups: readonly IAutoMovieMotionHumanArmGeometry.ISetup[],
    resting: readonly (readonly number[])[],
    frames: IAutoMovieMotionHumanArmGeometry.IFrame[],
    sites: (M.ISite | undefined)[],
  ): IWaypoint {
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
    const normals: (IAutoMovieVector3 | undefined)[] = sites.map(
      (site: M.ISite | undefined, a: number): IAutoMovieVector3 | undefined => {
        // A grip on a held object touches no surface of the body: it is held to
        // its point on every axis, so it has no touched collider.
        if (site === undefined || problem.arms[a]!.grasp !== undefined)
          return undefined;
        const on: M.ISite["on"] = site.on;
        const candidates: IAutoMovieMotionHumanArmGeometry.IShape[] =
          on === undefined ? frames[a]!.shapes : colliders[on.arm]!;
        const owners: ("upper" | "lower" | "hand")[] =
          on === undefined
            ? []
            : frames[on.arm]!.colliders.flatMap(
                (
                  col: IAutoMovieMotionHumanArmGeometry.IFrame["colliders"][number],
                ): ("upper" | "lower" | "hand")[] =>
                  col.shapes.map((): "upper" | "lower" | "hand" => col.owner),
              );
        let best: number = -1;
        let least: number = Infinity;
        candidates.forEach(
          (shape: IAutoMovieMotionHumanArmGeometry.IShape, i: number): void => {
            if (on !== undefined && owners[i] !== on.owner) return;
            const d: number = physicalShapeSegmentDistance(
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
        const s: IAutoMovieMotionHumanArmGeometry.IShape = candidates[best]!;
        return physicalShapeNormal(
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
      normals,
      allowed: sites.map((): Map<number, number> => new Map()),
      between: sites.map((): Map<number, number> => new Map()),
      inside: sites.map((): Map<number, number> => new Map()),
      flat: sites.map((): undefined => undefined),
    };
  }
}
