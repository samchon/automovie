import type {
  AutoMovieHumanoidBone,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanColliders } from "./HumanColliders";

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
 */
export interface IHumanPosture {
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
  limbs: Partial<Record<IHumanPosture.Limb, IHumanPosture.IGoal>>;

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
  rotation?: IHumanPosture.IRotation;

  /**
   * Digit goals, each solved by the digit's own inverse kinematics after
   * every limb, so the arm places the hand first and the digit reaches from
   * there (`HumanDigitFit`): a fingertip on a key, a thumb pad on a phone's
   * screen. A digit with a goal takes the fit's angles instead of `joints`.
   * None when absent.
   */
  digits?: Partial<Record<IHumanPosture.Digit, IHumanPosture.IDigitGoal>>;
}
/**
 * Companion types of {@link IHumanPosture}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents each member's frame and unit.
 * @evidence contracts/development/design.md#principled-representation World-frame goals with a bend hint and an optional end rotation, the inputs of two-bone IK with a pole vector; a digit goal is a surface of the distal phalanx on a point with an optional facing.
 * @evidence contracts/development/design.md#minimal-and-owned-surface What laws write and the resolver reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses interface vectors and quaternions.
 */
export namespace IHumanPosture {
  /** A limb solved by inverse kinematics. */
  export type Limb = (typeof LIMBS)[number];

  /** The limbs of {@link Limb}, as data. */
  export const LIMBS = ["leftArm", "rightArm", "leftLeg", "rightLeg"] as const;

  /** One limb's goal. */
  export interface IGoal {
    /** Where the end joint (wrist or ankle) goes, world metres. */
    point: IAutoMovieVector3;

    /** A world point the middle joint (elbow or knee) bends toward. */
    bend: IAutoMovieVector3;

    /**
     * Where an arm's elbow goes when the law leaves it to the body:
     * `"strain"` takes, among the places that leave the hand's rotation
     * error least, the one where the arm strains least, read from the fit's
     * own sweep (`AutoMovieMotionHumanBend.strainOf`), with `bend` serving only
     * where no place is legal. Absent, `bend` decides; a leg ignores it.
     */
    elbow?: "strain";

    /** The hand's or foot's world rotation from its rest, when the law sets it. */
    rotation?: IAutoMovieQuaternion;

    /** Whether the limb bears on a fixed contact the transition must not move. */
    planted?: boolean;

    /**
     * The contact the hand or foot turns about, in its rest frame relative to
     * its joint (a heel, a ball, a palm): when `rotation` cannot be met
     * exactly within the limb's range, the end joint is re-aimed so this
     * point stays where the goal puts it, and the rotation gives way, as a
     * foot pivots on its ball.
     */
    contact?: IAutoMovieVector3;

    /** Points in the end joint's own frame whose world positions must remain within their bounds of the asked frame. Requires rotation. These hard task limits accompany the contact when a path is planned; a held tool names both ends of its working line. */
    limits?: readonly IPointLimit[];

    /**
     * The bone the goal is attached to, when it moves with the body rather
     * than staying in the world: `point` and `bend` are then in the bone's
     * posed frame (relative to its posed world position and rotation) and
     * `rotation` composes after the bone's. The resolver carries them into the
     * world from the pose being fitted, after the trunk, the head, any layer
     * and any transition offset have placed the bone, so a palm on the chin or
     * in a pocket stays there when breathing or a glance moves the body. A
     * limb attached to another limb's bone is fitted after it; a bone of the
     * limb's own chain, or two limbs attached to each other, is refused
     * (`resolveHumanPosture.order`, `resolveHumanPosture.world`).
     */
    on?: AutoMovieHumanoidBone;

    /**
     * The limb's own solution at one instant of the action the law names (the
     * grasp, the clasp, the placement): the clinical angles of its upper and
     * lower bones there, as `resolveHumanPosture.reference` reads them. Where
     * the goal can be met by more than one arm or leg configuration, the fit
     * keeps the one nearest this reference, so the limb stays on one side of
     * the choice for the whole stroke. It is a constant of the plan, never a
     * previous frame, so the pose stays a function of time alone. A degree of
     * joint turn from the reference counts like a degree of hand or foot
     * rotation error, so a law gives it in full from the named instant on (the
     * hold after a grasp) and, over the reach toward that instant, raises its
     * `weight` from 0 to 1 with the reach's own progress: the reference is
     * that instant's solution, so the reach arrives at it exactly, and on the
     * way the growing weight keeps the limb on the reference's side where two
     * configurations nearly tie instead of letting it switch between them.
     */
    reference?: IHumanPosture.IReference;

    /**
     * Another body's colliders, placed in the world, an arm keeps clear of on
     * its way and at its goal (a partner whose head, cheek or back the hand
     * is sent to): its forearm keeps the clearance it keeps from its own
     * trunk, except that the wrist's own depth in them excuses nothing, since
     * no goal put the wrist inside another person (`HumanArmClearance`).
     * Ignored on a leg.
     */
    clear?: readonly HumanColliders.IPlaced[];

    /**
     * Another body's colliders, placed in the world, the goal lays the hand
     * on (the partner's segment a palm rests on): the forearm keeps clear of
     * them as of `clear`, except that near the wrist it asks no more room
     * than the goal gives, since the goal puts the hand on their surface
     * (`HumanArmClearance`). Ignored on a leg.
     */
    rests?: readonly HumanColliders.IPlaced[];
  }

  /**
   * A point of the effector whose asked place bounds a task's rigid pose.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the local point and world displacement bound with their units.
   * @evidence contracts/development/design.md#principled-representation A rigid effector point plus a Euclidean tolerance against the goal's asked world frame.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Shared by limb goals and trajectory sites; no separate tool constraint type.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The law supplies its physical bound and the planner reserves its numerical allowance inside it.
   */
  export interface IPointLimit {
    /** The point from the end joint in its own frame, metres. */
    contact: IAutoMovieVector3;

    /** The largest displacement from where the goal's point and rotation place it, metres. */
    bound: number;
  }

  /** A rigid turn of a whole posture about a world point. */
  export interface IRotation {
    /** The point that stays, world metres; normally the centre of mass. */
    about: IAutoMovieVector3;

    /** The turn, a unit quaternion in the world frame, applied after the heading. */
    turn: IAutoMovieQuaternion;
  }

  /** A digit of a hand, by side: the thumb or a finger. */
  export type Digit = (typeof DIGITS)[number];

  /** The digits of {@link Digit}, as data, the left hand's first, each thumb to little finger. */
  export const DIGITS = [
    "leftThumb",
    "leftIndex",
    "leftMiddle",
    "leftRing",
    "leftLittle",
    "rightThumb",
    "rightIndex",
    "rightMiddle",
    "rightRing",
    "rightLittle",
  ] as const;

  /** One digit's goal: a surface of its distal phalanx on a point. */
  export interface IDigitGoal {
    /** Where the surface goes, world metres, or in the posed frame of `on` when given. */
    point: IAutoMovieVector3;

    /** The outward normal of the surface touched, world (or `on`'s posed frame); the digit's surface is turned to face against it. Any direction when absent. */
    normal?: IAutoMovieVector3;

    /** Which surface of the digit: its tip or its pad. */
    surface: "tip" | "pad";

    /**
     * The bone the goal rides, when it moves with the body: `point` and
     * `normal` are then in its posed frame, read from the pose as fitted, so
     * a fingertip on the other hand's palm stays there. A goal on a prop is
     * written by its law in the world from the prop's frame at the instant.
     */
    on?: AutoMovieHumanoidBone;
  }

  /** A limb's reference solution: its upper and lower bones' clinical degrees. */
  export interface IReference {
    /** The upper bone's `[flexion, abduction, twist]`, degrees. */
    upper: readonly [number, number, number];

    /** The lower bone's `[flexion, abduction, twist]`, degrees. */
    lower: readonly [number, number, number];

    /**
     * How much a degree of joint turn from the reference counts, in degrees
     * of hand or foot rotation error (the engine's `referenceWeight`); 1 when
     * omitted. A reach toward the reference's instant raises it from 0 to 1.
     */
    weight?: number;
  }
}
