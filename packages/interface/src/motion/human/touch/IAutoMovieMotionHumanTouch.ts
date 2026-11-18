import type { IAutoMovieQuaternion } from "../../../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { AutoMovieHumanoidBone } from "../../../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieMotionTarget } from "../../IAutoMovieMotionTarget";
import type { IAutoMovieMotionHumanBody } from "../body/IAutoMovieMotionHumanBody";
import type { IAutoMovieMotionClock } from "../compose/IAutoMovieMotionClock";
import type { IAutoMovieMotionHumanArmAngles } from "../compose/IAutoMovieMotionHumanArmAngles";
import type { IAutoMovieMotionHumanArmPlanned } from "../compose/IAutoMovieMotionHumanArmPlanned";
import type { IAutoMovieMotionHumanTarget } from "../compose/IAutoMovieMotionHumanTarget";
import type { IAutoMovieMotionHumanTouchContacts } from "../compose/IAutoMovieMotionHumanTouchContacts";
import type { IAutoMovieMotionHumanTouchEffector } from "../compose/IAutoMovieMotionHumanTouchEffector";
import type { IAutoMovieMotionHumanTouchForm } from "../compose/IAutoMovieMotionHumanTouchForm";
import type { IAutoMovieMotionManner } from "../compose/IAutoMovieMotionManner";
import type { IAutoMovieMotionHumanHeldUse } from "../handling/IAutoMovieMotionHumanHeldUse";
import type { IAutoMovieMotionHumanActionPlan } from "../law/IAutoMovieMotionHumanActionPlan";
import type { IAutoMovieMotionHumanBalance } from "../law/IAutoMovieMotionHumanBalance";
import type { IAutoMovieMotionHumanContactWindow } from "../law/IAutoMovieMotionHumanContactWindow";
import type { IAutoMovieHumanLimbGoal } from "../posture/IAutoMovieHumanLimbGoal";
import type { IAutoMovieMotionHumanPosture } from "../posture/IAutoMovieMotionHumanPosture";
import type { IAutoMovieMotionHumanTouchEffectors } from "./IAutoMovieMotionHumanTouchEffectors";
import type { IAutoMovieMotionHumanTouchSite } from "./IAutoMovieMotionHumanTouchSite";

/**
 * A touch while standing: one hand, or both, laid on a region of a partner
 * or of the performer's own body and moved on it by a kind of social touch
 * (Jung et al. 2017): a tap, a pat, a stroke, a rub, a press, a squeeze, a
 * hold or a scratch. It is the one law of the affectionate and social touch
 * family (#3284: a pat on the head, a tap on the shoulder, a hand on the
 * arm) and of the self-directed family (#3285: a belly pat, a nape rub, a
 * forearm scratch, a self hug, hands over the ears), each item a row of
 * `(effector, region, kind, timing)`.
 *
 * The hand reaches the region in the free-space transport time of the
 * distance (`AutoMovieMotionHumanTiming.transport`), repeats the kind's
 * stroke `count` times (`AutoMovieMotionHumanTouchForm.FORMS`), dwells for the
 * hold and goes back in the reach's time; the manner's tempo scales every
 * span and its extent the lift and the travel. The feet stay planted and the
 * body keeps the entry posture. A region of the performer's limbs is read on
 * the entry pose, so it must ride a limb the touch does not move, except a
 * region on the other arm: a person scratching or patting their own forearm
 * first brings it up, so that arm is carried on the same envelope to its
 * forearm held across the front of the waist, palm down, and the region is
 * read on the arm held there (`present`). A region above the shoulder that
 * the standing arm does not reach (a taller person's cheek) is risen to on
 * the toes, and a region beyond the standing arm (a thigh slapped while
 * standing) is leaned into, each as far as the hand needs
 * (`AutoMovieMotionHumanTouchStance`), a leg's region then read on the legs
 * as the lean leaves them; one still out of reach at the lean's limit is
 * refused. A seated or carried body does not rise.
 *
 * Events: the phrase instants (`ready` on the region, `strokeStart` to
 * `strokeEnd` the repetitions, `relax` leaving). A touch may be cut before
 * it arrives or from `relax` on, into standing, a walk, a gesture or another
 * touch, the declined handshake's rule.
 *
 * @evidence contracts/development/common.md#meaningful-documentation kind: The kind; `pat` when absent. with: The part of the hand; the palm when absent. `forefinger` is the end of the forefinger of a flat hand held in line with its forearm, the palm turned down, as a salute meets the brow. side: The hand; when absent, the one whose arm reaches the region with the least strain, or the hand holding `prop` (`touchSide`).
 * @evidence contracts/development/design.md#principled-representation kind: The kind; `pat` when absent. with: The part of the hand; the palm when absent. `forefinger` is the end of the forefinger of a flat hand held in line with its forearm, the palm turned down, as a salute meets the brow. side: The hand; when absent, the one whose arm reaches the region with the least strain, or the hand holding `prop` (`touchSide`).
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: chain/HumanChainManual.ts (HumanChainManual.touch, params); touch/touch.ts (touch.plan, context); touch/touchHold.ts (touchHold.lay, context); touch/touchHold.ts (rubbed, elbow); touch/touchSide.ts (touchSide.of, context); compose/AutoMovieMotionHumanDrinkingArm.ts (AutoMovieMotionHumanDrinkingArm.carried, touch).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionTarget, IAutoMovieMotionHumanTouchForm.Kind, IAutoMovieMotionHumanTouchEffectors.With, AutoMovieHumanSide, IAutoMovieMotionHumanTouchSite.ISite, IAutoMovieMotionHumanHeldUse.IGrasp identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanTouch {
  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and default.
   * @evidence contracts/development/design.md#principled-representation The region as the shared target union, the kind and the effector as closed unions, timing as counts and seconds.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The values the plan reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the target union and the manner.
   *
   * HumanPerformanceParams checks supplied parameters against the motions schema before planning; the action law owns reach and contact refusals.
   */
  export interface IParams {
    /**
     * A balancing shift (`IAutoMovieMotionHumanBalance`): one closed-form shift
     * of its part, scaled by its weight between its two event-named instants,
     * each field absent taking the law's recommendation. Absent, none: the
     * posture is the law's own kinematic one with no balance shift or
     * centre-of-mass reading.
     */
    balance?: IAutoMovieMotionHumanBalance;

    /** The region touched: a partner's (`person`) or the performer's own (`self`). */
    target: IAutoMovieMotionTarget;

    /** The kind; `pat` when absent. */
    kind?: IAutoMovieMotionHumanTouchForm.Kind;

    /** The part of the hand; the palm when absent. `forefinger` is the end of the forefinger of a flat hand held in line with its forearm, the palm turned down, as a salute meets the brow. */
    with?: IAutoMovieMotionHumanTouchEffectors.With;

    /** The hand; when absent, the one whose arm reaches the region with the least strain, or the hand holding `prop` (`touchSide`). */
    side?: AutoMovieHumanSide;

    /** Where on the region the first hand lands (`touchSite`): an offset, a place the seed draws, or the place a rule chooses; the region's own point when absent. */
    site?: IAutoMovieMotionHumanTouchSite.ISite;

    /** The subject id of the prop that hand holds, whose point touches in place of the hand part: a cigarette's lit end tapped on an ashtray, a pen's tip on a page. No prop when absent. */
    prop?: string;

    /** The held prop's point that touches, one of its affordance ids; required with `prop`. */
    point?: string;

    /**
     * With `prop` on a region of the performer's own, the grasp the tool was
     * taken up by for its use (`pickUp`'s `handle` and `use.line`): the
     * stroke holds the tool as that grasp presents it at the region
     * (`HumanGraspUse.presented`, the region as the use's place) and moves
     * only its point, as a razor keeps its angle on the jaw. Absent, the
     * prop's point faces into the region.
     */
    grasp?: IAutoMovieMotionHumanHeldUse.IGrasp;

    /** A miss staged as a touch: the effector passes the region this far off its surface along its normal, in the hand's lengths, at the stroke's full speed, and no contact is declared (a stage slap). A touch that lands when absent. */
    clear?: number;

    /**
     * Where the elbow lies while the hand is on the region: `natural`, the
     * place of least strain, or `level`, raised to the shoulder's height so
     * the upper arm is horizontal, as a salute or a hand shading the eyes
     * holds it. `natural` when absent.
     */
    elbow?: "natural" | "level";

    /** The other hand's region, touched the same way at the same time; one hand when absent. */
    other?: IAutoMovieMotionTarget;

    /** The arms' segments that lie on the performer's own body while the hands are on their regions, as a self-hug's forearms lie on each other and on the chest (`AutoMovieMotionHumanTouchContacts.sided`); none when absent. */
    rests?: readonly IAutoMovieMotionHumanTouchContacts.IDeclared[];

    /** Repetitions; 3 for a tap, a pat, a rub or a scratch and 1 otherwise when absent. */
    count?: number;

    /** Seconds the hand stays after the repetitions; 0.4, or 1.2 for a press, a squeeze or a hold, when absent. */
    hold?: number;

    /** The travel's direction on the region; when absent, `up`, or `across` for a hand on the performer's own region whose travel up and down would sink it into another part of the body (`touchHold.lay`). */
    tangent?: IAutoMovieMotionHumanTouchForm.Tangent;

    /** How it is performed. */
    manner?: IAutoMovieMotionManner;
  }

  /**
   * One touch.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning, unit and default.
   * @evidence contracts/development/design.md#principled-representation The phrase clock, the effector, the region as a frame of the posture and the kind with its repetitions.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The members `touch` reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The region is a frame function, so a partner's region and the performer's own fit one member.
   */
  export interface ITouch {
    /** The body. */
    body: IAutoMovieMotionHumanBody;

    /** A phrase clock: arrive by `ready`, repeat from `strokeStart` to `strokeEnd`, leave from `relax`. */
    clock: IAutoMovieMotionClock;

    /** The hand. */
    side: AutoMovieHumanSide;

    /** The arm's angles before and after the touch. */
    rest: IAutoMovieMotionHumanArmAngles.IAngles;

    /** The effector. */
    effector: IAutoMovieMotionHumanTouchEffector.IEffector;

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
      posture: IAutoMovieMotionHumanPosture,
      seconds: number,
      resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
      projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
    ): Pick<IAutoMovieMotionHumanTarget.IPlace, "point" | "normal">;

    /** The kind. */
    kind: IAutoMovieMotionHumanTouchForm.Kind;

    /** How many repetitions; a positive whole number. */
    count: number;

    /** The travel's direction; `up` when absent. */
    tangent?: IAutoMovieMotionHumanTouchForm.Tangent;

    /** The effector's stand-off from the region along its normal beyond the skin's pad, metres; 0 when absent. */
    standoff?: number;

    /** Factor on the lift and the travel; 1 when absent. */
    extent?: number;

    /** The elbow's bend hint, world, on the entry posture; carried with the root. */
    bend: IAutoMovieVector3;

    /** The arm laid on the region at the entry (`laid`), which every second's fit is held to; no reference when absent. */
    reference?: NonNullable<IAutoMovieHumanLimbGoal["reference"]>;

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
    entry: Pick<IAutoMovieMotionHumanPosture, "root" | "yaw">;

    /** What the hand bears on while it is on the region; no window when absent, nor when a held tool's point touches a person (the tool touches them, not the hand, so the hand's fingers are read against the body like any other part). */
    contact?: IAutoMovieMotionHumanContactWindow.Support;

    /** `keep` leaves the fingers as the base holds them, as a hand that grips a prop must; they take the effector's shape when absent. */
    fingers?: "keep";

    /** The arm's segments that lie on a person's segment while the hand is on the region, each declared as a contact from `ready` to `relax` (a self-hug's forearm on the other forearm or on the chest); none when absent. */
    rests?: readonly IAutoMovieMotionHumanTouchContacts.IRest[];

    /** The arms of a touch with two hands, planned as one trajectory (`IAutoMovieMotionHumanArmPlanned.ITogether`); this arm alone when absent. */
    together?: IAutoMovieMotionHumanArmPlanned.ITogether;

    /** The radius about its site the hand may land within on the region, metres: the site's own, or the region's extent; the audit's contact skin when absent. */
    disc?: number;

    /** The region and the colliders as a plan perceives them, for a touch of another person (`IAutoMovieMotionHumanArmCarry.ICarry.perceived`); the hand then follows the person on the hold. */
    perceived?: Pick<IAutoMovieMotionHumanTouch.ITouch, "region" | "others">;

    /** The performer's own bone the region rides, for a region of the performer, so a region on the other arm of the touch rides that arm as it is planned. */
    on?: AutoMovieHumanoidBone;

    /**
     * Another body's placed colliders the arm keeps clear of at a second (`IAutoMovieHumanLimbGoal.clear`), and the ones it lays the hand on (`IAutoMovieHumanLimbGoal.rests`); none when absent.
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
      posture: IAutoMovieMotionHumanPosture,
      seconds: number,
      resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
      projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
    ): Pick<IAutoMovieHumanLimbGoal, "clear" | "rests">;
  }
}
