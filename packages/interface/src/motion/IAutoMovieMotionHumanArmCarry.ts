import type { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import type { AutoMovieHumanSide } from "../human/AutoMovieHumanSide";
import type { IAutoMovieSwivelSeed } from "../pose/IAutoMovieSwivelSeed";
import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieMotionHumanBody } from "./IAutoMovieMotionHumanBody";
import type { IAutoMovieMotionHumanActionPlan } from "./IAutoMovieMotionHumanActionPlan";
import type { IAutoMovieHumanLimbGoal } from "./IAutoMovieHumanLimbGoal";
import type { IAutoMovieMotionHumanPosture } from "./IAutoMovieMotionHumanPosture";
import type { IAutoMovieMotionHumanArmAngles } from "./IAutoMovieMotionHumanArmAngles";
import type { IAutoMovieMotionHumanArmPlanned } from "./IAutoMovieMotionHumanArmPlanned";

/**
 * Arm primitives: a hand surface carried to a target, kept on it and taken
 * back.
 *
 * A target is a frame evaluated at each second on the posture the action has so
 * far (a region of the performer's own trunk, a partner's hand, a prop, a point
 * of the world), so the same row fits every body and follows whatever the
 * target rides on. The hand is an effector goal solved by the arm's inverse
 * kinematics: the goal carries the surface as its contact, so where the arm
 * cannot turn the hand as asked the resolver re-aims the wrist until the
 * surface stays on its point and the rotation gives way
 * (`IAutoMovieHumanLimbGoal.contact`).
 *
 * Between its origin and its target the surface moves on a straight path, or
 * one that bows to the arm's own side when the movement states a curvature, and
 * the hand turns by spherical interpolation, both by one weight, and the
 * fingers go from the relaxed cascade to the target's shape by the same weight
 * (Jeannerod 1984: the hand is shaped during its transport). The origin is held
 * in the performer's own floor frame, so it follows the body.
 */
export namespace IAutoMovieMotionHumanArmCarry {
  /** One arm carried toward a goal. */
  export interface ICarry {
    /** The body. */
    body: IAutoMovieMotionHumanBody;

    /** The arm. */
    side: AutoMovieHumanSide;

    /** Seconds since the action's start from which the arm is written. */
    from: number;

    /** Seconds since the action's start until which the arm is written. */
    to: number;

    /** The angles the arm holds at weight 0. */
    rest: IAutoMovieMotionHumanArmAngles.IAngles;

    /**
     * The angles a planned arm's return ends at, where the arm returns to
     * another arm than it left (the plan's own arm at the span's end); `rest`
     * when absent.
     */
    back?: IAutoMovieMotionHumanArmAngles.IAngles;

    /**
     * The seed of the law's own fit of the hold's first goal (the grasp a law
     * chose by its search): the swivel, branch, forearm twist and admitted arc
     * the planned hold's first instant continues instead of fitting afresh, so
     * the law's search and its course take one solution. The hold's first
     * instant continues est where no reach comes before it, and is fitted on
     * its own otherwise, when absent.
     */
    hold?: IAutoMovieSwivelSeed;

    /**
     * The goal the arm solves to at weight 1.
     *
     * @param posture The posture so far at this second.
     * @param seconds Seconds since the action's start.
     * @param resolution Optional same-body FK metadata borrowed only during
     *   this invocation.
     * @param projection Optional genuine same-body ROM projector borrowed only
     *   during this invocation.
     * @returns The goal.
     */
    goal(
      posture: IAutoMovieMotionHumanPosture,
      seconds: number,
      resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
      projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
    ): IAutoMovieHumanLimbGoal;

    /**
     * How far the arm is from its held angles to its goal.
     *
     * @param seconds Seconds since the action's start.
     * @returns A value in [0, 1].
     */
    weight(seconds: number): number;

    /**
     * The action's instants the arm's whole action is planned over as one
     * trajectory (`AutoMovieMotionHumanArmPlanned.planned`): the reach, the
     * hold on the goal's site and the return, in the clock's instants or as the
     * weight states them (`AutoMovieMotionHumanArmPlanned.stated`); when
     * absent, the deprecated joint-space carry (`carry`), kept until every law
     * states its span.
     */
    span?: IAutoMovieMotionHumanArmPlanned.ISpan;

    /**
     * The goal as a plan perceives it, for a goal on another person: the person
     * read where the performer saw them when the plan starts, so no plan reads
     * ahead of the second it is made at; `goal` when absent.
     *
     * @param posture The posture so far at the second.
     * @param seconds Seconds since the action's start.
     * @param resolution Optional same-body FK metadata borrowed only during
     *   this invocation.
     * @param projection Optional genuine same-body ROM projector borrowed only
     *   during this invocation.
     * @returns The goal.
     */
    perceived?(
      posture: IAutoMovieMotionHumanPosture,
      seconds: number,
      resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
      projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
    ): IAutoMovieHumanLimbGoal;

    /**
     * Whether the planned arm follows its goal from its reach on, a person who
     * moves (by the share of the reach made, then wholly on the hold): the plan
     * with a correction toward `goal` read at each second, moved within the
     * audit's travel bound (`AutoMovieMotionHumanArmFollow.follower`); the plan
     * alone when absent.
     */
    tracked?: boolean;

    /**
     * The law's own speed bound on the planned arm, for a stroke whose hold is
     * its delivery (a punch, a throw, a swing): the fastest the arm's probes
     * may move at each second, metres per second, which the planner admits the
     * course against in place of the pace it reads off a daily reach
     * (`HumanArmTrajectoryLaid`). Absent, that reach pace.
     *
     * @param seconds Seconds since the action's start.
     * @returns Metres per second, positive.
     */
    pace?(seconds: number): number;

    /**
     * The arms planned over the same span as one problem; this arm alone when
     * absent.
     */
    together?: IAutoMovieMotionHumanArmPlanned.ITogether;

    /**
     * The arms planned over the same span on one base, each as a problem of its
     * own: every member is solved on the posture before the group's first
     * member, which shows the others at their rest, so the plans do not depend
     * on the order the arms are written in and two arms raised alike are each
     * other's mirror. For arms that keep to their own sides (a stretch, a
     * winner's two fists): arms whose paths may cross are one problem
     * (`together`). When both are given, `beside` decides.
     */
    beside?: IAutoMovieMotionHumanArmPlanned.ITogether;

    /**
     * The bone of the performer's own body the hand's region rides, for a
     * region of the performer: a region on another arm of the group rides that
     * arm as it is solved.
     */
    on?: AutoMovieHumanoidBone;

    /**
     * The radius about its site the hand's contact may land within on the hold,
     * metres: the site's own, or the region's extent; the contact skin the
     * audits read a hand on its region with
     * (`AutoMovieMotionHumanAuditTangle.BUILT`) when absent.
     */
    disc?: number;
    /**
     * Maximum distance in metres between the hand skin and a held material
     * site.
     */
    skinDistance?: number;

    /**
     * The arm's segments that lie on a bone of the same body over the hold (a
     * self-hug's forearm on the other forearm); none when absent.
     */
    rests?: readonly {
      /** Arm segment resting on another bone of the same body. */
      part: "upperArm" | "lowerArm";
      /** Bone id of the same body on which the arm segment rests. */
      on: string;
    }[];

    /**
     * The arm's segments that hold one object with the other arm of its group
     * (a racket's or a club's two hands), over the action as they close on it,
     * hold it and part from it: each pair of them, one each arm's, is the
     * grasp's contact and not a collision; clearance against the body stays.
     * None when absent.
     */
    grasp?: readonly ("upperArm" | "lowerArm" | "hand")[];
    /**
     * The hand's world rotation on the way, for a hand that holds an object
     * whose attitude matters (a glass kept upright), solved at the wrist on the
     * arm the blend places (`HumanHandAttitude.held`); the blend when absent.
     * Read only between the ends, it must meet the held end's hand at weight 0
     * and the goal's at 1, or the hand steps as the carry leaves or joins.
     *
     * @param posture The posture so far at this second.
     * @param seconds Seconds since the action's start.
     * @param hand The hand's world rotation the blend gives.
     * @param start The hand's world rotation the held end (weight 0) shows at
     *   this second.
     * @param end The hand's world rotation the goal's end (weight 1) shows at
     *   this second: a planned arm's own at the hold's nearer edge, else the
     *   goal as its fit reaches it.
     * @param weight The carry's weight at this second, in (0, 1).
     * @returns The hand's world rotation.
     */
    attitude?(
      posture: IAutoMovieMotionHumanPosture,
      seconds: number,
      hand: IAutoMovieQuaternion,
      start: IAutoMovieQuaternion,
      end: IAutoMovieQuaternion,
      weight: number,
    ): IAutoMovieQuaternion;
  }
}
