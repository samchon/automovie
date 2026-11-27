import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanArmGeometry,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanArmGeometry as G } from "./HumanArmGeometry";
import { HumanArmShapes as S } from "./HumanArmShapes";
import type { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";

/**
 * An arm's course from a read waypoint to the next, as the swept readings take
 * it: the arm placed at every frame on the way, each place carried into a
 * shape's frame at the waypoint read so the shape's own motion is taken out
 * (continuous collision detection against a moving obstacle), and the bounds a
 * screen reads before any exact query.
 */
export namespace HumanArmTrajectoryHalfStep {
  /** The arm at one frame of an interval. */
  export interface IStep {
    /** The frame's waypoint. */
    at: number;

    /** The arm placed there, its collider probes where they are placed. */
    placed: IAutoMovieMotionHumanArmGeometry.IPlaced;
  }

  /** The arm at the next read waypoint and on the way to it. */
  export interface INear {
    /** The next read waypoint. */
    at: number;

    /** The arm placed there, with its collider probes. */
    placed: IAutoMovieMotionHumanArmGeometry.IPlaced;

    /**
     * The arm at every frame from the waypoint read to the next, in that order,
     * the waypoint read left out and the next last.
     */
    path: readonly IStep[];
  }

  /**
   * How far each probe and each shape travels on the way to the next read
   * waypoint, in world, at most: a probe's farthest place from its place at the
   * waypoint read, and a shape's centre's step plus its bounding radius times
   * the chord of its turn, which bounds how far any point of it moves. A pair's
   * carried course strays from the probe's place no farther than the two
   * summed.
   */
  export interface ITravel {
    /** Each probe's farthest place on the way, metres; zero without one. */
    probes: Float64Array;

    /** Each shape's farthest point's step on the way, metres. */
    shapes: Float64Array;
  }

  /**
   * A probe's world place in an arm placed at a frame: its placed place where
   * the collider probes are placed, carried by its segment otherwise.
   *
   * @param frame The frame.
   * @param placed The arm placed there.
   * @param probe The probe.
   * @returns World metres.
   */
  export function point(
    frame: IAutoMovieMotionHumanArmGeometry.IFrame,
    placed: IAutoMovieMotionHumanArmGeometry.IPlaced,
    probe: number,
  ): IAutoMovieVector3 {
    const known: readonly [IAutoMovieVector3, number] | undefined =
      placed.probes[probe];
    if (known !== undefined) return known[0];
    const i: number = probe - G.SURFACE;
    const owner: PointOwner = frame.owners[i]!;
    return Vector3.add(
      owner === "upper"
        ? placed.shoulder
        : owner === "lower"
          ? placed.elbow
          : placed.wrist,
      Quaternion.rotateVector(
        owner === "upper"
          ? placed.upper
          : owner === "lower"
            ? placed.lower
            : placed.hand,
        frame.surface[i]!,
      ),
    );
  }

  /**
   * The travel bounds of a waypoint's probes and shapes on the way to the next
   * read waypoint (`ITravel`).
   *
   * @param c The context.
   * @param a The arm.
   * @param k The waypoint.
   * @param placed The arm placed at `k`.
   * @param near The arm on the way to the next read waypoint.
   * @returns The bounds.
   */
  export function travel(
    c: M.IContext,
    a: number,
    k: number,
    placed: IAutoMovieMotionHumanArmGeometry.IPlaced,
    near: INear,
  ): ITravel {
    const frame: IAutoMovieMotionHumanArmGeometry.IFrame = c.frames[a]![k]!;
    const probes: Float64Array = new Float64Array(placed.probes.length);
    const shapes: Float64Array = new Float64Array(frame.shapes.length);
    for (const step of near.path) {
      const at: IAutoMovieMotionHumanArmGeometry.IFrame =
        c.frames[a]![step.at]!;
      for (let i: number = 0; i < placed.probes.length; ++i)
        probes[i] = Math.max(
          probes[i]!,
          Vector3.distance(placed.probes[i]![0], point(at, step.placed, i)),
        );
      frame.shapes.forEach(
        (now: IAutoMovieMotionHumanArmGeometry.IShape, s: number): void => {
          const then: IAutoMovieMotionHumanArmGeometry.IShape | undefined =
            at.shapes[s];
          // A shape that is not the same segment there is read as still,
          // as `carry` carries it.
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
    }
    return { probes, shapes };
  }

  /**
   * The least signed distance from a segment to a shape its bounding sphere
   * allows: the segment's distance to the sphere's centre, in closed form at
   * the segment's point nearest it, less the radius. The shape lies in the
   * sphere, so every point's distance to it is at least its distance to the
   * centre less the radius, and the segment's, the least over its points, at
   * least this.
   *
   * @param shape The shape.
   * @param a The segment's one end, world metres.
   * @param b Its other end.
   * @returns Metres; negative where the segment enters the sphere.
   */
  export function sphere(
    shape: IAutoMovieMotionHumanArmGeometry.IShape,
    a: IAutoMovieVector3,
    b: IAutoMovieVector3,
  ): number {
    const span: IAutoMovieVector3 = Vector3.subtract(b, a);
    const length: number = Vector3.dot(span, span);
    const u: number =
      length > 0
        ? Math.min(
            1,
            Math.max(
              0,
              Vector3.dot(Vector3.subtract(shape.centre, a), span) / length,
            ),
          )
        : 0;
    return (
      Vector3.distance(shape.centre, Vector3.add(a, Vector3.scale(span, u))) -
      shape.radius
    );
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
   *
   * @param c The context.
   * @param a The arm.
   * @param here The waypoint whose frame the point is carried into.
   * @param there The waypoint the point is placed at.
   * @param shape The shape's index in the frames at both.
   * @param p The point at `there`, world metres.
   * @returns The point in the frame at `here`, and the turn.
   */
  export function carry(
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
      here === there ||
      now === undefined ||
      next === undefined ||
      next.bone !== now.bone ||
      next.part !== now.part
    )
      return { point: p, turn: Quaternion.identity() };
    return S.relative(now, next, p);
  }
}

/** The alternatives of `PointOwner`'s site. */
type PointOwner = "upper" | "lower" | "hand";
