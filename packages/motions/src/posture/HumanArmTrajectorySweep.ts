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
 * continuous-time check, Schulman et al. 2013, section V). One reading serves
 * the merit and the convex model of the same iterate.
 */
export namespace HumanArmTrajectorySweep {
  /** One axis sphere's sweep against one shape over one interval. */
  export interface ISwept {
    /** The axis sphere, by index among the placed arm's probes. */
    probe: number;

    /** The shape, by index in the frame of the interval's first waypoint. */
    shape: number;

    /**
     * The sphere's centre at the interval's second waypoint, carried into the
     * shape's frame at the first (`HumanArmTrajectoryPairs.relative`), world
     * metres.
     */
    to: IAutoMovieVector3;

    /**
     * The turn that carries a direction from the second waypoint's frame of the
     * shape to the first's.
     */
    turn: IAutoMovieQuaternion;

    /**
     * The capsule's signed distance to the shape less the sphere's radius,
     * metres (negative inside).
     */
    clear: number;

    /**
     * The least distance the sphere may keep to the shape over the interval,
     * metres: the lesser of its allowances at the two waypoints.
     */
    lower: number;
  }

  /**
   * An arm's sweeps over one interval: every axis sphere against every shape
   * whose bounding sphere lies within the pairs' reach of the sphere at the
   * interval's first waypoint. A sphere that moves less than its own radius
   * relative to a shape sweeps nothing against it and is left out, as is a
   * sweep the shape's bounding sphere shows clear of its allowance by more than
   * `T.CHECK`, which no reader uses.
   *
   * @param c The context.
   * @param a The arm.
   * @param k The interval's first waypoint.
   * @param from The arm placed there.
   * @param to The arm placed at the next waypoint.
   * @returns The sweeps, by sphere and then shape.
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
        // The hand's spheres on what the hand rests on are the goal's contact.
        if (probe >= G.WRIST && frame.resting.has(frame.shapes[shape]!.part))
          continue;
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
        // A sweep its shape's bounding sphere shows clear of its allowance by
        // more than the active set's check distance has no reader: the merit
        // counts only a sweep past its allowance and the convex model only one
        // within `T.CHECK` of it (TrajOpt's d_check, Schulman et al. 2014,
        // section IV), so its exact distance is not read.
        if (beyondCheck(frame.shapes[shape]!, pa, moved.point, r, lower))
          continue;
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

/**
 * Whether a swept sphere clears its allowance by more than the check distance
 * on its shape's declared bounding sphere alone: the shape lies in that sphere,
 * so each point's signed distance to the shape is at least its distance to the
 * sphere's centre less the sphere's radius, and the segment's signed distance,
 * the least over its points (`physicalShapeSegmentDistance`), is at least the
 * segment's distance to the centre less that radius. That bound less the
 * probe's radius is a true lower bound on the sweep's clearance.
 */
function beyondCheck(
  shape: IAutoMovieMotionHumanArmGeometry.IShape,
  from: IAutoMovieVector3,
  to: IAutoMovieVector3,
  radius: number,
  lower: number,
): boolean {
  const bound: number =
    segmentDistance(from, to, shape.centre) - shape.radius - radius;
  return 1000 * (bound - lower) > T.CHECK;
}

/**
 * A point's distance to a segment, metres: to the segment's point nearest it,
 * in closed form.
 */
function segmentDistance(
  a: IAutoMovieVector3,
  b: IAutoMovieVector3,
  p: IAutoMovieVector3,
): number {
  const span: IAutoMovieVector3 = Vector3.subtract(b, a);
  const length: number = Vector3.dot(span, span);
  const u: number =
    length > 0
      ? Math.min(
          1,
          Math.max(0, Vector3.dot(Vector3.subtract(p, a), span) / length),
        )
      : 0;
  return Vector3.distance(p, Vector3.add(a, Vector3.scale(span, u)));
}
