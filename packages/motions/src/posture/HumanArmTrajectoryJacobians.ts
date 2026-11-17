import type { IAutoMovieMotionHumanArmGeometry, IAutoMovieMotionHumanJacobian, IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

import { Quaternion, Vector3 } from "@automovie/engine";
import { HumanArmJacobian } from "./HumanArmJacobian";
import { HumanArmShapes as S } from "./HumanArmShapes";
import { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";
import { HumanArmTrajectoryPairs as P } from "./HumanArmTrajectoryPairs";

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
  /** The hair the hand is turned by, coordinate units. */
  export const HAIR: number = 1e-4;

  /** A segment's motion per coordinate unit: its origin's, millimetres, and its turn, radians. */
  export interface IMotion {
    /** The origin's motion, millimetres per coordinate unit. */
    origin: IAutoMovieVector3;

    /** The turn, radians per coordinate unit. */
    omega: IAutoMovieVector3;
  }

  /** Every Jacobian of one arm at one waypoint, a column per free coordinate. */
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
          const here: IAutoMovieMotionHumanArmGeometry.IPlaced = at.placed[a]![k]!;
          const frame: IAutoMovieMotionHumanArmGeometry.IFrame = c.frames[a]![k]!;
          entry.probes = here.probes.map((): IAutoMovieVector3[] => []);
          const origins: Record<"upper" | "lower" | "hand", IAutoMovieVector3> =
            { upper: here.shoulder, lower: here.elbow, hand: here.wrist };
          const owners: ("upper" | "lower" | "hand")[] = here.probes.map(
            (_, i: number): "upper" | "lower" | "hand" => {
              const segment: M.Segment = S.segment(frame, i);
              return segment === "upperArm"
                ? "upper"
                : segment === "lowerArm"
                  ? "lower"
                  : "hand";
            },
          );
          for (const column of HumanArmJacobian.columns(
            c.setups[a]!,
            frame,
            v,
            here,
            c.free[a]!,
          )) {
            const motion = (twist: IAutoMovieMotionHumanJacobian.ITwist): IMotion => ({
              origin: Vector3.scale(twist.linear, 1000),
              omega: twist.angular,
            });
            const frames: Record<"upper" | "lower" | "hand", IMotion> = {
              upper: motion(column.upper),
              lower: motion(column.lower),
              hand: motion(column.hand),
            };
            entry.segments.push(frames);
            here.probes.forEach(
              ([p]: readonly [IAutoMovieVector3, number], i: number): void => {
                const owner: "upper" | "lower" | "hand" = owners[i]!;
                entry.probes[i]!.push(
                  Vector3.add(
                    frames[owner].origin,
                    Vector3.scale(
                      Vector3.cross(
                        frames[owner].omega,
                        Vector3.subtract(p, origins[owner]),
                      ),
                      1000,
                    ),
                  ),
                );
              },
            );
            if (site !== undefined) {
              const pad: IAutoMovieVector3 = P.pad(here, site.contact);
              entry.pad.push(
                Vector3.add(
                  frames.hand.origin,
                  Vector3.scale(
                    Vector3.cross(
                      frames.hand.omega,
                      Vector3.subtract(pad, here.wrist),
                    ),
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
                (s: number, g: IAutoMovieVector3) => s + Vector3.length(g),
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
   */
  export function carried(
    at: M.IEvaluation,
    jac: readonly (readonly IJacobian[])[],
    b: number,
    k: number,
    owner: "upper" | "lower" | "hand",
    p: IAutoMovieVector3,
  ): IAutoMovieVector3[] {
    const placed: IAutoMovieMotionHumanArmGeometry.IPlaced = at.placed[b]![k]!;
    const origin: IAutoMovieVector3 =
      owner === "upper"
        ? placed.shoulder
        : owner === "lower"
          ? placed.elbow
          : placed.wrist;
    return jac[b]![k]!.segments.map(
      (
        column: Record<"upper" | "lower" | "hand", IMotion>,
      ): IAutoMovieVector3 =>
        Vector3.add(
          column[owner].origin,
          Vector3.scale(
            Vector3.cross(column[owner].omega, Vector3.subtract(p, origin)),
            1000,
          ),
        ),
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
   */
  export function turned(
    site: IAutoMovieQuaternion,
    hand: IAutoMovieQuaternion,
    omega: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    const size: number = Vector3.length(omega);
    if (size === 0) return { x: 0, y: 0, z: 0 };
    const axis: IAutoMovieVector3 = Vector3.scale(omega, 1 / size);
    const read = (sign: number): IAutoMovieVector3 =>
      P.rotationVector(
        site,
        Quaternion.multiply(
          Quaternion.fromAxisAngle(axis, (sign * HAIR * size * 180) / Math.PI),
          hand,
        ),
      );
    return Vector3.scale(Vector3.subtract(read(1), read(-1)), 1 / (2 * HAIR));
  }
}
