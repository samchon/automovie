import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { AutoMovieHumanoidBone } from "../../../skeleton/AutoMovieHumanoidBone";

/**
 * The analytic Jacobian of a posed body: how each of a posture's variables
 * (the root's place, its yaw, pitch and roll, and any joint angle) moves
 * the bones, read from the one forward kinematics that posed them.
 *
 * Each variable is a twist: the bones it moves turn about a world axis
 * through a point, or move along a direction (Siciliano et al. 2009,
 * section 3.1.3). A bone's segment then has the twist's angular velocity
 * and its origin the linear velocity `v + ω × (o − pivot)`, and any point
 * on it moves at `v_origin + ω × (p − o)`, so a caller with many probes on
 * few segments reads each segment's twist once (`twist`) and a caller with
 * few points reads their columns directly (`velocity`). The root's place
 * moves every bone along its axis; its heading turns every bone about the
 * root, yaw about the world's up, pitch about the yawed left axis and roll
 * about the yawed and pitched forward axis (`resolveHumanPosture.heading`).
 * A joint's three angles compose its rotation in the engine's order
 * (`jointToQuaternion`): twist, abduction, flexion for a proximal twist, so
 * the flexion axis is the basis axis turned by the twist and the abduction
 * before it, and abduction, flexion, twist for a distal one. The frame
 * before the joint is its parent's world rotation turned by its rest
 * rotation, and a clinical angle is the rig's angle mapped by the rest
 * frame, so a turn per clinical degree is the axis scaled by the frame's
 * sign. The angles are the clamped ones forward kinematics reads, so at a
 * range limit the motion is the one the joint makes inward.
 *
 * @evidence contracts/development/common.md#meaningful-documentation linear: The linear velocity it gives the world origin, metres; a place's direction, or the turn's at the origin. moves: The bones moved; null for every bone. linear: Metres, at the bone's origin.
 * @evidence contracts/development/design.md#principled-representation linear: The linear velocity it gives the world origin, metres; a place's direction, or the turn's at the origin. moves: The bones moved; null for every bone. linear: Metres, at the bone's origin.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: posture/HumanArmJacobian.ts (HumanArmJacobian.columns.joints, return); posture/HumanBodyFit.ts (HumanBodyFit.fit.units, v); posture/HumanBodyFit.ts (HumanBodyFit.fit.least, v); posture/HumanFitVariables.ts (HumanFitVariables.BODY, return); posture/HumanFitVariables.ts (HumanFitVariables.vector, variables); posture/HumanFitVariables.ts (HumanFitVariables.vector, v).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical AutoMovieHumanoidBone, IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanJacobian {
  /**
   * A variable of a posture, per its own unit: the root's place per metre, its heading's angles and a joint's angles per degree.
   *
   * @evidence contracts/development/common.md#meaningful-documentation kind: Differentiated coordinate family: root translation, root heading or a clinical joint angle. axis: Coordinate axis within that family: x/y/z metres, yaw/pitch/roll degrees, or clinical joint tuple index 0/1/2. kind: Differentiated coordinate family: root translation, root heading or a clinical joint angle.
   * @evidence contracts/development/design.md#principled-representation kind: Differentiated coordinate family: root translation, root heading or a clinical joint angle. axis: Coordinate axis within that family: x/y/z metres, yaw/pitch/roll degrees, or clinical joint tuple index 0/1/2. kind: Differentiated coordinate family: root translation, root heading or a clinical joint angle.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: posture/HumanArmJacobian.ts (HumanArmJacobian.columns.joints, return); posture/HumanBodyFit.ts (HumanBodyFit.fit.units, v); posture/HumanBodyFit.ts (HumanBodyFit.fit.least, v); posture/HumanFitVariables.ts (HumanFitVariables.BODY, return); posture/HumanFitVariables.ts (HumanFitVariables.vector, variables); posture/HumanFitVariables.ts (HumanFitVariables.vector, v).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical AutoMovieHumanoidBone identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export type IVariable =
    | {
        /** Differentiated coordinate family: root translation, root heading or a clinical joint angle. */
        kind: "place";
        /** Coordinate axis within that family: x/y/z metres, yaw/pitch/roll degrees, or clinical joint tuple index 0/1/2. */
        axis: "x" | "y" | "z";
      }
    | {
        /** Differentiated coordinate family: root translation, root heading or a clinical joint angle. */
        kind: "heading";
        /** Coordinate axis within that family: x/y/z metres, yaw/pitch/roll degrees, or clinical joint tuple index 0/1/2. */
        axis: "yaw" | "pitch" | "roll";
      }
    | {
        /** Differentiated coordinate family: root translation, root heading or a clinical joint angle. */
        kind: "angle";
        /** Bone whose clinical joint angle is differentiated. */
        bone: AutoMovieHumanoidBone;
        /** Coordinate axis within that family: x/y/z metres, yaw/pitch/roll degrees, or clinical joint tuple index 0/1/2. */
        axis: 0 | 1 | 2;
      };

  /**
   * How one variable moves the body, per its unit.
   *
   * @evidence contracts/development/common.md#meaningful-documentation linear: The linear velocity it gives the world origin, metres; a place's direction, or the turn's at the origin. moves: The bones moved; null for every bone.
   * @evidence contracts/development/design.md#principled-representation linear: The linear velocity it gives the world origin, metres; a place's direction, or the turn's at the origin. moves: The bones moved; null for every bone.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: posture/HumanBodyFitRows.ts (HumanBodyFitRows.of.all, _); posture/HumanBodyFitRows.ts (HumanBodyFitRows.floor.all, _); posture/HumanBodyFitRows.ts (HumanBodyFitRows.scaled, rate); posture/HumanBodyFitRows.ts (HumanBodyFitRows.scaled, m); posture/HumanBodyFitRows.ts (HumanBodyFitRows.low, m); posture/HumanFitBalance.ts (HumanFitBalance.slopes, motions).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3, AutoMovieHumanoidBone identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IMotion {
    /** The angular velocity of the bones it moves, radians; nought for a place. */
    angular: IAutoMovieVector3;

    /** The linear velocity it gives the world origin, metres; a place's direction, or the turn's at the origin. */
    linear: IAutoMovieVector3;

    /** The bones moved; null for every bone. */
    moves: ReadonlySet<AutoMovieHumanoidBone> | null;
  }

  /**
   * A segment's twist under a motion: its angular velocity and its origin's linear velocity, per the variable's unit.
   *
   * @evidence contracts/development/common.md#meaningful-documentation linear: Metres, at the bone's origin.
   * @evidence contracts/development/design.md#principled-representation linear: Metres, at the bone's origin.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: posture/HumanArmTrajectoryJacobians.ts (HumanArmTrajectoryJacobians.of.motion, twist); posture/HumanFitTargets.ts (HumanFitTargets.rows.motions, return); posture/HumanFitTargets.ts (HumanFitTargets.rows.scaled, f); posture/HumanFitTargets.ts (HumanFitTargets.rows.scaled, motion); posture/HumanFitTargets.ts (HumanFitTargets.rows, motion); posture/HumanFitTargets.ts (HumanFitTargets.rows, _).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface ITwist {
    /** Radians. */
    angular: IAutoMovieVector3;

    /** Metres, at the bone's origin. */
    linear: IAutoMovieVector3;
  }
}
