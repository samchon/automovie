import {
  type IAutoMovieChainBone,
  Quaternion,
  Vector3,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
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
 * @evidence contracts/development/design.md#principled-representation Segment-origin twists are the geometric serial-chain Jacobian (Siciliano et al. 2009, section 3.1.3), composed with the existing swing-twist coordinate chart's derivative.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Ordered segment columns and one placed-chain reader serve trajectory linearisation and the public derivative checks.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Joint-axis math and actual clinical projections remain with HumanJacobian; this adapter preserves chart steps, clamped zero columns and free-coordinate order.
 */
export namespace HumanArmJacobian {
  /** One coordinate's motion of the arm's three segments, per coordinate unit: radians and metres at each segment's origin (the shoulder, the elbow, the wrist).
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines angular and linear units at the three physical segment origins.
   * @evidence contracts/development/design.md#principled-representation Three existing HumanJacobian twists describe one coordinate's rigid segment motion.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Probe, contact and orientation derivatives consume these three segments.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No alternate joint axis or finite probe approximation is stored.
   */
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
   * @param placed The arm's actual chain placed at them (`HumanArmGeometry.chain`, also included in placed).
   * @param free The free coordinates, in order.
   * @returns One column per free coordinate.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Specifies actual placed FK, original coordinate order and the free-column result.
   * @evidence contracts/development/implementation.md#principled-implementation Reuses the geometric joint-axis reading for elbow/wrist coordinates and the existing two-sided shoulder-chart angular difference; clamped coordinates still produce zero columns.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Supply three actual world segment frames, read joint motions and their exact projections together, then map each requested free coordinate.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps all six joint-axis queries, numerical clamp values, STEP, quaternion multiplication order and near-zero angular threshold; no analytical chart approximation replaces the existing central difference.
   * @evidence contracts/development/implementation.md#efficient-algorithms One joint-axis reading per candidate borrows the setup's canonical clamp metadata while retaining actual joint projections, then two chart evaluations per shoulder coordinate use one perturbation array. Fixed variable labels, world-only bone fields and at most two lazy placed-chain offsets avoid repeated temporary records; every returned column and cross product remains fresh.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Borrows already placed world fields and the setup's actual engine clamp factory for this same unchanged body/skeleton/axes/domain operation; every requested joint is still actually projected. The lower/hand readings supply clamp-status checks, and shoulder columns share only the same unchanged placed elbow/hand displacement from the shoulder after its first actual use.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns fresh column records and releases its coordinate scratch and two optional private displacements after the call; those inputs are not returned by the cross products. Two fixed six-entry variable-label tables retain only canonical bone names/axes; noncanonical pairs allocate call-local labels instead.
   */
  export function columns(
    setup: G.ISetup,
    at: G.IFrame,
    c: readonly number[],
    placed: IChain,
    free: readonly number[],
  ): IColumn[] {
    const { upper, lower, hand }: G.ISetup["bones"] = setup.bones;
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
    const joints: readonly HumanJacobian.IMotion[] = reading.motions;
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
    return free.map((d: number): IColumn => {
      if (d >= 3) {
        // Past its limit an angle is clamped by forward kinematics, so it
        // moves nothing.
        if (kept[(d < 6 ? 0 : 3) + (d % 3)] !== c[d])
          return { upper: STILL, lower: STILL, hand: STILL };
        const motion: HumanJacobian.IMotion = joints[d - 3]!;
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

  /** An arm's chain placed at coordinates: each joint's point and each segment's world rotation.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the physical world positions and segment rotations retained from the placement.
   * @evidence contracts/development/design.md#principled-representation The actual geometry owner's chain result keeps the same world FK representation as a full placement.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Extends the geometry owner's chain result without duplicate fields while retaining this public interface's declaration-augmentation surface.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Does not invent a second pose or kinematic chain definition.
   */
  export interface IChain extends ReturnType<typeof G.chain> {}

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
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines arm encoding, optional coordinate offsets and the returned chain function's world-frame result.
   * @evidence contracts/development/implementation.md#principled-implementation Builds the original arm setup/frame, encodes actual clamped clinical triples, applies each supplied offset and reads the same FK differentiated by columns.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One setup, frame, coordinate list and free list create the columns and a chain closure.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not remove out-of-range offsets or locked-coordinate behavior; the frame's actual body/external probe and admission rules remain unchanged.
   * @evidence contracts/development/implementation.md#efficient-algorithms One frame preparation, one current arm-chain FK and columns reading, then one actual FK per requested chain query, without allocating unused tip or collision probes.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The returned chain closure shares the same unchanged setup and frame as its columns; every supplied coordinate is evaluated independently.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller owns the returned coordinates, columns and closure; the closure retains only its operation's setup/frame and no history of queried candidates.
   */
  export function read(
    body: IHumanBody,
    side: "left" | "right",
    pose: IAutoMoviePose,
    arm: HumanArmClearance.IArm,
    offset: readonly number[] = [],
  ): {
    c: number[];
    free: number[];
    columns: IColumn[];
    chain: (c: readonly number[]) => IChain;
  } {
    const setup: G.ISetup = G.prepare(body, side);
    const at: G.IFrame = HumanArmFrame.of(setup, { pose, others: [] }, true);
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
      chain: (q: readonly number[]): IChain => G.chain(setup, at, q),
    };
  }

  /** A segment that does not move. */
  const STILL: HumanJacobian.ITwist = {
    angular: { x: 0, y: 0, z: 0 },
    linear: { x: 0, y: 0, z: 0 },
  };

  /** A joint's angles by index: flexion, abduction, twist. */
  const AXES: readonly (0 | 1 | 2)[] = [0, 1, 2];

  /** Fixed variable labels of the canonical arms, borrowed only by the read-only Jacobian consumer. */
  const JOINTS: Readonly<
    Record<"left" | "right", readonly HumanJacobian.IVariable[]>
  > = {
    left: jointVariables("leftLowerArm", "leftHand"),
    right: jointVariables("rightLowerArm", "rightHand"),
  };

  /** The original six-variable order, also used for a setup with noncanonical bone identities. */
  function jointVariables(
    lower: AutoMovieHumanoidBone,
    hand: AutoMovieHumanoidBone,
  ): HumanJacobian.IVariable[] {
    return [3, 4, 5, 6, 7, 8].map(
      (d: number): HumanJacobian.IVariable => ({
        kind: "angle",
        bone: d < 6 ? lower : hand,
        axis: AXES[d % 3]!,
      }),
    );
  }

  /** The chart's step, coordinate units. */
  const STEP: number = 1e-3;

  /** The world angular velocity that carries one rotation to another over a span, radians per unit. */
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
