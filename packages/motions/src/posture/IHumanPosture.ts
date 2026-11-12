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
}
/**
 * Companion types of {@link IHumanPosture}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents each member's frame and unit.
 * @evidence contracts/development/design.md#principled-representation World-frame goals with a bend hint and an optional end rotation, the inputs of two-bone IK with a pole vector.
 * @evidence contracts/development/design.md#minimal-and-owned-surface What laws write and the resolver reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses interface vectors and quaternions.
 */
export namespace IHumanPosture {
  /** A limb solved by inverse kinematics. */
  export type Limb = "leftArm" | "rightArm" | "leftLeg" | "rightLeg";

  /** One limb's goal. */
  export interface IGoal {
    /** Where the end joint (wrist or ankle) goes, world metres. */
    point: IAutoMovieVector3;

    /** A world point the middle joint (elbow or knee) bends toward. */
    bend: IAutoMovieVector3;

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
