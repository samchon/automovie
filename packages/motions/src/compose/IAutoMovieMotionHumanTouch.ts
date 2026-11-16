import type { AutoMovieHumanoidBone, IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import type { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import type { AutoMovieMotionClock } from "./AutoMovieMotionClock";
import type { AutoMovieMotionHumanArm } from "./AutoMovieMotionHumanArm";
import type { AutoMovieMotionHumanArmPlanned } from "./AutoMovieMotionHumanArmPlanned";
import type { AutoMovieMotionHumanTarget } from "./AutoMovieMotionHumanTarget";
import type { AutoMovieMotionHumanTouchContacts } from "./AutoMovieMotionHumanTouchContacts";
import type { AutoMovieMotionHumanTouchEffector } from "./AutoMovieMotionHumanTouchEffector";
import type { AutoMovieMotionHumanTouchForm } from "./AutoMovieMotionHumanTouchForm";

/**
 * One touch.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning, unit and default.
 * @evidence contracts/development/design.md#principled-representation The phrase clock, the effector, the region as a frame of the posture and the kind with its repetitions.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The members `touch` reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The region is a frame function, so a partner's region and the performer's own fit one member.
 */
export interface IAutoMovieMotionHumanTouch {
  /** The body. */
  body: IHumanBody;

  /** A phrase clock: arrive by `ready`, repeat from `strokeStart` to `strokeEnd`, leave from `relax`. */
  clock: AutoMovieMotionClock.IClock;

  /** The hand. */
  side: HumanHand.Side;

  /** The arm's angles before and after the touch. */
  rest: AutoMovieMotionHumanArm.IAngles;

  /** The effector. */
  effector: AutoMovieMotionHumanTouchEffector.IEffector;

  /**
   * The region at a second.
   *
   * @param posture The posture written so far in this frame.
   * @param seconds Seconds since the action's start.
   * @param resolution Optional same-body FK metadata borrowed only during this invocation.
   * @param projection Optional genuine same-body ROM metadata borrowed only during this invocation.
   * @returns The region's point in world metres and its unit normal, pointing away from the surface.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States both arguments, the space and unit of the point and the sense of the normal.
   * @evidence contracts/development/implementation.md#principled-implementation The region is read on the posture so far, so a region on a moving partner or on the performer's own body is followed frame by frame.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One query returning the surface frame's two quantities; the touch builds its lift and travel on them.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The normal is required, so the lift's direction is never guessed from the point alone.
   * @evidence contracts/development/implementation.md#efficient-algorithms Touch.goal invokes one actual region read per target query; touchRegion/touchHold choose the original own-entry, current trunk or partner observation, paying only its demanded FK and surface placement when needed.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The actual adapters may borrow same-body FK/ROM metadata for the current posture and invocation; partner bodies and film instants retain separate observations, with no sampled region result cache.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Touch.goal retains the region callback with its action props; query loans are synchronous arguments only and never enter the returned numeric region frame or retained action state.
   */
  region(
    posture: IHumanPosture,
    seconds: number,
    resolution?: Parameters<IHumanActionPlan["posture"]>[2],
    projection?: Parameters<IHumanActionPlan["posture"]>[3],
  ): Pick<AutoMovieMotionHumanTarget.IPlace, "point" | "normal">;

  /** The kind. */
  kind: AutoMovieMotionHumanTouchForm.Kind;

  /** How many repetitions; a positive whole number. */
  count: number;

  /** The travel's direction; `up` when absent. */
  tangent?: AutoMovieMotionHumanTouchForm.Tangent;

  /** The effector's stand-off from the region along its normal beyond the skin's pad, metres; 0 when absent. */
  standoff?: number;

  /** Factor on the lift and the travel; 1 when absent. */
  extent?: number;

  /** The elbow's bend hint, world, on the entry posture; carried with the root. */
  bend: IAutoMovieVector3;

  /** The arm laid on the region at the entry (`laid`), which every second's fit is held to; no reference when absent. */
  reference?: NonNullable<IHumanPosture.IGoal["reference"]>;

  /** What the effector's along axis lies on: the travel's tangent, or `arm`, the direction away from the elbow across the region (`AutoMovieMotionHumanTouchPath.lay`), or `reach`, for an effector that meets its place end on: its facing axis runs from the elbow straight to the place (`AutoMovieMotionHumanTouchPath.reach`) and its along axis lies on the world's up, or `upright`, the world's up as a held vessel stands, the effector facing against `facing`; the tangent when absent. */
  lay?: "tangent" | "arm" | "reach" | "upright";

  /** The hand's rotation the stroke keeps, world, on the entry posture, turned with the posture's heading: a held tool laid as the grasp chosen for its use presents it (`HumanGraspUse.presented`), so only its point moves. The effector is laid by `lay` when absent. */
  held?: IAutoMovieQuaternion;

  /** With `upright`, the level world direction the effector faces against (`AutoMovieMotionHumanTouchUpright`); the region's level normal when absent. */
  facing?: IAutoMovieVector3;

  /** With `upright` or `held`, how far the vessel leans toward the region at the face, degrees (`AutoMovieMotionHumanTouchUpright.tip`): the goal holds it so leaned, so the arm is carried toward the arm that holds it at the lips, while the hand's attitude on the way (`AutoMovieMotionHumanDrinkingArm.carried`) carries it as it is laid or held, tipped over the last `TIP` of the carry's progress and righted over the first `TIP` of the way back; no lean when absent. */
  lean?: number;

  /** Where the elbow lies while the hand is on the region, which `arm` lays the effector from: the place of least strain (`natural`) or `level` with the shoulder; `natural` when absent. */
  elbow?: "natural" | "level";

  /** With `reach`, the elbow's place the effector runs from (`settled`), world, on the entry posture; carried with the root. Read from the body's measures when absent. */
  from?: IAutoMovieVector3;

  /** The entry posture the hint was solved on. */
  entry: Pick<IHumanPosture, "root" | "yaw">;

  /** What the hand bears on while it is on the region; no window when absent, nor when a held tool's point touches a person (the tool touches them, not the hand, so the hand's fingers are read against the body like any other part). */
  contact?: IHumanContactWindow.Support;

  /** `keep` leaves the fingers as the base holds them, as a hand that grips a prop must; they take the effector's shape when absent. */
  fingers?: "keep";

  /** The arm's segments that lie on a person's segment while the hand is on the region, each declared as a contact from `ready` to `relax` (a self-hug's forearm on the other forearm or on the chest); none when absent. */
  rests?: readonly AutoMovieMotionHumanTouchContacts.IRest[];

  /** The arms of a touch with two hands, planned as one trajectory (`AutoMovieMotionHumanArmPlanned.ITogether`); this arm alone when absent. */
  together?: AutoMovieMotionHumanArmPlanned.ITogether;

  /** The radius about its site the hand may land within on the region, metres: the site's own, or the region's extent; the audit's contact skin when absent. */
  disc?: number;

  /** The region and the colliders as a plan perceives them, for a touch of another person (`AutoMovieMotionHumanArm.ICarry.perceived`); the hand then follows the person on the hold. */
  perceived?: Pick<IAutoMovieMotionHumanTouch, "region" | "others">;

  /** The performer's own bone the region rides, for a region of the performer, so a region on the other arm of the touch rides that arm as it is planned. */
  on?: AutoMovieHumanoidBone;

  /**
   * Another body's placed colliders the arm keeps clear of at a second (`IHumanPosture.IGoal.clear`), and the ones it lays the hand on (`IHumanPosture.IGoal.rests`); none when absent.
   *
   * @param posture The posture written so far in this frame.
   * @param seconds Seconds since the action's start.
   * @param resolution Optional same-body FK metadata borrowed only during this invocation.
   * @param projection Optional genuine same-body ROM metadata borrowed only during this invocation.
   * @returns The colliders, placed in the world, kept clear of and rested on.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States both arguments, the result's frame and the default.
   * @evidence contracts/development/implementation.md#principled-implementation A partner moves, so their colliders are read at the second the goal is written.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One query, written into the arm's goal.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The colliders are the profile's, placed by the partner's displayed bones.
   * @evidence contracts/development/implementation.md#efficient-algorithms Touch.goal performs this optional collider query once per actual target read; touchHold places the original partner profile parts in O(P) for P parts without reducing the requested film instants.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Callback adapters may share fixed profile/demand metadata and explicit same-body invocation loans; different partner poses, reaction instants and stop states remain separate actual placement queries.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The action retains the callback, while each invocation owns its collider arrays and numeric placements. Borrowed query metadata is not stored in those outputs or the retained action.
   */
  others?(
    posture: IHumanPosture,
    seconds: number,
    resolution?: Parameters<IHumanActionPlan["posture"]>[2],
    projection?: Parameters<IHumanActionPlan["posture"]>[3],
  ): Pick<IHumanPosture.IGoal, "clear" | "rests">;
}
