import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanArmGeometry,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanArmGeometry as G } from "./HumanArmGeometry";
import { HumanArmShapes as S } from "./HumanArmShapes";
import type { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";
import { HumanArmTrajectoryPairs as P } from "./HumanArmTrajectoryPairs";
import { HumanArmTrajectoryTerms as T } from "./HumanArmTrajectoryTerms";

/**
 * The arm's axis spheres swept between two waypoints of its trajectory
 * (`HumanArmTrajectoryModel`): each sphere's motion from one waypoint to the
 * next is a capsule, read against every shape near its first end (TrajOpt's
 * continuous-time check, Schulman et al. 2013, section V). One reading
 * serves the merit and the convex model of the same iterate.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is swept, between which instants, against what, and who reads it.
 * @evidence contracts/development/design.md#principled-representation One record per sphere and shape in the units both readers use, metres, with the probe's far end already carried into the shape's frame at the first waypoint.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The record and its one producer, read by `HumanArmTrajectoryModel.evaluate` and `HumanArmTrajectoryConvex.convexify`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No pair is named and no allowance is the sweep's own: both come from the context.
 */
export namespace HumanArmTrajectorySweep {
  /**
   * One axis sphere's sweep against one shape over one interval.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning, unit and frame.
   * @evidence contracts/development/design.md#principled-representation The swept capsule's far end, the turn that carries directions with it, its clearance and its bound, the four facts the violation and its linearisation are made of.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Six members, all read by the convex model; the merit reads `clear` and `lower`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Indices into the placed arm's probes and the frame's shapes, not copies.
   */
  export interface ISwept {
    /** The axis sphere, by index among the placed arm's probes. */
    probe: number;

    /** The shape, by index in the frame of the interval's first waypoint. */
    shape: number;

    /** The sphere's centre at the interval's second waypoint, carried into the shape's frame at the first (`HumanArmTrajectoryPairs.relative`), world metres. */
    to: IAutoMovieVector3;

    /** The turn that carries a direction from the second waypoint's frame of the shape to the first's. */
    turn: IAutoMovieQuaternion;

    /** The capsule's signed distance to the shape less the sphere's radius, metres (negative inside). */
    clear: number;

    /** The least distance the sphere may keep to the shape over the interval, metres: the lesser of its allowances at the two waypoints. */
    lower: number;
  }

  /**
   * An arm's sweeps over one interval: every axis sphere against every
   * shape whose bounding sphere lies within the pairs' reach of the sphere
   * at the interval's first waypoint. A sphere that moves less than its own
   * radius relative to a shape sweeps nothing against it and is left out.
   *
   * @param c The context.
   * @param a The arm.
   * @param k The interval's first waypoint.
   * @param from The arm placed there.
   * @param to The arm placed at the next waypoint.
   * @returns The sweeps, by sphere and then shape.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is read, what is left out and the order.
   * @evidence contracts/development/implementation.md#principled-implementation A sphere moving on a segment sweeps a capsule; its signed distance to a convex shape is the segment's distance less the radius (`physicalShapeSegmentDistance`), read relative to the shape's own motion as continuous collision detection against a moving obstacle is.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop over the eight spheres and the shapes near each.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The reach, the allowances and the radius are the model's own, unchanged; the exact segment distance decides, the bounding spheres only screen.
   * @evidence contracts/development/implementation.md#efficient-algorithms Eight sphere screens over the waypoint's reachable shapes and one segment distance per near shape.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The reading is kept on the iterate's evaluation, so the convex model of the same iterate reads these records instead of the geometry again.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns fresh records and retains nothing.
   */
  export function of(
    c: M.IContext,
    a: number,
    k: number,
    from: IAutoMovieMotionHumanArmGeometry.IPlaced,
    to: IAutoMovieMotionHumanArmGeometry.IPlaced,
  ): ISwept[] {
    const frame: IAutoMovieMotionHumanArmGeometry.IFrame = c.frames[a]![k]!;
    const out: ISwept[] = [];
    for (let probe: number = 0; probe < G.SURFACE; ++probe) {
      const [pa, r]: readonly [IAutoMovieVector3, number] = from.probes[probe]!;
      for (const shape of S.near(
        frame,
        pa,
        r + T.REACH,
        undefined,
        c.reachable[a]![k]!,
      )) {
        // The probe's motion relative to the shape, which may move too.
        const moved: {
          point: IAutoMovieVector3;
          turn: IAutoMovieQuaternion;
        } = P.relative(c, a, k, shape, to.probes[probe]![0]);
        if (Vector3.length(Vector3.subtract(pa, moved.point)) < r) continue;
        const lower: number = Math.min(
          c.allowed(a, k, probe, shape),
          c.allowed(a, k + 1, probe, shape),
        );
        out.push({
          probe,
          shape,
          to: moved.point,
          turn: moved.turn,
          clear: S.gap(frame, shape, pa, moved.point) - r,
          lower,
        });
      }
    }
    return out;
  }
}
