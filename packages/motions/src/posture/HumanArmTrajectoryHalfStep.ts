import {
  Quaternion,
  Vector3,
  physicalShapeNearest,
  physicalShapeSegmentDistance,
} from "@automovie/engine";
import type {
  IAutoMovieMotionHumanArmGeometry,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanArmShapes as S } from "./HumanArmShapes";
import { HumanArmSweepGradient } from "./HumanArmSweepGradient";
import type { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";

/**
 * A probe's pair read over the intervals either side of a waypoint, not at the
 * waypoint alone: the probe's swept segment to each neighbouring waypoint,
 * carried into the shape's frame at the waypoint so the shape's own motion is
 * taken out, and its signed distance to the shape, the continuous-time
 * collision term of TrajOpt (Schulman et al. 2014, "Motion planning with
 * sequential convex optimization and convex collision checking", IJRR 33:1251,
 * section IV-C) on the audit's own probes, so a pair the course admits at its
 * waypoints is admitted at every instant between them, wherever the film is
 * read. A signed distance has unit slope, so a segment of length `L` from a
 * point at distance `g` lies no nearer than `g - L`: a segment that bound
 * already clears is not read exactly.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is read, the frame, the source and the bound that leaves a segment unread.
 * @evidence contracts/development/design.md#principled-representation A neighbour's carried place and turn, and a swept reading's distance and the two ends' gradient directions.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The neighbours, the swept reading and the carrying of a point, read by the pair reading and its convex rows.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The distance is the engine's segment distance and the gradient the sweep's own (`HumanArmSweepGradient`); nothing is scaled.
 */
export namespace HumanArmTrajectoryHalfStep {
  /**
   * The arm placed at the waypoints either side of the one read, where they are
   * placed with their collider probes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member and when it is absent.
   * @evidence contracts/development/design.md#principled-representation The arm's placements, borrowed.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What `neighbours` reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IAround {
    /** The arm at the waypoint before; none at the first or where unplaced. */
    before?: IAutoMovieMotionHumanArmGeometry.IPlaced;

    /** The arm at the waypoint after; none at the last or where unplaced. */
    after?: IAutoMovieMotionHumanArmGeometry.IPlaced;
  }

  /**
   * A probe at a neighbouring waypoint, carried into the shape's frame at the
   * waypoint read.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member, its frame and its unit.
   * @evidence contracts/development/design.md#principled-representation The neighbour's index, the carried place, the turn and the length of the swept segment.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What `swept` and the convex rows read.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface INeighbour {
    /** The neighbouring waypoint. */
    other: number;

    /**
     * The probe's place there, carried into the shape's frame at the waypoint
     * read, world metres.
     */
    point: IAutoMovieVector3;

    /**
     * The turn that carries a direction from the shape's frame at `other` into
     * its frame at the waypoint read.
     */
    turn: IAutoMovieQuaternion;

    /** The swept segment's length, metres. */
    length: number;
  }

  /**
   * The probe's swept segment that comes nearest the shape, read exactly.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member, its frame and its unit.
   * @evidence contracts/development/design.md#principled-representation A signed distance and two gradient directions.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What the pair reading and its convex rows read.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface ISwept {
    /**
     * The segment's signed distance to the shape less the played cubic's stray
     * from it, metres; negative inside.
     */
    gap: number;

    /** The reading's gradient in the probe's place at the waypoint read, world. */
    here: IAutoMovieVector3;

    /**
     * The reading's gradient in the probe's place at each neighbouring waypoint
     * it reads, in that waypoint's world frame.
     */
    there: IGradient[];
  }

  /**
   * A reading's gradient in the probe's place at one neighbouring waypoint.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member and its frame.
   * @evidence contracts/development/design.md#principled-representation A waypoint index and a world direction.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What the convex rows read.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IGradient {
    /** The neighbouring waypoint. */
    other: number;

    /** The gradient, in that waypoint's world frame. */
    direction: IAutoMovieVector3;
  }

  /**
   * The probe at each neighbouring waypoint where the arm is placed with its
   * probes, carried into the shape's frame at `k`.
   *
   * @param c The context.
   * @param a The arm.
   * @param k The waypoint read.
   * @param shape The shape, by its index in the frame at `k`.
   * @param probe The probe.
   * @param placed The arm placed at `k`.
   * @param around The arm at the neighbouring waypoints.
   * @returns The neighbours, none for a still configuration's ends.
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the result.
   * @evidence contracts/development/implementation.md#principled-implementation Each neighbour's place carried by the same collider's placement at `k` times the inverse of its placement there (`HumanArmShapes.relative`).
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two neighbours, each carried once.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A shape that is not the same segment at both waypoints is read as still.
   * @evidence contracts/development/implementation.md#efficient-algorithms Two rigid transforms per pair.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure reading of its arguments.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns fresh records and retains nothing.
   */
  export function neighbours(
    c: M.IContext,
    a: number,
    k: number,
    shape: number,
    probe: number,
    placed: IAutoMovieMotionHumanArmGeometry.IPlaced,
    around: IAround,
  ): INeighbour[] {
    const here: IAutoMovieVector3 | undefined = placed.probes[probe]?.[0];
    const out: INeighbour[] = [];
    if (here === undefined) return out;
    const read = (
      other: number,
      at: IAutoMovieMotionHumanArmGeometry.IPlaced | undefined,
    ): void => {
      const p: IAutoMovieVector3 | undefined = at?.probes[probe]?.[0];
      if (p === undefined || other < 0 || other >= c.n) return;
      const carried: ReturnType<typeof S.relative> = carry(
        c,
        a,
        k,
        other,
        shape,
        p,
      );
      out.push({
        other,
        point: carried.point,
        turn: carried.turn,
        length: Vector3.distance(carried.point, here),
      });
    };
    read(k - 1, around.before);
    read(k + 1, around.after);
    return out;
  }

  /**
   * The nearest of a probe's swept segments to a shape, of those the segment's
   * length leaves short of `room`, read exactly and less the played cubic's
   * greatest stray from the chord.
   *
   * @param shape The shape at the waypoint read.
   * @param here The probe's place at the waypoint read, world metres.
   * @param around The probe's neighbours (`neighbours`).
   * @param room How far the probe's place at the waypoint stands clear of what
   *   the pair may come to, metres: a segment no longer than that is clear.
   * @returns The nearest segment's reading; none where no segment can come
   *   nearer than the waypoint allows.
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the result.
   * @evidence contracts/development/implementation.md#principled-implementation The engine's segment distance and nearest point, and the envelope theorem's gradient at the nearest point carried to the ends by its share of the segment (`HumanArmSweepGradient`, as the axis spheres' sweeps take it).
   * @evidence contracts/development/implementation.md#clear-and-simple-structure A bound, then one exact reading per segment left.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A segment is left unread only where the unit-slope bound proves it clear.
   * @evidence contracts/development/implementation.md#efficient-algorithms At most two segment queries per pair, none for a pair its room already clears.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure reading of its arguments.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh record and retains nothing.
   */
  export function swept(
    shape: IAutoMovieMotionHumanArmGeometry.IShape,
    here: IAutoMovieVector3,
    around: readonly INeighbour[],
    room: number,
  ): ISwept | undefined {
    // The played course between two waypoints is a cubic in the arm's
    // coordinates, not the chord: midway it stands off the chord by an
    // eighth of the second difference over the waypoints, h^2 p'' / 8 with
    // h^2 p'' read as p_(k-1) - 2 p_k + p_(k+1), the interpolation error of
    // a cubic through the samples. Its share along the shape's outward
    // normal at the segment's nearest point is how much nearer the shape the
    // course comes than the chord; a stray along the surface or away from
    // it comes no nearer, so a probe that slides along a surface is not read
    // into it.
    const second: IAutoMovieVector3 | undefined =
      around.length === 2
        ? Vector3.subtract(
            Vector3.add(around[0]!.point, around[1]!.point),
            Vector3.scale(here, 2),
          )
        : undefined;
    const bound: number = second === undefined ? 0 : Vector3.length(second) / 8;
    let best: ISwept | undefined;
    for (const n of around) {
      if (n.length + bound <= room) continue;
      const span: IAutoMovieVector3 = Vector3.subtract(n.point, here);
      const near: ReturnType<typeof physicalShapeNearest> =
        physicalShapeNearest(shape.pose, shape.shape, here, n.point);
      const toward: number =
        second === undefined
          ? 0
          : Math.max(0, Vector3.dot(near.normal, second) / 8);
      const gap: number =
        physicalShapeSegmentDistance(shape.pose, shape.shape, here, n.point) -
        toward;
      if (best !== undefined && gap >= best.gap) continue;
      const u: number = Math.min(
        1,
        Math.max(
          0,
          Vector3.dot(Vector3.subtract(near.at, here), span) /
            Math.max(1e-12, Vector3.dot(span, span)),
        ),
      );
      const g: IAutoMovieVector3 = HumanArmSweepGradient(shape, near, span, u);

      // The stray's gradient, where it reads: the normal's eighth, twice
      // over at the waypoint read and once against at each neighbour.
      const stray: number = toward > 0 ? 1 / 8 : 0;
      best = {
        gap,
        here: Vector3.add(
          Vector3.scale(g, 1 - u),
          Vector3.scale(near.normal, 2 * stray),
        ),
        there: around.map(
          (m: INeighbour): IGradient => ({
            other: m.other,
            direction: Quaternion.rotateVector(
              Quaternion.inverse(m.turn),
              Vector3.subtract(
                m === n ? Vector3.scale(g, u) : { x: 0, y: 0, z: 0 },
                Vector3.scale(near.normal, stray),
              ),
            ),
          }),
        ),
      };
    }
    return best;
  }

  /**
   * A point at waypoint `from + 1` carried into a shape's frame at `from`, and
   * the turn that carries a direction with it: the point itself and no turn
   * where the shape is not the same segment at both.
   *
   * @param c The context.
   * @param a The arm.
   * @param from The earlier waypoint.
   * @param shape The shape's index in the frames at `from` and `from + 1`.
   * @param p The point at `from + 1`, world metres.
   * @returns The point in the frame at `from`, and the turn.
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the result and the still case.
   * @evidence contracts/development/implementation.md#principled-implementation The matching collider's placement at `from` times the inverse of its placement at `from + 1` (`HumanArmShapes.relative`).
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One identity check and one transform.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A collider that is not the same segment at both is read as still, never matched by place.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure reading of its arguments.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh record and retains nothing.
   */
  export function relative(
    c: M.IContext,
    a: number,
    from: number,
    shape: number,
    p: IAutoMovieVector3,
  ): ReturnType<typeof S.relative> {
    return carry(c, a, from, from + 1, shape, p);
  }

  /**
   * A point at waypoint `there` carried into a shape's frame at `here`, and the
   * turn that carries a direction with it; the point and no turn where the
   * shape is not the same segment at both.
   */
  function carry(
    c: M.IContext,
    a: number,
    here: number,
    there: number,
    shape: number,
    p: IAutoMovieVector3,
  ): ReturnType<typeof S.relative> {
    const now: IAutoMovieMotionHumanArmGeometry.IShape | undefined =
      c.frames[a]![here]!.shapes[shape];
    const next: IAutoMovieMotionHumanArmGeometry.IShape | undefined =
      c.frames[a]![there]!.shapes[shape];
    if (
      now === undefined ||
      next === undefined ||
      next.bone !== now.bone ||
      next.part !== now.part
    )
      return { point: p, turn: Quaternion.identity() };
    return S.relative(now, next, p);
  }
}
