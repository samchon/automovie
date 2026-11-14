import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { HumanArmClearance } from "./HumanArmClearance";
import { HumanArmFrame } from "./HumanArmFrame";
import { HumanArmGeometry as G } from "./HumanArmGeometry";
import { HumanJacobian } from "./HumanJacobian";
import type { IHumanPosture } from "./IHumanPosture";

/**
 * The analytic Jacobian of the arm planner's coordinates: for each free
 * coordinate, the twist of the upper arm, the forearm and the hand, so a
 * point riding a segment moves at `v_origin + ω × (p − origin)`.
 *
 * The elbow's and the wrist's coordinates are their joints' clinical angles,
 * whose motions are the rig's own joint axes (`HumanJacobian.of`) read on
 * the planner's placed chain; an angle past the skeleton's range, which
 * forward kinematics clamps (`HumanArmGeometry.rotation`), moves nothing,
 * so its column is zero. The shoulder's three are the swing-twist
 * chart's (`HumanArmGeometry.shoulder`), whose turn per coordinate is the
 * chart's own derivative: the world rotation of the upper arm read at the
 * coordinate a hair either side, the shoulder's point fixed, the forearm
 * and the hand carried with it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what a column holds, the two kinds of coordinate and where each motion comes from.
 * @evidence contracts/development/implementation.md#principled-implementation The geometric Jacobian of a serial chain (Siciliano et al. 2009, section 3.1.3) from the shared joint-axis owner, composed with the chart's derivative for the coordinates the chart maps; TrajOpt linearises each pair's distance on these columns (Schulman et al. 2014).
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One read of the joint axes for the elbow and the wrist, one central difference of the chart per shoulder coordinate.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The joint axes are `HumanJacobian`'s, not derived again; the chart's step is a thousandth of a coordinate unit, where a central difference of the smooth chart is exact to the square of it.
 * @evidence contracts/development/implementation.md#efficient-algorithms Per waypoint one joint-axis read and two chart rotations per shoulder coordinate, no placement of the arm or its probes.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Read once per waypoint and iterate by the convex model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
 */
export namespace HumanArmJacobian {
  /** One coordinate's motion of the arm's three segments, per coordinate unit: radians and metres at each segment's origin (the shoulder, the elbow, the wrist). */
  export interface IColumn {
    /** The upper arm's twist. */
    upper: HumanJacobian.ITwist;
    /** The forearm's twist. */
    lower: HumanJacobian.ITwist;
    /** The hand's twist. */
    hand: HumanJacobian.ITwist;
  }

  /**
   * Each free coordinate's column at an arm placed in a frame.
   *
   * @param setup The arm.
   * @param at The frame.
   * @param c The coordinates.
   * @param placed The arm placed at them (`HumanArmGeometry.placed`).
   * @param free The free coordinates, in order.
   * @returns One column per free coordinate.
   */
  export function columns(
    setup: G.ISetup,
    at: G.IFrame,
    c: readonly number[],
    placed: G.IPlaced,
    free: readonly number[],
  ): IColumn[] {
    const { upper, lower, hand } = setup.bones;
    const resolved = (
      bone: AutoMovieHumanoidBone,
      worldPosition: IAutoMovieVector3,
      worldRotation: IAutoMovieQuaternion,
      parent: IAutoMovieQuaternion,
    ): [AutoMovieHumanoidBone, IAutoMovieResolvedBone] => [
      bone,
      {
        bone,
        localRotation: Quaternion.multiply(Quaternion.inverse(parent), worldRotation),
        worldPosition,
        worldRotation,
      },
    ];
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = new Map([
      resolved(upper, placed.shoulder, placed.upper, at.parent.rotation),
      resolved(lower, placed.elbow, placed.lower, placed.upper),
      resolved(hand, placed.wrist, placed.hand, placed.lower),
    ]);
    const posture: IHumanPosture = {
      root: { x: 0, y: 0, z: 0 },
      yaw: 0,
      pitch: 0,
      roll: 0,
      joints: {
        [lower]: [c[3]!, c[4]!, c[5]!],
        [hand]: [c[6]!, c[7]!, c[8]!],
      },
      limbs: {},
    };
    const joints: (HumanJacobian.IMotion | undefined)[] = HumanJacobian.of(
      setup.body,
      posture,
      bones,
      [3, 4, 5, 6, 7, 8].map(
        (d: number): HumanJacobian.IVariable => ({
          kind: "angle",
          bone: d < 6 ? lower : hand,
          axis: AXES[d % 3]!,
        }),
      ),
    );
    const kept: [number, number, number][] = [G.clamped(setup, lower, [c[3]!, c[4]!, c[5]!]), G.clamped(setup, hand, [c[6]!, c[7]!, c[8]!])];
    return free.map((d: number): IColumn => {
      if (d >= 3) {
        // Past its limit an angle is clamped by forward kinematics, so it
        // moves nothing.
        if (kept[d < 6 ? 0 : 1]![d % 3] !== c[d]) return { upper: STILL, lower: STILL, hand: STILL };
        const motion: HumanJacobian.IMotion = joints[d - 3]!;
        return {
          upper: HumanJacobian.twist(motion, upper, placed.shoulder),
          lower: HumanJacobian.twist(motion, lower, placed.elbow),
          hand: HumanJacobian.twist(motion, hand, placed.wrist),
        };
      }
      // The chart's own derivative: the upper arm's world turn per unit.
      const world = (sign: number): IAutoMovieQuaternion => {
        const moved: number[] = [...c];
        moved[d] = moved[d]! + sign * STEP;
        return Quaternion.multiply(at.parent.rotation, Quaternion.multiply(setup.rest.upper.rotation, G.shoulder(setup, moved)));
      };
      const omega: IAutoMovieVector3 = turn(world(-1), world(1), 2 * STEP);
      const about = (p: IAutoMovieVector3): IAutoMovieVector3 => Vector3.cross(omega, Vector3.subtract(p, placed.shoulder));
      return {
        upper: { angular: omega, linear: { x: 0, y: 0, z: 0 } },
        lower: { angular: omega, linear: about(placed.elbow) },
        hand: { angular: omega, linear: about(placed.wrist) },
      };
    });
  }

  /** An arm's chain placed at coordinates: each joint's point and each segment's world rotation. */
  export type IChain = Pick<G.IPlaced, "shoulder" | "elbow" | "wrist" | "upper" | "lower" | "hand">;

  /**
   * One arm of a body on a pose, read at an arm moved by an offset in the
   * planner's coordinates: every coordinate's column, and the chain at any
   * coordinates, the forward kinematics the columns differentiate.
   *
   * @param body The body.
   * @param side The arm.
   * @param pose The pose the arm is read on.
   * @param arm The arm's clinical triples, encoded clamped (`HumanArmGeometry.encode`).
   * @param offset Added to each of the nine coordinates, so a coordinate may lie past its range; none when absent.
   * @returns The coordinates read at, the free ones (a hinge's fixed angle is not), their columns in that order and the chain.
   */
  export function read(
    body: IHumanBody,
    side: "left" | "right",
    pose: IAutoMoviePose,
    arm: HumanArmClearance.IArm,
    offset: readonly number[] = [],
  ): { c: number[]; free: number[]; columns: IColumn[]; chain: (c: readonly number[]) => IChain } {
    const setup: G.ISetup = G.prepare(body, side);
    const at: G.IFrame = HumanArmFrame.of(setup, { pose, others: [] }, true);
    const c: number[] = G.encode(setup, arm).map((v: number, d: number): number => v + (offset[d] ?? 0));
    const free: number[] = [];
    for (let d: number = 0; d < G.DIMENSIONS; ++d) if (setup.free[d]!) free.push(d);
    return {
      c,
      free,
      columns: columns(setup, at, c, G.placed(setup, at, c, false), free),
      chain: (q: readonly number[]): IChain => G.placed(setup, at, q, false),
    };
  }

  /** A segment that does not move. */
  const STILL: HumanJacobian.ITwist = { angular: { x: 0, y: 0, z: 0 }, linear: { x: 0, y: 0, z: 0 } };

  /** A joint's angles by index: flexion, abduction, twist. */
  const AXES: readonly (0 | 1 | 2)[] = [0, 1, 2];

  /** The chart's step, coordinate units. */
  const STEP: number = 1e-3;

  /** The world angular velocity that carries one rotation to another over a span, radians per unit. */
  const turn = (from: IAutoMovieQuaternion, to: IAutoMovieQuaternion, span: number): IAutoMovieVector3 => {
    let q: IAutoMovieQuaternion = Quaternion.multiply(to, Quaternion.inverse(from));
    if (q.w < 0) q = { x: -q.x, y: -q.y, z: -q.z, w: -q.w };
    const s: number = Math.hypot(q.x, q.y, q.z);
    if (s < 1e-15) return { x: 0, y: 0, z: 0 };
    const angle: number = (2 * Math.atan2(s, q.w)) / span;
    return { x: (q.x / s) * angle, y: (q.y / s) * angle, z: (q.z / s) * angle };
  };
}
