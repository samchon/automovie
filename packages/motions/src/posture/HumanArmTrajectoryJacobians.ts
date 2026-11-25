import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanArmGeometry,
  IAutoMovieMotionHumanJacobian,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanArmJacobian } from "./HumanArmJacobian";
import { HumanArmShapes as S } from "./HumanArmShapes";
import { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";
import { HumanArmTrajectoryPairs as P } from "./HumanArmTrajectoryPairs";

/** The alternatives of `CarriedColumnEntry`'s site. */
type CarriedColumnEntry = "upper" | "lower" | "hand";

/** The alternatives of `CarriedOwner`'s site. */
type CarriedOwner = "upper" | "lower" | "hand";

/** The alternatives of `WaypointFramesEntry`'s site. */
type WaypointFramesEntry = "upper" | "lower" | "hand";

/** The alternatives of `SegmentsEntryItem`'s site. */
type SegmentsEntryItem = "upper" | "lower" | "hand";

/**
 * The Jacobians of every probe, the contact and the hand's rotation of every
 * arm at every inner waypoint; an outer waypoint's are empty.
 *
 * @param c The context.
 * @param x Each arm's coordinates at each waypoint.
 * @param at The iterate's evaluation.
 * @returns Per arm and waypoint, its Jacobians.
 */
export function HumanArmTrajectoryJacobians(
  c: M.IContext,
  x: readonly (readonly number[])[][],
  at: M.IEvaluation,
): HumanArmTrajectoryJacobians.IJacobian[][] {
  return x.map(
    (
      arm: readonly (readonly number[])[],
      a: number,
    ): HumanArmTrajectoryJacobians.IJacobian[] =>
      arm.map(
        (
          _: readonly number[],
          k: number,
        ): HumanArmTrajectoryJacobians.IJacobian =>
          HumanArmTrajectoryJacobians.waypoint(c, x, at, a, k),
      ),
  );
}

/**
 * The Jacobians an arms' trajectory's convex subproblem
 * (`HumanArmTrajectoryConvex`) linearises its constraints on, about an iterate:
 * each coordinate's segment twists (`HumanArmJacobian`), every point moving
 * with its segment as a rigid body, the segment's origin's motion plus its turn
 * about it (Schulman et al. 2014, a pair's distance linearised along its normal
 * on the point Jacobian).
 */
export namespace HumanArmTrajectoryJacobians {
  /**
   * The hair the hand is turned by, coordinate units, in the rotation-vector
   * central difference.
   */
  export const HAIR: number = 1e-4;

  /**
   * A segment's motion per coordinate unit: its origin's, millimetres, and its
   * turn, radians.
   */
  export interface IMotion {
    /** The origin's motion, millimetres per coordinate unit. */
    origin: IAutoMovieVector3;

    /** The turn, radians per coordinate unit. */
    omega: IAutoMovieVector3;
  }

  /** Every Jacobian of one arm at one waypoint, a column per free coordinate. */
  export interface IJacobian {
    /**
     * A probe's motion, millimetres per coordinate unit, a vector per free
     * coordinate, read from the prepared numeric columns. An outer waypoint
     * has no columns.
     *
     * @param probe The probe.
     * @returns Its columns.
     */
    probe(probe: number): IAutoMovieVector3[];

    /** The contact's motion, millimetres per coordinate unit. */
    pad: IAutoMovieVector3[];

    /** The hand's rotation vector off its site, degrees per coordinate unit. */
    hand: IAutoMovieVector3[];

    /**
     * The farthest any probe moves per unit of every coordinate together,
     * millimetres: what a trust region lets a probe travel.
     */
    move: number;

    /** Each segment's motion. */
    segments: Record<SegmentsEntryItem, IMotion>[];
  }

  /**
   * The Jacobians of one arm at one waypoint, the entry `of` makes there: every
   * probe's, the contact's and the hand rotation's columns at an inner
   * waypoint, empty arrays and no move at an outer one.
   *
   * @param c The context.
   * @param x Each arm's coordinates at each waypoint.
   * @param at The iterate's evaluation.
   * @param a The arm.
   * @param k The waypoint.
   * @returns Its Jacobians.
   */
  export function waypoint(
    c: M.IContext,
    x: readonly (readonly number[])[][],
    at: M.IEvaluation,
    a: number,
    k: number,
  ): IJacobian {
    const v: readonly number[] = x[a]![k]!;

    // Each probe's columns as numbers, three a free coordinate, made into
    // vectors only for the probes a row reads (`probe`).
    const inner: boolean = M.inner(c, k);
    const columns: number = c.free[a]!.length;
    const rows: Float64Array | undefined = inner
      ? new Float64Array(at.placed[a]![k]!.probes.length * columns * 3)
      : undefined;
    const entry: IJacobian = {
      probe: (probe: number): IAutoMovieVector3[] => {
        const start: number = 3 * columns * probe;
        const out: IAutoMovieVector3[] = [];
        if (rows !== undefined && start >= 0 && start < rows.length)
          for (let f: number = 0; f < columns; ++f)
            out.push({
              x: rows[start + 3 * f]!,
              y: rows[start + 3 * f + 1]!,
              z: rows[start + 3 * f + 2]!,
            });
        return out;
      },
      pad: [],
      hand: [],
      move: 0,
      segments: [],
    };
    if (rows === undefined) return entry;
    const site: M.ISite | undefined = c.sites[a]![k];
    const here: IAutoMovieMotionHumanArmGeometry.IPlaced = at.placed[a]![k]!;
    const frame: IAutoMovieMotionHumanArmGeometry.IFrame = c.frames[a]![k]!;
    const contact: IAutoMovieVector3 | undefined = site === undefined
      ? undefined
      : Vector3.subtract(P.pad(here, site.contact), here.wrist);
    const target: IAutoMovieQuaternion | undefined = site?.rotation === undefined
      ? undefined
      : P.located(
          c,
          (arm: number): IAutoMovieMotionHumanArmGeometry.IPlaced => at.placed[arm]![k]!,
          a,
          k,
          site,
        ).rotation ?? site.rotation;
    for (const column of HumanArmJacobian.columns(
      c.setups[a]!,
      frame,
      v,
      here,
      c.free[a]!,
    )) {
      const frames: Record<WaypointFramesEntry, IMotion> = {
        upper: motion(column.upper),
        lower: motion(column.lower),
        hand: motion(column.hand),
      };
      entry.segments.push(frames);
      if (contact !== undefined)
        entry.pad.push(pointMotion(frames.hand, contact));
        // The hand's rotation residual is taken about the site's rotation
        // where it stands at this evaluation (`HumanArmTrajectoryPairs.located`:
        // a site riding the other arm turns with it), so its slope is taken
        // about the same reference.
      if (target !== undefined)
        entry.hand.push(turned(target, here.hand, column.hand.angular));
    }
    const scratch: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
    for (let i: number = 0; i < here.probes.length; ++i) {
      const segment: M.Segment = S.segment(frame, i);
      const owner: keyof (typeof entry.segments)[number] =
        segment === "upperArm"
          ? "upper"
          : segment === "lowerArm"
            ? "lower"
            : "hand";
      const origin: IAutoMovieVector3 =
        owner === "upper"
          ? here.shoulder
          : owner === "lower"
            ? here.elbow
            : here.wrist;
      const point: IAutoMovieVector3 = here.probes[i]![0];
      const x: number = point.x - origin.x;
      const y: number = point.y - origin.y;
      const z: number = point.z - origin.z;
      let offset: number = 3 * i * columns;
      let sum: number = 0;
      for (const column of entry.segments) {
        const twist: IMotion = column[owner];
        const o: IAutoMovieVector3 = twist.omega;
        scratch.x = twist.origin.x + (o.y * z - o.z * y) * 1000;
        scratch.y = twist.origin.y + (o.z * x - o.x * z) * 1000;
        scratch.z = twist.origin.z + (o.x * y - o.y * x) * 1000;
        rows[offset++] = scratch.x;
        rows[offset++] = scratch.y;
        rows[offset++] = scratch.z;
        sum += Vector3.length(scratch);
      }
      entry.move = Math.max(entry.move, sum);
    }
    return entry;
  }

  /**
   * The motion of a point riding one of an arm's segments, per coordinate: the
   * segment's origin's motion plus its turn about it.
   *
   * @param at The iterate's evaluation.
   * @param jac The iterate's Jacobians.
   * @param b The arm.
   * @param k The waypoint.
   * @param owner The segment the point rides.
   * @param p The point, world metres.
   * @returns Its motion, millimetres per coordinate unit, a column per free
   *   coordinate.
   */
  export function carried(
    at: M.IEvaluation,
    jac: readonly (readonly IJacobian[])[],
    b: number,
    k: number,
    owner: CarriedOwner,
    p: IAutoMovieVector3,
  ): IAutoMovieVector3[] {
    const placed: IAutoMovieMotionHumanArmGeometry.IPlaced = at.placed[b]![k]!;
    const origin: IAutoMovieVector3 =
      owner === "upper"
        ? placed.shoulder
        : owner === "lower"
          ? placed.elbow
          : placed.wrist;
    const offset: IAutoMovieVector3 = Vector3.subtract(p, origin);
    return jac[b]![k]!.segments.map(
      (column: Record<CarriedColumnEntry, IMotion>): IAutoMovieVector3 => pointMotion(column[owner], offset),
    );
  }

  /**
   * The derivative of the hand's rotation vector off its site along the hand's
   * world turn per coordinate unit, degrees: the vector read with the hand
   * turned a hair either way about that turn, so the logarithm's own curvature
   * at a residual off the site is kept.
   *
   * @param site The site's rotation.
   * @param hand The hand's rotation.
   * @param omega The hand's turn per coordinate unit, radians.
   * @returns Degrees per coordinate unit.
   */
  export function turned(
    site: IAutoMovieQuaternion,
    hand: IAutoMovieQuaternion,
    omega: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    const size: number = Vector3.length(omega);
    if (size === 0) return { x: 0, y: 0, z: 0 };
    const axis: IAutoMovieVector3 = Vector3.scale(omega, 1 / size);
    const read: (sign: number) => IAutoMovieVector3 = (
      sign: number,
    ): IAutoMovieVector3 =>
      P.rotationVector(
        site,
        Quaternion.multiply(
          Quaternion.fromAxisAngle(axis, (sign * HAIR * size * 180) / Math.PI),
          hand,
        ),
      );
    return Vector3.scale(Vector3.subtract(read(1), read(-1)), 1 / (2 * HAIR));
  }

  /**
   * Complete a fresh cross-product vector as a point's motion in millimetres.
   * Each component keeps the original origin + cross-component * 1000 grouping;
   * only this unobserved fresh vector is written before return.
   */
  function pointMotion(
    motion: IMotion,
    offset: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    const out: IAutoMovieVector3 = Vector3.cross(motion.omega, offset);
    out.x = motion.origin.x + out.x * 1000;
    out.y = motion.origin.y + out.y * 1000;
    out.z = motion.origin.z + out.z * 1000;
    return out;
  }

  /**
   * A current segment twist in the convex subproblem's millimetres, borrowing
   * only its angular vector.
   */
  function motion(twist: IAutoMovieMotionHumanJacobian.ITwist): IMotion {
    return { origin: Vector3.scale(twist.linear, 1000), omega: twist.angular };
  }
}
