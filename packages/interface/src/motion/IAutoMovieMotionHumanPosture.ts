import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";
import type { AutoMovieHumanDigit } from "./AutoMovieHumanDigit";
import type { AutoMovieHumanLimb } from "./AutoMovieHumanLimb";
import type { IAutoMovieHumanDigitGoal } from "./IAutoMovieHumanDigitGoal";
import type { IAutoMovieHumanLimbGoal } from "./IAutoMovieHumanLimbGoal";
import type { IAutoMovieHumanPostureRotation } from "./IAutoMovieHumanPostureRotation";

/**
 * One instant of a performer as an action law writes it: where the body stands
 * and faces, the clinical angles of the joints it sets directly, and the goals
 * of the limbs it places by inverse kinematics.
 *
 * Every point is in world metres of the canonical frame (+Y up). `root` is the
 * rig's origin, the floor point under the pelvis at rest, so lowering it by 0.1
 * lowers the whole body 0.1; `yaw` turns the body about +Y in degrees (0 faces
 * +Z, 90 faces +X), then `pitch` tips it forward and `roll` toward its right,
 * both in degrees about the turned axes. `joints` holds clinical degrees
 * `[flexion, abduction, twist]` read through `HUMANOID_REST_FRAME`; a bone a
 * limb goal solves takes the goal's result instead. A limb goal places its end
 * joint (the wrist or the ankle) on `point`, bends its middle joint toward
 * `bend` and, when `rotation` is given, turns the hand or foot to that world
 * rotation from the rest. A planted limb (`planted: true`) is re-solved onto
 * its goal after transitions, so a foot on the floor or a hand on a grip never
 * slides.
 *
 * A resolver-issued preparation may privately associate its exact translated
 * raw object with the source's actual cold solution. This adds no public
 * resolved state: original goals remain authoring demands, and copies or
 * changed solver context receive ordinary resolution.
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
   * A rigid turn of the whole posture about a world point, applied after the
   * heading: the root's position and rotation and every world limb goal (its
   * point, its bend and its rotation) go round `about` by `turn`, while a goal
   * attached to a bone (`on`) moves with its bone. It carries the orientations
   * the heading's Euler angles cannot blend or read back, such as a somersault
   * through the vertical or a twist about the long axis of a pitched body, so
   * `yaw`, `pitch` and `roll` keep meaning the facing a law reads on the floor
   * plan. Absent for no turn. A planted world goal cannot go round with the
   * body and is refused with it (`turnHumanPosture`).
   */
  rotation?: IAutoMovieHumanPostureRotation;

  /**
   * Digit goals, each solved by the digit's own inverse kinematics after every
   * limb, so the arm places the hand first and the digit reaches from there
   * (`HumanDigitFit`): a fingertip on a key, a thumb pad on a phone's screen. A
   * digit with a goal takes the fit's angles instead of `joints`. None when
   * absent.
   */
  digits?: Partial<Record<AutoMovieHumanDigit, IAutoMovieHumanDigitGoal>>;
}
