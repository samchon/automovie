import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { AutoMovieHumanoidBone } from "../../../skeleton/AutoMovieHumanoidBone";
import type { AutoMovieHumanDigit } from "./AutoMovieHumanDigit";
import type { AutoMovieHumanLimb } from "./AutoMovieHumanLimb";
import type { IAutoMovieHumanDigitGoal } from "./IAutoMovieHumanDigitGoal";
import type { IAutoMovieHumanLimbGoal } from "./IAutoMovieHumanLimbGoal";
import type { IAutoMovieHumanPostureRotation } from "./IAutoMovieHumanPostureRotation";

/**
 * One instant of a performer as an action law writes it: where the body
 * stands and faces, the clinical angles of the joints it sets directly, and
 * the goals of the limbs it places by inverse kinematics.
 *
 * Every point is in world metres of the canonical frame (+Y up). `root` is the
 * rig's origin, the floor point under the pelvis at rest, so lowering it by
 * 0.1 lowers the whole body 0.1; `yaw` turns the body about +Y in degrees (0
 * faces +Z, 90 faces +X), then `pitch` tips it forward and `roll` toward its
 * right, both in degrees about the turned axes. `joints` holds clinical
 * degrees `[flexion, abduction, twist]` read through `HUMANOID_REST_FRAME`;
 * a bone a limb goal solves takes the goal's result instead. A limb goal
 * places its end joint (the wrist or the ankle) on `point`, bends its middle
 * joint toward `bend` and, when `rotation` is given, turns the hand or foot to
 * that world rotation from the rest. A planted limb (`planted: true`) is
 * re-solved onto its goal after transitions, so a foot on the floor or a hand
 * on a grip never slides.
 *
 * @evidence contracts/development/common.md#meaningful-documentation root: The rig origin, world metres. yaw: Heading about +Y, degrees; 0 faces +Z. pitch: Forward tip of the whole body about its turned left axis, degrees. point: Where the end joint (wrist or ankle) goes, world metres. elbow: Where an arm's elbow goes when the law leaves it to the body: `"strain"` takes, among the places that leave the hand's rotation error least, the one where the arm strains least, read from the fit's own sweep (`AutoMovieMotionHumanBend.strainOf`), with `bend` serving only where no place is legal. Absent, `bend` decides; a leg ignores it. contact: The contact the hand or foot turns about, in its rest frame relative to its joint (a heel, a ball, a palm): when `rotation` cannot be met exactly within the limb's range, the end joint is re-aimed so this point stays where the goal puts it, and the rotation gives way, as a foot pivots on its ball.
 * @evidence contracts/development/design.md#principled-representation root: The rig origin, world metres. yaw: Heading about +Y, degrees; 0 faces +Z. pitch: Forward tip of the whole body about its turned left axis, degrees. point: Where the end joint (wrist or ankle) goes, world metres. elbow: Where an arm's elbow goes when the law leaves it to the body: `"strain"` takes, among the places that leave the hand's rotation error least, the one where the arm strains least, read from the fit's own sweep (`AutoMovieMotionHumanBend.strainOf`), with `bend` serving only where no place is legal. Absent, `bend` decides; a leg ignores it. contact: The contact the hand or foot turns about, in its rest frame relative to its joint (a heel, a ball, a palm): when `rotation` cannot be met exactly within the limb's range, the end joint is re-aimed so this point stays where the goal puts it, and the rotation gives way, as a foot pivots on its ball.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: actions/jump.ts (jump.plan.offset, posture); actions/jump.ts (jump.plan.flightPosture, return); actions/jump.ts (jump.plan, return); actions/jumpAirborne.ts (jumpAirborne.posture, return); actions/jumpAirborne.ts (jumpAirborne.turning, posture); actions/jumpAirborne.ts (jumpAirborne.turning, return).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3, AutoMovieHumanoidBone identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers. Shares the canonical IAutoMovieVector3, IAutoMovieQuaternion, AutoMovieHumanoidBone, IAutoMovieMotionHumanColliders.IPlaced identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export interface IAutoMovieMotionHumanPosture {
  /** The rig origin, world metres. */
  root: IAutoMovieVector3;

  /** Heading about +Y, degrees; 0 faces +Z. */
  yaw: number;

  /** Forward tip of the whole body about its turned left axis, degrees. */
  pitch: number;

  /** Tip toward the body's right about its turned forward axis, degrees. */
  roll: number;

  /** Clinical angles of directly set bones, degrees. */
  joints: Partial<
    Record<AutoMovieHumanoidBone, readonly [number, number, number]>
  >;

  /** Limb goals solved by inverse kinematics. */
  limbs: Partial<Record<AutoMovieHumanLimb, IAutoMovieHumanLimbGoal>>;

  /**
   * A rigid turn of the whole posture about a world point, applied after
   * the heading: the root's position and rotation and every world limb goal
   * (its point, its bend and its rotation) go round `about` by `turn`, while
   * a goal attached to a bone (`on`) moves with its bone. It carries the
   * orientations the heading's Euler angles cannot blend or read back, such
   * as a somersault through the vertical or a twist about the long axis of a
   * pitched body, so `yaw`, `pitch` and `roll` keep meaning the facing a law
   * reads on the floor plan. Absent for no turn. A planted world goal cannot
   * go round with the body and is refused with it
   * (`turnHumanPosture`).
   */
  rotation?: IAutoMovieHumanPostureRotation;

  /**
   * Digit goals, each solved by the digit's own inverse kinematics after
   * every limb, so the arm places the hand first and the digit reaches from
   * there (`HumanDigitFit`): a fingertip on a key, a thumb pad on a phone's
   * screen. A digit with a goal takes the fit's angles instead of `joints`.
   * None when absent.
   */
  digits?: Partial<Record<AutoMovieHumanDigit, IAutoMovieHumanDigitGoal>>;
}
