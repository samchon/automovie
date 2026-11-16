import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanArmGeometry as G } from "./HumanArmGeometry";
import { HumanArmJacobian } from "./HumanArmJacobian";
import { HumanArmShapes as S } from "./HumanArmShapes";
import { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";
import { HumanArmTrajectoryPairs as P } from "./HumanArmTrajectoryPairs";
import type { HumanJacobian } from "./HumanJacobian";

/**
 * The Jacobians an arms' trajectory's convex subproblem
 * (`HumanArmTrajectoryConvex`) linearises its constraints on, about an
 * iterate: each coordinate's segment twists (`HumanArmJacobian`), every
 * point moving with its segment as a rigid body, the segment's origin's
 * motion plus its turn about it (Schulman et al. 2014, a pair's distance
 * linearised along its normal on the point Jacobian).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is differentiated, for whom and by which rigid-body rule.
 * @evidence contracts/development/design.md#principled-representation Per arm and waypoint, a column per free coordinate of each probe's, the contact's and the hand rotation's motion, with each segment's twist.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The record, the segment's motion, the assembly, the carried point's motion and the rotation's derivative, read by the convex subproblem alone.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Millimetres and degrees per coordinate unit, the units the subproblem's rows read.
 */
export namespace HumanArmTrajectoryJacobians {
  /** The hair the hand is turned by, coordinate units, in the rotation-vector central difference. */
  export const HAIR: number = 1e-4;

  /** A segment's motion per coordinate unit: its origin's, millimetres, and its turn, radians.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines both quantities at the segment's physical origin in world coordinates.
   * @evidence contracts/development/design.md#principled-representation A rigid segment's instantaneous twist, with linear motion scaled to the convex subproblem's millimetres and angular motion left in radians.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two vectors feed point motion and the existing distance/contact rows through IJacobian.segments and carried.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No alternate joint axis, contact proxy or cached candidate pose is represented.
   */
  export interface IMotion {
    /** The origin's motion, millimetres per coordinate unit. */
    origin: IAutoMovieVector3;

    /** The turn, radians per coordinate unit. */
    omega: IAutoMovieVector3;
  }

  /** Every Jacobian of one arm at one waypoint, a column per free coordinate.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents probe/contact/hand columns, their units, segment twists and the trust-region movement reading; outer waypoints have empty arrays and zero move.
   * @evidence contracts/development/design.md#principled-representation The actual current candidate's derivatives in the context's free-coordinate order; point motions are world millimetres and orientation-residual derivatives are degrees.
   * @evidence contracts/development/design.md#minimal-and-owned-surface HumanArmTrajectoryConvex and the hard point-limit owner consume these rows; segment twists also give arbitrary carried-point derivatives without a second arm Jacobian.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Keeps all probes and the sum-of-column-length movement bound, with absent contact/orientation represented by the original empty lists rather than fabricated rows.
   */
  export interface IJacobian {
    /** Each probe's motion, millimetres per coordinate unit. */
    probes: IAutoMovieVector3[][];

    /** The contact's motion, millimetres per coordinate unit. */
    pad: IAutoMovieVector3[];

    /** The hand's rotation vector off its site, degrees per coordinate unit. */
    hand: IAutoMovieVector3[];

    /** The farthest any probe moves per unit of every coordinate together, millimetres: what a trust region lets a probe travel. */
    move: number;

    /** Each segment's motion. */
    segments: Record<"upper" | "lower" | "hand", IMotion>[];
  }

  /**
   * The Jacobians of every probe, the contact and the hand's rotation of
   * every arm at every inner waypoint; an outer waypoint's are empty.
   *
   * @param c The context.
   * @param x Each arm's coordinates at each waypoint.
   * @param at The iterate's evaluation.
   * @returns Per arm and waypoint, its Jacobians.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Specifies current iterate inputs, free-column ordering and which waypoints return empty derivatives.
   * @evidence contracts/development/implementation.md#principled-implementation The shared arm-column owner gives segment-origin twists; each attached point moves by v_origin plus omega cross its current displacement from that origin, scaled to millimetres. Orientation residuals retain turned's original two-sided logarithm reading.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One candidate's columns feed probe, contact and orientation rows and then the original movement bound; private offsets are initialized at their first original use.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps all columns, probe/site order, exact pad placement, 1000 scaling and cross/add grouping, HAIR and movement-bound reductions; no tolerance, target or chart derivative is changed.
   * @evidence contracts/development/implementation.md#efficient-algorithms For F free coordinates and P probes the required derivative output remains O(FP); each probe-origin displacement and contact placement is computed once per candidate rather than F times, with O(P) temporary offsets.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The synchronous candidate's probe points, origins, hand frame and site contact stay fixed while its columns vary. Lazy offsets reuse those exact completed differences only within this candidate; all angular differences remain separate actual readings.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources At most one private vector per probe and one contact offset survive the column loop, then are released. Only fresh derivative outputs and the original borrowed angular vectors escape; no candidate input or offset history is cached.
   */
  export function of(
    c: M.IContext,
    x: readonly (readonly number[])[][],
    at: M.IEvaluation,
  ): IJacobian[][] {
    return x.map(
      (arm: readonly (readonly number[])[], a: number): IJacobian[] =>
        arm.map((v: readonly number[], k: number): IJacobian => {
          const entry: IJacobian = {
            probes: [],
            pad: [],
            hand: [],
            move: 0,
            segments: [],
          };
          if (!M.inner(c, k)) return entry;
          const site: M.ISite | undefined = c.sites[a]![k];
          const here: G.IPlaced = at.placed[a]![k]!;
          const frame: G.IFrame = c.frames[a]![k]!;
          entry.probes = here.probes.map((): IAutoMovieVector3[] => []);
          const origins: Record<"upper" | "lower" | "hand", IAutoMovieVector3> =
            { upper: here.shoulder, lower: here.elbow, hand: here.wrist };
          const owners: ("upper" | "lower" | "hand")[] = here.probes.map(
            (
              _probe: readonly [IAutoMovieVector3, number],
              i: number,
            ): "upper" | "lower" | "hand" => {
              const segment: M.Segment = S.segment(frame, i);
              return segment === "upperArm"
                ? "upper"
                : segment === "lowerArm"
                  ? "lower"
                  : "hand";
            },
          );
          const offsets: IAutoMovieVector3[] = [];
          let contact: IAutoMovieVector3 | undefined;
          for (const column of HumanArmJacobian.columns(
            c.setups[a]!,
            frame,
            v,
            here,
            c.free[a]!,
          )) {
            const frames: Record<"upper" | "lower" | "hand", IMotion> = {
              upper: motion(column.upper),
              lower: motion(column.lower),
              hand: motion(column.hand),
            };
            entry.segments.push(frames);
            here.probes.forEach(
              ([p]: readonly [IAutoMovieVector3, number], i: number): void => {
                const owner: "upper" | "lower" | "hand" = owners[i]!;
                const offset: IAutoMovieVector3 =
                  offsets[i] ??
                  (offsets[i] = Vector3.subtract(p, origins[owner]));
                entry.probes[i]!.push(
                  Vector3.add(
                    frames[owner].origin,
                    Vector3.scale(
                      Vector3.cross(frames[owner].omega, offset),
                      1000,
                    ),
                  ),
                );
              },
            );
            if (site !== undefined) {
              contact ??= Vector3.subtract(
                P.pad(here, site.contact),
                here.wrist,
              );
              entry.pad.push(
                Vector3.add(
                  frames.hand.origin,
                  Vector3.scale(
                    Vector3.cross(frames.hand.omega, contact),
                    1000,
                  ),
                ),
              );
              if (site.rotation !== undefined)
                entry.hand.push(
                  turned(site.rotation, here.hand, column.hand.angular),
                );
            }
          }
          for (const column of entry.probes)
            entry.move = Math.max(
              entry.move,
              column.reduce(
                (s: number, g: IAutoMovieVector3): number =>
                  s + Vector3.length(g),
                0,
              ),
            );
          return entry;
        }),
    );
  }

  /**
   * The motion of a point riding one of an arm's segments, per coordinate:
   * the segment's origin's motion plus its turn about it.
   *
   * @param at The iterate's evaluation.
   * @param jac The iterate's Jacobians.
   * @param b The arm.
   * @param k The waypoint.
   * @param owner The segment the point rides.
   * @param p The point, world metres.
   * @returns Its motion, millimetres per coordinate unit, a column per free coordinate.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the point's owning arm/waypoint/segment, its world-metre coordinates and each returned column's millimetre units.
   * @evidence contracts/development/implementation.md#principled-implementation Shifts each current segment-origin twist to the attached point by omega cross p minus origin, then applies the original metre-to-millimetre scale and linear sum.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Selects the actual segment origin once and maps the current derivative columns to fresh point-motion vectors.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves source-column order and the original cross, scale and add grouping; an empty list still performs no point subtraction.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(F) output work for F columns with one lazy point-origin subtraction instead of F identical subtractions, and constant temporary storage.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The fixed point and chosen candidate origin share one private difference within this synchronous map; no motion or pose result is reused across candidates.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The private difference dies after the map and never escapes through its fresh returned vectors; no state or resource is retained.
   */
  export function carried(
    at: M.IEvaluation,
    jac: readonly (readonly IJacobian[])[],
    b: number,
    k: number,
    owner: "upper" | "lower" | "hand",
    p: IAutoMovieVector3,
  ): IAutoMovieVector3[] {
    const placed: G.IPlaced = at.placed[b]![k]!;
    const origin: IAutoMovieVector3 =
      owner === "upper"
        ? placed.shoulder
        : owner === "lower"
          ? placed.elbow
          : placed.wrist;
    let offset: IAutoMovieVector3 | undefined;
    return jac[b]![k]!.segments.map(
      (
        column: Record<"upper" | "lower" | "hand", IMotion>,
      ): IAutoMovieVector3 => {
        offset ??= Vector3.subtract(p, origin);
        return Vector3.add(
          column[owner].origin,
          Vector3.scale(Vector3.cross(column[owner].omega, offset), 1000),
        );
      },
    );
  }

  /**
   * The derivative of the hand's rotation vector off its site along the
   * hand's world turn per coordinate unit, degrees: the vector read with the
   * hand turned a hair either way about that turn, so the logarithm's own
   * curvature at a residual off the site is kept.
   *
   * @param site The site's rotation.
   * @param hand The hand's rotation.
   * @param omega The hand's turn per coordinate unit, radians.
   * @returns Degrees per coordinate unit.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the rotation-vector residual being differentiated, its two-sided span and the output units.
   * @evidence contracts/development/implementation.md#principled-implementation Central differences of the existing quaternion-log residual along the supplied world angular velocity preserve that residual's curvature; zero velocity returns the original zero derivative.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Measures the velocity, takes the original positive and negative turned-hand readings, and divides their difference by twice HAIR.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps HAIR, degree conversion, positive-before-negative query order and the rotation-vector owner's sign and zero policies; no linearized-log substitute is used.
   * @evidence contracts/development/implementation.md#efficient-algorithms Two actual quaternion residual readings and constant vector work per nonzero column, with no full-pose perturbation.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The normalized angular axis is shared by the two readings; each different angular velocity still evaluates both original residuals.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only a fresh derivative vector is returned; the local reader, temporary rotations and vectors are released when this call returns or throws.
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

  /** A current segment twist in the convex subproblem's millimetres, borrowing only its angular vector. */
  function motion(twist: HumanJacobian.ITwist): IMotion {
    return { origin: Vector3.scale(twist.linear, 1000), omega: twist.angular };
  }
}
