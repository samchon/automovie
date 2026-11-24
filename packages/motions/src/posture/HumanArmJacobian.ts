import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieChainBone,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanArmClearance,
  IAutoMovieMotionHumanArmGeometry,
  IAutoMovieMotionHumanArmJacobian,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanJacobian,
  IAutoMovieMotionHumanPosture,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanArmFrame } from "./HumanArmFrame";
import { HumanArmGeometry as G } from "./HumanArmGeometry";
import { HumanJacobian } from "./HumanJacobian";

/** The alternatives of `AXESItem`'s site. */
type AXESItem = 0 | 1 | 2;

/**
 * The analytic Jacobian of the arm planner's coordinates: for each free
 * coordinate, the twist of the upper arm, the forearm and the hand, so a point
 * riding a segment moves at `v_origin + ω × (p − origin)`.
 *
 * The elbow's and the wrist's coordinates are their joints' clinical angles,
 * whose motions are the rig's own joint axes (`HumanJacobian.of`) read on the
 * planner's placed chain; an angle past the skeleton's range, which forward
 * kinematics clamps (`HumanArmGeometry.rotation`), moves nothing, so its column
 * is zero. The shoulder's three are the swing-twist chart's
 * (`HumanArmGeometry.shoulder`), whose turn per coordinate is the chart's own
 * derivative: the world rotation of the upper arm read at the coordinate a hair
 * either side, the shoulder's point fixed, the forearm and the hand carried
 * with it.
 */
export namespace HumanArmJacobian {
  /**
   * Each free coordinate's column at an arm placed in a frame.
   *
   * @param setup The arm.
   * @param at The frame.
   * @param c The coordinates.
   * @param placed The arm's actual chain placed at them
   *   (`HumanArmGeometry.chain`, also included in placed).
   * @param free The free coordinates, in order.
   * @returns One column per free coordinate.
   */
  export function columns(
    setup: IAutoMovieMotionHumanArmGeometry.ISetup,
    at: IAutoMovieMotionHumanArmGeometry.IFrame,
    c: readonly number[],
    placed: IAutoMovieMotionHumanArmJacobian.IChain,
    free: readonly number[],
  ): IAutoMovieMotionHumanArmJacobian.IColumn[] {
    const {
      upper,
      lower,
      hand,
    }: IAutoMovieMotionHumanArmGeometry.ISetup["bones"] = setup.bones;
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieChainBone> = new Map();
    bones.set(upper, {
      worldPosition: placed.shoulder,
      worldRotation: placed.upper,
    });
    bones.set(lower, {
      worldPosition: placed.elbow,
      worldRotation: placed.lower,
    });
    bones.set(hand, {
      worldPosition: placed.wrist,
      worldRotation: placed.hand,
    });
    const posture: IAutoMovieMotionHumanPosture = {
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
    const reading: ReturnType<typeof HumanJacobian.read> = HumanJacobian.read(
      setup.body,
      posture,
      bones,
      lower === "leftLowerArm" && hand === "leftHand"
        ? JOINTS.left
        : lower === "rightLowerArm" && hand === "rightHand"
          ? JOINTS.right
          : jointVariables(lower, hand),
      setup.clamp,
    );
    const joints: readonly IAutoMovieMotionHumanJacobian.IMotion[] =
      reading.motions;
    const lowerJoint: IAutoMovieJointPose = reading.clamped.get(lower)!;
    const flexion: number = lowerJoint.flexion ?? 0;
    const abduction: number = lowerJoint.abduction ?? 0;
    const twist: number = lowerJoint.twist ?? 0;
    const handJoint: IAutoMovieJointPose = reading.clamped.get(hand)!;
    const kept: readonly number[] = [
      flexion,
      abduction,
      twist,
      handJoint.flexion ?? 0,
      handJoint.abduction ?? 0,
      handJoint.twist ?? 0,
    ];
    const moved: number[] = [...c];
    const world: (d: number, sign: number) => IAutoMovieQuaternion = (
      d: number,
      sign: number,
    ): IAutoMovieQuaternion => {
      moved[d] = c[d]! + sign * STEP;
      return Quaternion.multiply(
        at.parent.rotation,
        Quaternion.multiply(
          setup.rest.upper.rotation,
          G.shoulder(setup, moved),
        ),
      );
    };
    let elbow: IAutoMovieVector3 | undefined;
    let wrist: IAutoMovieVector3 | undefined;
    return free.map((d: number): IAutoMovieMotionHumanArmJacobian.IColumn => {
      if (d >= 3) {
        // Past its limit an angle is clamped by forward kinematics, so it
        // moves nothing.
        if (kept[(d < 6 ? 0 : 3) + (d % 3)] !== c[d])
          return { upper: STILL, lower: STILL, hand: STILL };
        const motion: IAutoMovieMotionHumanJacobian.IMotion = joints[d - 3]!;
        return {
          upper: HumanJacobian.twist(motion, upper, placed.shoulder),
          lower: HumanJacobian.twist(motion, lower, placed.elbow),
          hand: HumanJacobian.twist(motion, hand, placed.wrist),
        };
      }
      // The chart's own derivative: the upper arm's world turn per unit.
      const omega: IAutoMovieVector3 = turn(
        world(d, -1),
        world(d, 1),
        2 * STEP,
      );
      moved[d] = c[d]!;
      return {
        upper: { angular: omega, linear: { x: 0, y: 0, z: 0 } },
        lower: {
          angular: omega,
          linear: Vector3.cross(
            omega,
            (elbow ??= Vector3.subtract(placed.elbow, placed.shoulder)),
          ),
        },
        hand: {
          angular: omega,
          linear: Vector3.cross(
            omega,
            (wrist ??= Vector3.subtract(placed.wrist, placed.shoulder)),
          ),
        },
      };
    });
  }
  /**
   * One arm of a body on a pose, read at an arm moved by an offset in the
   * planner's coordinates: every coordinate's column, and the chain at any
   * coordinates, the forward kinematics the columns differentiate.
   *
   * @param body The body.
   * @param side The arm.
   * @param pose The pose the arm is read on.
   * @param arm The arm's clinical triples, encoded clamped
   *   (`HumanArmGeometry.encode`).
   * @param offset Added to each of the nine coordinates, so a coordinate may
   *   lie past its range; none when absent.
   * @returns The coordinates read at, the free ones (a hinge's fixed angle is
   *   not), their columns in that order and the chain.
   */
  export function read(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
    pose: IAutoMoviePose,
    arm: IAutoMovieMotionHumanArmClearance.IArm,
    offset: readonly number[] = [],
  ): IAutoMovieMotionHumanArmJacobian.IReadResult {
    const setup: IAutoMovieMotionHumanArmGeometry.ISetup = G.prepare(
      body,
      side,
    );
    const at: IAutoMovieMotionHumanArmGeometry.IFrame = HumanArmFrame(
      setup,
      { pose, others: [] },
      true,
    );
    const c: number[] = G.encode(setup, arm).map(
      (v: number, d: number): number => v + (offset[d] ?? 0),
    );
    const free: number[] = [];
    for (let d: number = 0; d < G.DIMENSIONS; ++d)
      if (setup.free[d]!) free.push(d);
    return {
      c,
      free,
      columns: columns(setup, at, c, G.chain(setup, at, c), free),
      chain: (q: readonly number[]): IAutoMovieMotionHumanArmJacobian.IChain =>
        G.chain(setup, at, q),
    };
  }

  /** A segment that does not move. */
  const STILL: IAutoMovieMotionHumanJacobian.ITwist = {
    angular: { x: 0, y: 0, z: 0 },
    linear: { x: 0, y: 0, z: 0 },
  };

  /** A joint's angles by index: flexion, abduction, twist. */
  const AXES: readonly AXESItem[] = [0, 1, 2];

  /**
   * Fixed variable labels of the canonical arms, borrowed only by the read-only
   * Jacobian consumer.
   */
  const JOINTS: Readonly<
    Record<
      AutoMovieHumanSide,
      readonly IAutoMovieMotionHumanJacobian.IVariable[]
    >
  > = {
    left: jointVariables("leftLowerArm", "leftHand"),
    right: jointVariables("rightLowerArm", "rightHand"),
  };

  /**
   * The original six-variable order, also used for a setup with noncanonical
   * bone identities.
   */
  function jointVariables(
    lower: AutoMovieHumanoidBone,
    hand: AutoMovieHumanoidBone,
  ): IAutoMovieMotionHumanJacobian.IVariable[] {
    return [3, 4, 5, 6, 7, 8].map(
      (d: number): IAutoMovieMotionHumanJacobian.IVariable => ({
        kind: "angle",
        bone: d < 6 ? lower : hand,
        axis: AXES[d % 3]!,
      }),
    );
  }

  /** The chart's step, coordinate units. */
  const STEP: number = 1e-3;

  /**
   * The world angular velocity that carries one rotation to another over a
   * span, radians per unit.
   */
  const turn: (
    from: IAutoMovieQuaternion,
    to: IAutoMovieQuaternion,
    span: number,
  ) => IAutoMovieVector3 = (
    from: IAutoMovieQuaternion,
    to: IAutoMovieQuaternion,
    span: number,
  ): IAutoMovieVector3 => {
    let q: IAutoMovieQuaternion = Quaternion.multiply(
      to,
      Quaternion.inverse(from),
    );
    if (q.w < 0) q = { x: -q.x, y: -q.y, z: -q.z, w: -q.w };
    const s: number = Math.hypot(q.x, q.y, q.z);
    if (s < 1e-15) return { x: 0, y: 0, z: 0 };
    const angle: number = (2 * Math.atan2(s, q.w)) / span;
    return { x: (q.x / s) * angle, y: (q.y / s) * angle, z: (q.z / s) * angle };
  };
}
