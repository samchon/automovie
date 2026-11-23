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
 */
export namespace HumanArmTrajectoryHalfStep {
  /**
   * The arm placed at the waypoints either side of the one read, where they are
   * placed with their collider probes.
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

  /** The probe's swept segment that comes nearest the shape, read exactly. */
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

  /** A reading's gradient in the probe's place at one neighbouring waypoint. */
  export interface IGradient {
    /** The neighbouring waypoint. */
    other: number;

    /** The gradient, in that waypoint's world frame. */
    direction: IAutoMovieVector3;
  }

  /**
   * How far each probe and each shape travels to the neighbouring waypoints, in
   * world, at most: a probe's longer step to a placed neighbour, and a shape's
   * centre's step plus its bounding radius times the chord of its turn, which
   * bounds how far any point of it moves. A pair's swept segment, carried into
   * the shape's frame, is no longer than the two summed, so a pair the shape's
   * sphere shows clear by that much needs no neighbour read at all.
   */
  export interface ITravel {
    /** Each probe's longer step to a placed neighbour, metres; zero without one. */
    probes: Float64Array;

    /** Each shape's farthest point's step to the same neighbours, metres. */
    shapes: Float64Array;
  }

  /**
   * How far nearer than at its waypoint a pair can come over the intervals to
   * its neighbours, per metre of its travel `L` (the probe's and the shape's
   * summed, `ITravel`): its swept chord comes at most `L` nearer, and the
   * played cubic's stray toward the shape is at most an eighth of the second
   * difference `|p(k-1) - 2 p(k) + p(k+1)|`, which the triangle inequality
   * bounds by `2 L`; so `L + 2 L / 8`. A screen widened by this times the
   * travel leaves out no pair the swept reading (`swept`) could find within its
   * allowance.
   */
  export const SWEPT: number = 1 + 2 / 8;

  /**
   * The travel bounds of a waypoint's probes and shapes (`ITravel`).
   *
   * @param c The context.
   * @param a The arm.
   * @param k The waypoint.
   * @param placed The arm placed at `k`.
   * @param around The arm at the neighbouring waypoints.
   * @returns The bounds.
   */
  export function travel(
    c: M.IContext,
    a: number,
    k: number,
    placed: IAutoMovieMotionHumanArmGeometry.IPlaced,
    around: IAround,
  ): ITravel {
    const frame: IAutoMovieMotionHumanArmGeometry.IFrame = c.frames[a]![k]!;
    const probes: Float64Array = new Float64Array(placed.probes.length);
    const shapes: Float64Array = new Float64Array(frame.shapes.length);
    const read = (
      other: number,
      at: IAutoMovieMotionHumanArmGeometry.IPlaced | undefined,
    ): void => {
      if (at === undefined || other < 0 || other >= c.n) return;
      for (let i: number = 0; i < placed.probes.length; ++i) {
        const there: IAutoMovieVector3 | undefined = at.probes[i]?.[0];
        if (there !== undefined)
          probes[i] = Math.max(
            probes[i]!,
            Vector3.distance(placed.probes[i]![0], there),
          );
      }
      const shifted: IAutoMovieMotionHumanArmGeometry.IFrame =
        c.frames[a]![other]!;
      frame.shapes.forEach(
        (now: IAutoMovieMotionHumanArmGeometry.IShape, s: number): void => {
          const then: IAutoMovieMotionHumanArmGeometry.IShape | undefined =
            shifted.shapes[s];
          // A shape that is not the same segment there is read as still,
          // as `neighbours` carries it.
          const moved: number =
            then === undefined ||
            then.bone !== now.bone ||
            then.part !== now.part
              ? 0
              : Vector3.distance(now.centre, then.centre) +
                now.radius *
                  2 *
                  Math.sin(
                    Quaternion.angle(now.pose.rotation, then.pose.rotation) / 2,
                  );
          shapes[s] = Math.max(shapes[s]!, moved);
        },
      );
    };
    read(k - 1, around.before);
    read(k + 1, around.after);
    return { probes, shapes };
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
