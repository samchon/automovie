import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBodyFitTypes,
  IAutoMovieMotionHumanJacobian,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanBodyFitRows } from "./HumanBodyFitRows";
import { HumanFitTargetSlopes } from "./HumanFitTargetSlopes";
import { HumanJacobian } from "./HumanJacobian";

/** Effector constraints in world axes, a fixed frame or a moving bone frame. */
export namespace HumanFitTargets {
  /**
   * What the target rows read of a body reading: each target's effector point
   * and turn, and the posed bones a moving goal frame rides.
   */
  export type IReading = Pick<
    HumanBodyFitRows.IReading,
    "points" | "turns" | "bones"
  >;

  /** A target row and its reading on the target's own body coordinates. */
  export type IRead = Pick<HumanBodyFitRows.IRead, "row"> & {
    /** The actual scalar read in metres or radians. */
    f: (r: IReading) => number;
  };

  /**
   * What the target rows read of a step: its reading, the variables' motions
   * and units, the variable domain, the goals and the floor's price.
   */
  export type IStep = Pick<
    HumanBodyFitRows.IStep,
    "motions" | "units" | "index" | "targets" | "price"
  > & {
    /** The reading the step starts from. */
    at: IReading;
  };

  /**
   * Append point, point-bound, rotation and normal rows.
   *
   * @param step The current whole-body linearisation.
   * @param equal The row owner's interval builder, in metres or radians.
   * @param mm Its units multiplier.
   * @returns The target rows.
   */
  export function rows(
    step: IStep,
    equal: (
      key: string,
      f: (r: HumanFitTargets.IReading) => number,
      goal: number,
      coef: number[],
      weight: number | undefined,
      upper?: number,
    ) => void,
    mm: number,
  ): IRead[] {
    const rows: IRead[] = [];
    const current: IReading = step.at;
    step.targets.forEach(
      (target: IAutoMovieMotionHumanBodyFitTypes.ITarget, k: number): void => {
        const at: IFrame = frame(target, current, k);
        const motions: IAutoMovieMotionHumanJacobian.ITwist[] =
          step.motions.map(
            (
              motion: IAutoMovieMotionHumanJacobian.IMotion,
            ): IAutoMovieMotionHumanJacobian.ITwist =>
              relative(target, current, k, motion, at),
          );
        const axes: readonly RowsAxesItem[] = target.axes ?? ["x", "y", "z"];
        const scaled: (
          f: (
            motion: IAutoMovieMotionHumanJacobian.ITwist,
            i: number,
          ) => number,
        ) => number[] = (
          f: (
            motion: IAutoMovieMotionHumanJacobian.ITwist,
            i: number,
          ) => number,
        ): number[] =>
          motions.map(
            (motion: IAutoMovieMotionHumanJacobian.ITwist, i: number): number =>
              f(motion, i) * step.units[i]! * mm,
          );
        const price: number | undefined =
          target.required === true ? undefined : (target.price ?? step.price);
        if (target.bound === undefined) {
          for (const axis of axes)
            equal(
              `${axis}:${k}`,
              (r: HumanFitTargets.IReading): number =>
                (r === current ? at : frame(target, r, k)).point[axis],
              target.goal[axis],
              scaled(
                (motion: IAutoMovieMotionHumanJacobian.ITwist): number =>
                  motion.linear[axis],
              ),
              price,
            );
        } else if (axes.length === 1) {
          const axis: RowsAxesItem = axes[0]!;
          const delta: number = error(target, at.point)[axis];
          rows.push({
            row: {
              key: `point-interval:${k}`,
              index: step.index,
              coef: scaled(
                (motion: IAutoMovieMotionHumanJacobian.ITwist): number =>
                  motion.linear[axis],
              ),
              l: (-target.bound - delta) * mm,
              u: (target.bound - delta) * mm,
              weight: price,
            },
            f: (r: HumanFitTargets.IReading): number =>
              r === current
                ? delta
                : frame(target, r, k).point[axis] - target.goal[axis],
          });
        } else {
          const delta: IAutoMovieVector3 = error(target, at.point);
          const distance: number = Vector3.length(delta);
          const f: (r: HumanFitTargets.IReading) => number = (
            r: HumanFitTargets.IReading,
          ): number =>
            r === current
              ? distance
              : Vector3.length(error(target, frame(target, r, k).point));
          rows.push({
            row: {
              key: `point-ball:${k}`,
              index: step.index,
              coef: scaled(
                (motion: IAutoMovieMotionHumanJacobian.ITwist): number =>
                  distance === 0
                    ? 0
                    : Vector3.dot(delta, motion.linear) / distance,
              ),
              l: -Infinity,
              u: (target.bound - distance) * mm,
              weight: price,
            },
            f,
          });
        }
        if (target.rotation !== undefined) {
          const e: IAutoMovieVector3 = turn(target.rotation, at.turn);
          const columns: IAutoMovieVector3[] = HumanFitTargetSlopes.rotation(
            e,
            motions,
          );
          for (const axis of ["x", "y", "z"] as const)
            equal(
              `r${axis}:${k}`,
              (r: HumanFitTargets.IReading): number =>
                r === current
                  ? -e[axis]
                  : -turn(target.rotation!, frame(target, r, k).turn)[axis],
              0,
              scaled(
                (
                  _motion: IAutoMovieMotionHumanJacobian.ITwist,
                  i: number,
                ): number => columns[i]![axis],
              ),
              price,
            );
        }
        if (target.normal !== undefined) {
          const axes: [IAutoMovieVector3, IAutoMovieVector3] = across(
            target.normal.world,
          );
          const columns: IAutoMovieVector3[] = HumanFitTargetSlopes.normal(
            target.normal,
            at.turn,
            motions,
          );
          let normalAt: IAutoMovieVector3 | undefined;
          axes.forEach((axis: IAutoMovieVector3, j: number): void =>
            equal(
              `n${j}:${k}`,
              (r: HumanFitTargets.IReading): number =>
                Vector3.dot(
                  r === current
                    ? (normalAt ??= tilt(target, at.turn))
                    : tilt(target, frame(target, r, k).turn),
                  axis,
                ),
              0,
              scaled(
                (
                  _motion: IAutoMovieMotionHumanJacobian.ITwist,
                  i: number,
                ): number => Vector3.dot(columns[i]!, axis),
              ),
              price,
            ),
          );
        }
      },
    );
    return rows;
  }

  /**
   * Signed exact-point errors or excess outside the point bound, then turns.
   *
   * @param target The goal and physical radius, if any.
   * @param r The current body reading.
   * @param k Its target index.
   * @returns Metres and radians in row order.
   */
  export function misses(
    target: IAutoMovieMotionHumanBodyFitTypes.ITarget,
    r: HumanFitTargets.IReading,
    k: number,
  ): number[] {
    const at: IFrame = frame(target, r, k);
    const delta: IAutoMovieVector3 = error(target, at.point);
    const out: number[] =
      target.bound === undefined
        ? (target.axes ?? (["x", "y", "z"] as const)).map(
            (axis: MissesOutAxis): number => delta[axis],
          )
        : [Math.max(0, Vector3.length(delta) - target.bound)];
    if (target.rotation !== undefined) {
      const e: IAutoMovieVector3 = turn(target.rotation, at.turn);
      out.push(e.x, e.y, e.z);
    }
    if (target.normal !== undefined) {
      const e: IAutoMovieVector3 = tilt(target, at.turn);
      for (const axis of across(target.normal.world))
        out.push(Vector3.dot(e, axis));
    }
    return out;
  }

  /**
   * Actual distance to the target centre and orientation error.
   *
   * @param target The goal.
   * @param r The current body reading.
   * @param k Its index.
   * @returns Point distance in millimetres, without subtracting its physical
   *   radius, and turn in degrees.
   */
  export function residual(
    target: IAutoMovieMotionHumanBodyFitTypes.ITarget,
    r: HumanFitTargets.IReading,
    k: number,
  ): IResidualResult {
    const at: IFrame = frame(target, r, k);
    return {
      point: Vector3.length(error(target, at.point)) * 1000,
      turn:
        (Vector3.length(
          target.rotation !== undefined
            ? turn(target.rotation, at.turn)
            : target.normal !== undefined
              ? tilt(target, at.turn)
              : ZERO,
        ) *
          180) /
        Math.PI,
    };
  }

  /** Rotation vector taking current to goal, in the shared frame's radians. */
  export function turn(
    goal: IAutoMovieQuaternion,
    current: IAutoMovieQuaternion,
  ): IAutoMovieVector3 {
    const q: IAutoMovieQuaternion = Quaternion.multiply(
      goal,
      Quaternion.inverse(current),
    );
    const sign: number = q.w < 0 ? -1 : 1;
    const v: IAutoMovieVector3 = {
      x: q.x * sign,
      y: q.y * sign,
      z: q.z * sign,
    };
    const sine: number = Vector3.length(v);
    return sine < 1e-12
      ? { ...ZERO }
      : Vector3.scale(v, (2 * Math.atan2(sine, Math.abs(q.w))) / sine);
  }

  /** Least turn from the desired normal to the effector normal, radians. */
  export function tilt(
    target: IAutoMovieMotionHumanBodyFitTypes.ITarget,
    rotation: IAutoMovieQuaternion,
  ): IAutoMovieVector3 {
    const w: IAutoMovieVector3 = Vector3.normalize(target.normal!.world);
    const n: IAutoMovieVector3 = Vector3.normalize(
      Quaternion.rotateVector(rotation, target.normal!.local),
    );
    const axis: IAutoMovieVector3 = Vector3.cross(w, n);
    const sine: number = Vector3.length(axis);
    const angle: number = Math.atan2(sine, Vector3.dot(w, n));
    return sine < 1e-12
      ? Vector3.scale(across(w)[0], angle)
      : Vector3.scale(axis, angle / sine);
  }

  /** Two orthonormal transverse directions of a finite nonzero normal. */
  export function across(
    normal: IAutoMovieVector3,
  ): [IAutoMovieVector3, IAutoMovieVector3] {
    const n: IAutoMovieVector3 = Vector3.normalize(normal);
    const a: number = Math.abs(n.x);
    const b: number = Math.abs(n.y);
    const c: number = Math.abs(n.z);
    const basis: IAutoMovieVector3 =
      a <= b && a <= c
        ? { x: 1, y: 0, z: 0 }
        : b <= c
          ? { x: 0, y: 1, z: 0 }
          : { x: 0, y: 0, z: 1 };
    const u: IAutoMovieVector3 = Vector3.normalize(Vector3.cross(n, basis));
    return [u, Vector3.cross(n, u)];
  }
}

/** The record of `IResidualResult`'s site. */
type IResidualResult = { point: number; turn: number };

/** The alternatives of `MissesOutAxis`'s site. */
type MissesOutAxis = "x" | "y" | "z";

/** The alternatives of `RowsAxesItem`'s site. */
type RowsAxesItem = "x" | "y" | "z";
/** The record of `IFrameAnchor`'s site. */
type IFrameAnchor = {
  /** The bone whose velocity carries the frame, when it moves. */
  bone: AutoMovieHumanoidBone | undefined;

  /** Rotation from the world into the goal frame. */
  inverse: IAutoMovieQuaternion;
};

/** An effector expressed in its goal's reference frame. */
interface IFrame {
  point: IAutoMovieVector3;
  turn: IAutoMovieQuaternion;

  /**
   * Present for a fixed or moving goal frame. Its inverse also transforms this
   * model's relative twists.
   */
  anchor?: IFrameAnchor;
}

/** The additive identity for world or goal-frame velocities. */
const ZERO: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };

/**
 * Read each new goal frame on its actual anchor, sharing that same inverse with
 * the current model's relative twists.
 */
function frame(
  target: IAutoMovieMotionHumanBodyFitTypes.ITarget,
  r: HumanFitTargets.IReading,
  k: number,
): IFrame {
  if (target.on === undefined)
    return target.frame === undefined
      ? { point: r.points[k]!, turn: r.turns[k]! }
      : expressed(r, k, target.frame.position, target.frame.rotation);
  const anchor: IAutoMovieResolvedBone | undefined = r.bones.get(target.on);
  if (anchor === undefined)
    throw new Error(`Target anchor ${target.on} is absent`);
  return expressed(
    r,
    k,
    anchor.worldPosition,
    anchor.worldRotation,
    target.on,
  );
}

/** Express the effector and its turn in the supplied goal frame. */
function expressed(
  r: HumanFitTargets.IReading,
  k: number,
  position: IAutoMovieVector3,
  rotation: IAutoMovieQuaternion,
  bone?: AutoMovieHumanoidBone,
): IFrame {
  const inverse: IAutoMovieQuaternion = Quaternion.inverse(rotation);
  return {
    point: Quaternion.rotateVector(
      inverse,
      Vector3.subtract(r.points[k]!, position),
    ),
    turn: Quaternion.multiply(inverse, r.turns[k]!),
    anchor: { bone, inverse },
  };
}

/** Relative twists include the anchor's velocity at the effector point. */
function relative(
  target: IAutoMovieMotionHumanBodyFitTypes.ITarget,
  r: HumanFitTargets.IReading,
  k: number,
  motion: IAutoMovieMotionHumanJacobian.IMotion,
  at: IFrame,
): IAutoMovieMotionHumanJacobian.ITwist {
  const own: IAutoMovieMotionHumanJacobian.ITwist = HumanJacobian.twist(
    motion,
    target.bone,
    r.points[k]!,
  );
  if (at.anchor === undefined) return own;
  const bone: AutoMovieHumanoidBone | undefined = at.anchor.bone;
  const on: IAutoMovieMotionHumanJacobian.ITwist | undefined =
    bone === undefined
      ? undefined
      : target.bone === bone
        ? own
        : HumanJacobian.twist(motion, bone, r.points[k]!);
  const inverse: IAutoMovieQuaternion = at.anchor.inverse;
  return {
    linear: Quaternion.rotateVector(
      inverse,
      on === undefined ? own.linear : Vector3.subtract(own.linear, on.linear),
    ),
    angular: Quaternion.rotateVector(
      inverse,
      on === undefined ? own.angular : Vector3.subtract(own.angular, on.angular),
    ),
  };
}
/** The alternatives of `ErrorAxesItem`'s site. */
type ErrorAxesItem = "x" | "y" | "z";

/** Point error projected on the declared axes; a bound is a metric radius. */
function error(
  target: IAutoMovieMotionHumanBodyFitTypes.ITarget,
  point: IAutoMovieVector3,
): IAutoMovieVector3 {
  if (target.bound !== undefined && !(target.bound >= 0))
    throw new Error("A point bound must be finite nonnegative metres");
  const axes: readonly ErrorAxesItem[] = target.axes ?? ["x", "y", "z"];
  return {
    x: axes.includes("x") ? point.x - target.goal.x : 0,
    y: axes.includes("y") ? point.y - target.goal.y : 0,
    z: axes.includes("z") ? point.z - target.goal.z : 0,
  };
}
