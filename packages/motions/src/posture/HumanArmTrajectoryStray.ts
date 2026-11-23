import type {
  IAutoMovieMotionHumanArmGeometry,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";

/**
 * How far an arm's segments stray, within one step of the frame grid, from the
 * straight chords their points run between their places at the step's two
 * waypoints: the margin a pair's swept reading over an interval between two
 * read waypoints is widened by, its course read through the arm's place at
 * every frame between (`HumanArmTrajectoryHalfStep`,
 * `HumanAuditModel.certify`), so a pair that widened reading keeps clear is
 * clear over the played course.
 *
 * A point riding a rigid segment lies at `o + R w`, so its stray from the chord
 * of a step is at most the origin's stray plus `|w|` times the rotation
 * matrix's stray (Frobenius, which bounds the operator norm): a segment's stray
 * is two numbers, `origin` and `turn`, and a point's is `origin + reach turn`
 * for its distance `reach` from the segment's origin. Within a step it is the
 * cubic's interpolation error, an eighth of the second difference of the origin
 * and of the rotation matrix over the waypoints about it (`h^2 p'' / 8`, the
 * bound the course's chord reading has taken between frames), the greatest over
 * the interval's waypoints.
 */
export namespace HumanArmTrajectoryStray {
  /** How far a rigid segment's points stray from their chords. */
  export interface IStray {
    /** The origin's stray, metres. */
    origin: number;

    /** The rotation matrix's stray, metres per metre of reach. */
    turn: number;
  }

  /** An arm's three segments' strays. */
  export type IArm = Record<"upper" | "lower" | "hand", IStray>;

  /**
   * The arm's segments' strays within the steps of the interval between
   * waypoints `k` and `n`, `k < n`.
   *
   * @param c The context.
   * @param placed The arm placed at every waypoint of the context.
   * @param k The interval's first waypoint.
   * @param n Its last.
   * @returns The strays.
   */
  export function arm(
    c: M.IContext,
    placed: readonly IAutoMovieMotionHumanArmGeometry.IPlaced[],
    k: number,
    n: number,
  ): IArm {
    return {
      upper: segment(c, placed, k, n, "upper"),
      lower: segment(c, placed, k, n, "lower"),
      hand: segment(c, placed, k, n, "hand"),
    };
  }

  /**
   * A point's stray on a segment.
   *
   * @param stray The segment's stray.
   * @param reach The point's distance from the segment's origin, metres.
   * @returns Metres.
   */
  export function of(stray: IStray, reach: number): number {
    return stray.origin + reach * stray.turn;
  }

  /**
   * How far a frame's shape carries the points read against it within one step
   * of an interval, as a stray of their carried chords: a pair is read in the
   * shape's frame at the read waypoint, each frame's place carried there by the
   * shape's own motion (`HumanArmTrajectoryHalfStep.carry`), exactly at every
   * frame; within a step the shape moves on its own course, which stands off
   * its chord by the interpolation error of its pose, an eighth of the second
   * difference of its origin and of its rotation matrix over the frames about
   * the step, read as `arm` reads a segment's. A still shape strays nothing.
   *
   * @param c The context.
   * @param a The arm whose frames hold the shape.
   * @param k One end of the interval.
   * @param n Its other end.
   * @param shape The shape, by its index in every frame of the interval.
   * @returns The stray.
   */
  export function shape(
    c: M.IContext,
    a: number,
    k: number,
    n: number,
    shape: number,
  ): IStray {
    const frames: readonly IAutoMovieMotionHumanArmGeometry.IFrame[] =
      c.frames[a]!;
    const own: IAutoMovieMotionHumanArmGeometry.IShape | undefined =
      frames[Math.min(k, n)]!.shapes[shape];
    if (own === undefined) return { origin: 0, turn: 0 };
    // A shape that is not the same segment at a frame is read as still
    // there, as the pairs carry it (`HumanArmTrajectoryHalfStep`).
    const pose = (g: number): IPose => {
      const s: IAutoMovieMotionHumanArmGeometry.IShape | undefined =
        frames[g]!.shapes[shape];
      return s === undefined || s.bone !== own.bone || s.part !== own.part
        ? { origin: own.pose.position, rotation: own.pose.rotation }
        : { origin: s.pose.position, rotation: s.pose.rotation };
    };
    return measured(c, pose, Math.min(k, n), Math.max(k, n));
  }
}

/** A rigid segment's origin and rotation at one waypoint. */
interface IPose {
  /** Its origin, world metres. */
  origin: IAutoMovieVector3;

  /** Its world rotation. */
  rotation: IAutoMovieQuaternion;
}

/** One arm segment's stray within the steps of an interval. */
function segment(
  c: M.IContext,
  placed: readonly IAutoMovieMotionHumanArmGeometry.IPlaced[],
  k: number,
  n: number,
  owner: "upper" | "lower" | "hand",
): HumanArmTrajectoryStray.IStray {
  return measured(
    c,
    (g: number): IPose => {
      const p: IAutoMovieMotionHumanArmGeometry.IPlaced = placed[g]!;
      return owner === "upper"
        ? { origin: p.shoulder, rotation: p.upper }
        : owner === "lower"
          ? { origin: p.elbow, rotation: p.lower }
          : { origin: p.wrist, rotation: p.hand };
    },
    k,
    n,
  );
}

/**
 * A rigid course's stray within the steps of an interval: an eighth of the
 * second difference of its origin and of its rotation matrix about each
 * waypoint of the interval that has both neighbours, the greatest.
 */
function measured(
  c: M.IContext,
  pose: (g: number) => IPose,
  k: number,
  n: number,
): HumanArmTrajectoryStray.IStray {
  let origin: number = 0;
  let turn: number = 0;
  for (let g: number = Math.max(1, k); g <= Math.min(c.n - 2, n); ++g) {
    const before: IPose = pose(g - 1);
    const here: IPose = pose(g);
    const after: IPose = pose(g + 1);
    const p: IAutoMovieVector3 = before.origin;
    const q: IAutoMovieVector3 = here.origin;
    const s: IAutoMovieVector3 = after.origin;
    origin = Math.max(
      origin,
      Math.hypot(
        p.x - 2 * q.x + s.x,
        p.y - 2 * q.y + s.y,
        p.z - 2 * q.z + s.z,
      ) / 8,
    );
    const mp: IMatrix = matrix(before.rotation);
    const mq: IMatrix = matrix(here.rotation);
    const ms: IMatrix = matrix(after.rotation);
    let sum: number = 0;
    for (let i: number = 0; i < 9; ++i) {
      const d: number = mp[i]! - 2 * mq[i]! + ms[i]!;
      sum += d * d;
    }
    turn = Math.max(turn, Math.sqrt(sum) / 8);
  }
  return { origin, turn };
}
/** A rotation matrix, row by row. */
type IMatrix = readonly number[];

/** A unit quaternion's rotation matrix, row by row. */
function matrix(q: IAutoMovieQuaternion): IMatrix {
  const { x, y, z, w }: IAutoMovieQuaternion = q;
  return [
    1 - 2 * (y * y + z * z),
    2 * (x * y - z * w),
    2 * (x * z + y * w),
    2 * (x * y + z * w),
    1 - 2 * (x * x + z * z),
    2 * (y * z - x * w),
    2 * (x * z - y * w),
    2 * (y * z + x * w),
    1 - 2 * (x * x + y * y),
  ];
}
