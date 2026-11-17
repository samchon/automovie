import type {
  AutoMovieHumanoidBone,
  IAutoMovieQuaternion,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import type { AutoMovieMotionHumanArmAngles } from "./AutoMovieMotionHumanArmAngles";
import type { AutoMovieMotionHumanArmPlanned } from "./AutoMovieMotionHumanArmPlanned";

/**
 * One arm carried toward a goal.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning, its unit and the range of the weight.
 * @evidence contracts/development/design.md#principled-representation The span the arm is written over, the angles it holds at weight 0, the goal it solves to at weight 1 and the weight between them; with a span, the action's instants and what the planned trajectory needs of the hold.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Sixteen members, all read by `carried` or by `AutoMovieMotionHumanArmPlanned`: seven that every carry needs, eight a planned arm reads (`span`, `perceived`, `tracked`, `together`, `on`, `disc`, `rests`, `grasp`) and the hand's `attitude`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The goal is the posture's own goal type as a function of the posture so far, so any owner of arm goals fits.
 */
export interface IAutoMovieMotionHumanArmCarry {
  /** The body. */
  body: IHumanBody;

  /** The arm. */
  side: HumanHand.Side;

  /** Seconds since the action's start from which the arm is written. */
  from: number;

  /** Seconds since the action's start until which the arm is written. */
  to: number;

  /** The angles the arm holds at weight 0. */
  rest: AutoMovieMotionHumanArmAngles.IAngles;

  /**
   * The goal the arm solves to at weight 1.
   *
   * @param posture The posture so far at this second.
   * @param seconds Seconds since the action's start.
   * @param resolution Optional same-body FK metadata borrowed only during this invocation.
   * @param projection Optional genuine same-body ROM projector borrowed only during this invocation.
   * @returns The goal.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each argument and when the function is called.
   * @evidence contracts/development/implementation.md#principled-implementation A goal that rides on the trunk is a function of the posture so far, evaluated when the row is written.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One callback slot supplies each actual fallback or attitude-end target; planning and physical fitting remain separate owners.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The goal is used as returned, with no second form for a fixed goal.
   * @evidence contracts/development/implementation.md#efficient-algorithms carried performs each original fallback/attitude-end goal read, while Planned reads and stores each actual refinement-time target once in its existing query map; target-specific FK and fits remain with the callback.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work carried and Observation forward same-body FK/genuine ROM metadata; braceOnThigh and touch callbacks consume it for current actual observations. Different postures, targets and instants retain independent calculations.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The primitive retains the goal callback; query metadata is borrowed only until that invocation returns or throws and never enters returned goals or retained planning state.
   */
  goal(
    posture: IHumanPosture,
    seconds: number,
    resolution?: Parameters<IHumanActionPlan["posture"]>[2],
    projection?: Parameters<IHumanActionPlan["posture"]>[3],
  ): IHumanPosture.IGoal;

  /**
   * How far the arm is from its held angles to its goal.
   *
   * @param seconds Seconds since the action's start.
   * @returns A value in [0, 1].
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the argument and its origin, and that the result is a share in [0, 1].
   * @evidence contracts/development/implementation.md#principled-implementation The share is a pure function of the seconds, so any time course fits one member and the reader evaluates it at each second it needs.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One member read once per evaluated second by `carried`.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts `carry` clamps the result to [0, 1] instead of trusting the member.
   * @evidence contracts/development/implementation.md#efficient-algorithms carried invokes the actual scalar callback once per write; stated evaluates its original named-search samples when no explicit span exists, retaining the supplied callback's cost and effects.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Current seconds always reach the supplied time course; no sampled weight cache substitutes for its actual clock/envelope calculation.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The primitive retains the scalar callback with props until release; each returned number is consumed directly and adds no query history or resource.
   */
  weight(seconds: number): number;

  /** The action's instants the arm's whole action is planned over as one trajectory (`AutoMovieMotionHumanArmPlanned.planned`): the reach, the hold on the goal's site and the return, in the clock's instants or as the weight states them (`AutoMovieMotionHumanArmPlanned.stated`); when absent, the deprecated joint-space carry (`carry`), kept until every law states its span. */
  span?: AutoMovieMotionHumanArmPlanned.ISpan;

  /**
   * The goal as a plan perceives it, for a goal on another person: the
   * person read where the performer saw them when the plan starts, so no
   * plan reads ahead of the second it is made at; `goal` when absent.
   *
   * @param posture The posture so far at the second.
   * @param seconds Seconds since the action's start.
   * @param resolution Optional same-body FK metadata borrowed only during this invocation.
   * @param projection Optional genuine same-body ROM projector borrowed only during this invocation.
   * @returns The goal.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is perceived, when, why, and the default.
   * @evidence contracts/development/implementation.md#principled-implementation A reach is planned from what is perceived when it is planned (a reaction time behind), never from a later instant.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Observation.aim selects the perceived callback for planning and the tracked current/perceived comparison; ordinary goal is its default.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Tracking still compares the actual goal with this original perceived target; reaction-time adapters retain their declared perception instant rather than substituting current or future partner state.
   * @evidence contracts/development/implementation.md#efficient-algorithms Planned reads each perceived arm/time once through its existing target map; tracked feedback still performs its actual current/perceived callback pair per grid step.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Observation selects this callback before goal and forwards only explicit same-body invocation metadata; the perception adapter keeps its original reaction instant rather than substituting a later target.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The carry retains the callback and existing numeric planned goals; no borrowed FK getter or ROM projector enters a goal, context or retained perception closure.
   */
  perceived?(
    posture: IHumanPosture,
    seconds: number,
    resolution?: Parameters<IHumanActionPlan["posture"]>[2],
    projection?: Parameters<IHumanActionPlan["posture"]>[3],
  ): IHumanPosture.IGoal;

  /** Whether the planned arm follows its goal on the hold, a person who moves: the plan with a correction toward `goal` read at each second, moved within the audit's travel bound (`AutoMovieMotionHumanArmFollow.follower`); the plan alone when absent. */
  tracked?: boolean;

  /** The arms planned over the same span as one problem; this arm alone when absent. */
  together?: AutoMovieMotionHumanArmPlanned.ITogether;

  /**
   * The arms planned over the same span on one base, each as a problem of
   * its own: every member is solved on the posture before the group's first
   * member, which shows the others at their rest, so the plans do not depend
   * on the order the arms are written in and two arms raised alike are each
   * other's mirror. For arms that keep to their own sides (a stretch, a
   * winner's two fists): arms whose paths may cross are one problem
   * (`together`). When both are given, `beside` decides.
   */
  beside?: AutoMovieMotionHumanArmPlanned.ITogether;

  /** The bone of the performer's own body the hand's region rides, for a region of the performer: a region on another arm of the group rides that arm as it is solved. */
  on?: AutoMovieHumanoidBone;

  /** The radius about its site the hand's contact may land within on the hold, metres: the site's own, or the region's extent; the contact skin the audits read a hand on its region with (`AutoMovieMotionHumanAuditTangle.BUILT`) when absent. */
  disc?: number;

  /** The arm's segments that lie on a bone of the same body over the hold (a self-hug's forearm on the other forearm); none when absent. */
  rests?: readonly { part: "upperArm" | "lowerArm"; on: string }[];

  /** The arm's segments that hold one object with the other arm of its group (a racket's or a club's two hands), over the action as they close on it, hold it and part from it: each pair of them, one each arm's, is the grasp's contact and not a collision; clearance against the body stays. None when absent. */
  grasp?: readonly ("upperArm" | "lowerArm" | "hand")[];
  /**
   * The hand's world rotation on the way, for a hand that holds an object
   * whose attitude matters (a glass kept upright), solved at the wrist on the
   * arm the blend places (`HumanHandAttitude.held`); the blend when absent.
   * Read only between the ends, it must meet the held end's hand at weight
   * 0 and the goal's at 1, or the hand steps as the carry leaves or joins.
   *
   * @param posture The posture so far at this second.
   * @param seconds Seconds since the action's start.
   * @param hand The hand's world rotation the blend gives.
   * @param start The hand's world rotation the held end (weight 0) shows at this second.
   * @param end The hand's world rotation the goal's end (weight 1) shows at this second: a planned arm's own at the hold's nearer edge, else the goal as its fit reaches it.
   * @param weight The carry's weight at this second, in (0, 1).
   * @returns The hand's world rotation.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is solved, where, and the default.
   * @evidence contracts/development/implementation.md#principled-implementation A blend of the wrist's angles does not hold a world attitude, since the forearm turns under it; solving the hand on the arm as carried does.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One member read once per evaluated second by `carried`.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Neither end is touched, so the carry still starts at the held angles and arrives at the goal.
   * @evidence contracts/development/implementation.md#efficient-algorithms An interior carried write retains all three actual end-hand observations and invokes this attitude callback once before the native held solve; endpoint writes avoid these unnecessary observations.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The enclosing write shares its explicit same-body FK/ROM metadata across actual hand observations and held solve; the attitude callback receives only original numeric rotations and weight, with no world-attitude result cache.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The primitive owns this optional callback until release; its invocation returns one rotation and receives no metadata reader, process or retained query history.
   */
  attitude?(
    posture: IHumanPosture,
    seconds: number,
    hand: IAutoMovieQuaternion,
    start: IAutoMovieQuaternion,
    end: IAutoMovieQuaternion,
    weight: number,
  ): IAutoMovieQuaternion;
}


