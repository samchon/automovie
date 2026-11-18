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

/**
 * Effector constraints in a fixed world frame or a moving bone frame.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the frames, point balls, rotation and normal rows shared by model and merit.
 * @evidence contracts/development/design.md#principled-representation A rigid effector's coordinates and twists in its goal frame, in metres and radians.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The whole-body row builder, merit and result share one target owner; its legacy rotation helpers remain available through HumanBodyFitRows.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Uses the actual resolved anchor and the existing geometric Jacobian, without freezing a relative goal to one iterate.
 */
export namespace HumanFitTargets {
  /**
   * Append point, spherical point-bound, rotation and normal rows.
   *
   * @param step The current whole-body linearisation.
   * @param equal The row owner's interval builder, in metres or radians.
   * @param mm Its units multiplier.
   * @returns The target rows.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States inputs, units and row families.
   * @evidence contracts/development/implementation.md#principled-implementation Relative point velocity is R_on^-1(v_eff-v_on_at_eff), and angular velocity is R_on^-1(omega_eff-omega_on). Rotation log rows differentiate with the inverse right SO(3) Jacobian (Sola et al. 2018, arXiv:1812.01537, eq.117); a point ball is one Euclidean-distance inequality.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One target frame and its variable twists, then each requested row family.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps metric point radii, moving reference frames and antiparallel-normal refusal; identical effector/anchor point twists are read once but their original subtraction and rotation remain, including nonfinite-result propagation.
   * @evidence contracts/development/implementation.md#efficient-algorithms Takes O(t*n) time and coefficient storage for t targets and n variables with fixed axis counts; each current anchor inverse and angular derivative column is produced once rather than once per variable or selected axis.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares one current target frame and its anchor inverse across relative motions; full rotation/normal derivative columns serve all selected axes, and callbacks reuse that same unchanged model reading while new trial readings are recomputed.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Model callbacks retain their target and current reading/frame until the model is released; temporary derivative columns are consumed into owned scalar coefficients, and no prior-reading or global body cache is kept.
   */
  export function rows(
    step: HumanBodyFitRows.IStep,
    equal: (
      key: string,
      f: (r: HumanBodyFitRows.IReading) => number,
      goal: number,
      coef: number[],
      weight: number,
      upper?: number,
    ) => void,
    mm: number,
  ): HumanBodyFitRows.IRead[] {
    const rows: HumanBodyFitRows.IRead[] = [];
    const current: HumanBodyFitRows.IReading = step.at;
    step.targets.forEach((target: IAutoMovieMotionHumanBodyFitTypes.ITarget, k: number): void => {
      const at: IFrame = frame(target, current, k);
      const motions: IAutoMovieMotionHumanJacobian.ITwist[] = step.motions.map(
        (motion: IAutoMovieMotionHumanJacobian.IMotion): IAutoMovieMotionHumanJacobian.ITwist =>
          relative(target, current, k, motion, at),
      );
      const axes: readonly ("x" | "y" | "z")[] = target.axes ?? ["x", "y", "z"];
      const scaled: (
        f: (motion: IAutoMovieMotionHumanJacobian.ITwist, i: number) => number,
      ) => number[] = (
        f: (motion: IAutoMovieMotionHumanJacobian.ITwist, i: number) => number,
      ): number[] =>
        motions.map(
          (motion: IAutoMovieMotionHumanJacobian.ITwist, i: number): number =>
            f(motion, i) * step.units[i]! * mm,
        );
      const price: number = target.price ?? step.price;
      if (target.bound === undefined) {
        for (const axis of axes)
          equal(
            `${axis}:${k}`,
            (r: HumanBodyFitRows.IReading): number =>
              (r === current ? at : frame(target, r, k)).point[axis],
            target.goal[axis],
            scaled(
              (motion: IAutoMovieMotionHumanJacobian.ITwist): number => motion.linear[axis],
            ),
            price,
          );
      } else {
        const delta: IAutoMovieVector3 = error(target, at.point);
        const distance: number = Vector3.length(delta);
        const f: (r: HumanBodyFitRows.IReading) => number = (
          r: HumanBodyFitRows.IReading,
        ): number =>
          r === current
            ? distance
            : Vector3.length(error(target, frame(target, r, k).point));
        rows.push({
          row: {
            key: `point-ball:${k}`,
            index: step.index,
            coef: scaled((motion: IAutoMovieMotionHumanJacobian.ITwist): number =>
              distance === 0 ? 0 : Vector3.dot(delta, motion.linear) / distance,
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
            (r: HumanBodyFitRows.IReading): number =>
              r === current
                ? -e[axis]
                : -turn(target.rotation!, frame(target, r, k).turn)[axis],
            0,
            scaled(
              (_motion: IAutoMovieMotionHumanJacobian.ITwist, i: number): number =>
                columns[i]![axis],
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
            (r: HumanBodyFitRows.IReading): number =>
              Vector3.dot(
                r === current
                  ? (normalAt ??= tilt(target, at.turn))
                  : tilt(target, frame(target, r, k).turn),
                axis,
              ),
            0,
            scaled((_motion: IAutoMovieMotionHumanJacobian.ITwist, i: number): number =>
              Vector3.dot(columns[i]!, axis),
            ),
            price,
          ),
        );
      }
    });
    return rows;
  }

  /**
   * Signed exact-point errors or excess outside a point ball, then turns.
   *
   * @param target The goal and physical radius, if any.
   * @param r The current body reading.
   * @param k Its target index.
   * @returns Metres and radians in row order.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Gives units, frame and ordering.
   * @evidence contracts/development/implementation.md#principled-implementation Measures the same goal-frame quantities and ball inequality the rows linearise.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Point errors followed by optional rotation and normal errors.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The physical radius is subtracted from Euclidean distance only; numerical acceptance remains the merit's.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per target.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares frame and rotation owners with the rows.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function misses(
    target: IAutoMovieMotionHumanBodyFitTypes.ITarget,
    r: HumanBodyFitRows.IReading,
    k: number,
  ): number[] {
    const at: IFrame = frame(target, r, k);
    const delta: IAutoMovieVector3 = error(target, at.point);
    const out: number[] =
      target.bound === undefined
        ? (target.axes ?? (["x", "y", "z"] as const)).map(
            (axis: "x" | "y" | "z"): number => delta[axis],
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
   * @returns Point distance in millimetres, without subtracting its physical radius, and turn in degrees.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Distinguishes actual distance from permitted radius.
   * @evidence contracts/development/implementation.md#principled-implementation Euclidean goal-frame distance and quaternion or normal geodesic error.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One frame and two norms.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A caller can compare the actual distance with its declared bound.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares the row and merit frame.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function residual(
    target: IAutoMovieMotionHumanBodyFitTypes.ITarget,
    r: HumanBodyFitRows.IReading,
    k: number,
  ): { point: number; turn: number } {
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

  /**
   * Rotation vector taking current to goal, in the shared frame's radians.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names direction, frame and unit.
   * @evidence contracts/development/implementation.md#principled-implementation Principal quaternion logarithm from atan2 of sine and cosine of the half-angle.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One relative quaternion and scale.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Quaternion signs select the same principal turn.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Rows and merit share this function.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
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

  /**
   * Least turn from the desired normal to the effector normal, radians.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Both normals use the goal frame; antiparallel normals select the first transverse axis for reporting.
   * @evidence contracts/development/implementation.md#principled-implementation atan2 of the two unit normals' cross length and dot product.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Resolve the effector normal, then its principal turn.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An opposite normal reports a half turn, never zero.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shared by row readings and final errors.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
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

  /**
   * Two orthonormal transverse directions of a finite nonzero normal.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the normal premise and orthonormal result.
   * @evidence contracts/development/implementation.md#principled-implementation Crosses the normal with its least-aligned Cartesian basis, then completes the frame.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One basis selection and two crosses.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The least-aligned basis prevents a zero cross.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Rows and merit project onto the same axes.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
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

/** An effector expressed in its goal's reference frame. */
interface IFrame {
  point: IAutoMovieVector3;
  turn: IAutoMovieQuaternion;

  /** Present only for a moving goal frame; its inverse also transforms this model's relative twists. */
  anchor?: { bone: AutoMovieHumanoidBone; inverse: IAutoMovieQuaternion };
}

/** The additive identity for world or goal-frame velocities. */
const ZERO: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };

/** Read each new goal frame on its actual anchor, sharing that same inverse with the current model's relative twists. */
function frame(
  target: IAutoMovieMotionHumanBodyFitTypes.ITarget,
  r: HumanBodyFitRows.IReading,
  k: number,
): IFrame {
  if (target.on === undefined)
    return { point: r.points[k]!, turn: r.turns[k]! };
  const anchor: IAutoMovieResolvedBone | undefined = r.bones.get(target.on);
  if (anchor === undefined)
    throw new Error(`Target anchor ${target.on} is absent`);
  const inverse: IAutoMovieQuaternion = Quaternion.inverse(
    anchor.worldRotation,
  );
  return {
    point: Quaternion.rotateVector(
      inverse,
      Vector3.subtract(r.points[k]!, anchor.worldPosition),
    ),
    turn: Quaternion.multiply(inverse, r.turns[k]!),
    anchor: { bone: target.on, inverse },
  };
}

/** Relative twists include the anchor's velocity at the effector point. */
function relative(
  target: IAutoMovieMotionHumanBodyFitTypes.ITarget,
  r: HumanBodyFitRows.IReading,
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
  const on: IAutoMovieMotionHumanJacobian.ITwist =
    target.bone === at.anchor.bone
      ? own
      : HumanJacobian.twist(motion, at.anchor.bone, r.points[k]!);
  const inverse: IAutoMovieQuaternion = at.anchor.inverse;
  return {
    linear: Quaternion.rotateVector(
      inverse,
      Vector3.subtract(own.linear, on.linear),
    ),
    angular: Quaternion.rotateVector(
      inverse,
      Vector3.subtract(own.angular, on.angular),
    ),
  };
}

/** Point error projected on the declared axes; a bound is a metric radius. */
function error(
  target: IAutoMovieMotionHumanBodyFitTypes.ITarget,
  point: IAutoMovieVector3,
): IAutoMovieVector3 {
  if (
    target.bound !== undefined &&
    (!(target.bound >= 0) || !Number.isFinite(target.bound))
  )
    throw new Error("A point bound must be finite nonnegative metres");
  const axes: readonly ("x" | "y" | "z")[] = target.axes ?? ["x", "y", "z"];
  return {
    x: axes.includes("x") ? point.x - target.goal.x : 0,
    y: axes.includes("y") ? point.y - target.goal.y : 0,
    z: axes.includes("z") ? point.z - target.goal.z : 0,
  };
}
