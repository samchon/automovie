import type { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { AutoMovieHumanSide } from "../human/AutoMovieHumanSide";
import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieHumanLimbGoal } from "./IAutoMovieHumanLimbGoal";
import type { IAutoMovieMotionClock } from "./IAutoMovieMotionClock";
import type { IAutoMovieMotionHumanActionPlan } from "./IAutoMovieMotionHumanActionPlan";
import type { IAutoMovieMotionHumanArmAngles } from "./IAutoMovieMotionHumanArmAngles";
import type { IAutoMovieMotionHumanArmPlanned } from "./IAutoMovieMotionHumanArmPlanned";
import type { IAutoMovieMotionHumanBalance } from "./IAutoMovieMotionHumanBalance";
import type { IAutoMovieMotionHumanBody } from "./IAutoMovieMotionHumanBody";
import type { IAutoMovieMotionHumanContactWindow } from "./IAutoMovieMotionHumanContactWindow";
import type { IAutoMovieMotionHumanHeldUse } from "./IAutoMovieMotionHumanHeldUse";
import type { IAutoMovieMotionHumanPosture } from "./IAutoMovieMotionHumanPosture";
import type { IAutoMovieMotionHumanTarget } from "./IAutoMovieMotionHumanTarget";
import type { IAutoMovieMotionHumanTouchContacts } from "./IAutoMovieMotionHumanTouchContacts";
import type { IAutoMovieMotionHumanTouchEffector } from "./IAutoMovieMotionHumanTouchEffector";
import type { IAutoMovieMotionHumanTouchEffectors } from "./IAutoMovieMotionHumanTouchEffectors";
import type { IAutoMovieMotionHumanTouchForm } from "./IAutoMovieMotionHumanTouchForm";
import type { IAutoMovieMotionHumanTouchSite } from "./IAutoMovieMotionHumanTouchSite";
import type { IAutoMovieMotionManner } from "./IAutoMovieMotionManner";
import type { IAutoMovieMotionTarget } from "./IAutoMovieMotionTarget";

/**
 * Touching a partner: a touch, a high five, a kiss and a leg touch.
 *
 * The family carries its fixed-parameter touches as presets, data on
 * `AutoMovieMotionHumanTouch`: the touch kinds `TAP`, `PAT`, `STROKE`, `RUB`,
 * `PRESS`, `SQUEEZE`, `HOLD` and `SCRATCH`, read by the rows of
 * `HumanTouchRows`; the emblems `EMBLEM_SALUTE`, `EMBLEM_HAND_ON_HEART`,
 * `EMBLEM_BLOWN_KISS_SEND`, `EMBLEM_COVER_MOUTH` and `EMBLEM_COVER_EARS`, read
 * by the rows of `HumanEmblem`; the social touches `SOCIAL_SHOULDER_PAT`,
 * `SOCIAL_COMFORT` and `SOCIAL_FIRM_PRESS`, read by the rows of `HumanSocial`;
 * and `PARTNER_DANCE_HOLD`, read by the row of `HumanPartner`. A preset adds no
 * method and is spread into the parameters of `touch`; each row and its preset
 * share one value.
 *
 * A method here is a method of `AutoMovieMotionHumanChain` when its name is in
 * `AutoMovieMotionHumanActionName`. Any other member is a registered law or
 * row: pass it in `laws: [...]` to the performance, taking it from
 * `AutoMovieMotionHumanTouch` or from the row namespace of the family, and
 * append it with `chain.registered("<name>", params)`. A member that is a
 * function, a reader or a layer says so in its own comment.
 *
 * @template Chain The chain every method returns; the chain implements this
 *   interface.
 */

/** The parameter types of the Touch methods. */
/**
 * A touch while standing: one hand, or both, laid on a region of a partner or
 * of the performer's own body and moved on it by a kind of social touch (Jung
 * et al. 2017): a tap, a pat, a stroke, a rub, a press, a squeeze, a hold or a
 * scratch. It is the one law of the affectionate and social touch family (a pat
 * on the head, a tap on the shoulder, a hand on the arm) and of the
 * self-directed family (a belly pat, a nape rub, a forearm scratch, a self hug,
 * hands over the ears), each item a row of `(effector, region, kind, timing)`.
 *
 * The hand reaches the region in the free-space transport time of the distance
 * (`motionHumanTiming.transport`), repeats the kind's stroke `count` times
 * (`AutoMovieMotionHumanTouchForm.FORMS`), dwells for the hold and goes back in
 * the reach's time; the manner's tempo scales every span and its extent the
 * lift and the travel. The feet stay planted and the body keeps the entry
 * posture. A region of the performer's limbs is read on the entry pose, so it
 * must ride a limb the touch does not move, except a region on the other arm: a
 * person scratching or patting their own forearm first brings it up, so that
 * arm is carried on the same envelope to its forearm held across the front of
 * the waist, palm down, and the region is read on the arm held there
 * (`present`). A region above the shoulder that the standing arm does not reach
 * (a taller person's cheek) is risen to on the toes, and a region beyond the
 * standing arm (a thigh slapped while standing) is leaned into, each as far as
 * the hand needs (`AutoMovieMotionHumanTouchStance`), a leg's region then read
 * on the legs as the lean leaves them; one still out of reach at the lean's
 * limit is refused. A seated or carried body does not rise.
 *
 * Events: the phrase instants (`ready` on the region, `strokeStart` to
 * `strokeEnd` the repetitions, `relax` leaving). A touch may be cut before it
 * arrives or from `relax` on, into standing, a walk, a gesture or another
 * touch, the declined handshake's rule.
 */
export namespace IAutoMovieMotionHumanTouch {
  /**
   * The parameters of the mutual `hug` and `shoulderClasp` rows: the nominal
   * touch dwell.
   */
  export interface IHold {
    /** The nominal touch dwell, seconds; 1 when absent, a brief greeting. */
    hold?: number;
  }
  /** The `touch` parameters a preset fixes: `kind`. */
  export type ITouchKindPreset = Pick<
    IAutoMovieMotionHumanTouch.IParams,
    "kind"
  >;

  /**
   * The `touch` parameters a preset fixes: `target`, `effector`, `kind`,
   * `hand`, `elbow`.
   */
  export type ITouchTargetEffectorKindHandElbowPreset = Pick<
    IAutoMovieMotionHumanTouch.IParams,
    "target" | "effector" | "kind" | "hand" | "elbow"
  >;

  /**
   * The `touch` parameters a preset fixes: `target`, `effector`, `kind`,
   * `hand`.
   */
  export type ITouchTargetEffectorKindHandPreset = Pick<
    IAutoMovieMotionHumanTouch.IParams,
    "target" | "effector" | "kind" | "hand"
  >;

  /**
   * The `touch` parameters a preset fixes: `target`, `effector`, `kind`,
   * `hold`.
   */
  export type ITouchTargetEffectorKindHoldPreset = Pick<
    IAutoMovieMotionHumanTouch.IParams,
    "target" | "effector" | "kind" | "hold"
  >;

  /**
   * The `touch` parameters a preset fixes: `target`, `other`, `effector`,
   * `kind`, `hand`.
   */
  export type ITouchTargetOtherEffectorKindHandPreset = Pick<
    IAutoMovieMotionHumanTouch.IParams,
    "target" | "other" | "effector" | "kind" | "hand"
  >;

  /** The `touch` parameters a preset fixes: `effector`, `kind`, `count`. */
  export type ITouchEffectorKindCountPreset = Pick<
    IAutoMovieMotionHumanTouch.IParams,
    "effector" | "kind" | "count"
  >;

  /** The `touch` parameters a preset fixes: `effector`, `kind`, `hold`. */
  export type ITouchEffectorKindHoldPreset = Pick<
    IAutoMovieMotionHumanTouch.IParams,
    "effector" | "kind" | "hold"
  >;

  /** The `touch` parameters a preset fixes: `effector`, `kind`, `manner`. */
  export type ITouchEffectorKindMannerPreset = Pick<
    IAutoMovieMotionHumanTouch.IParams,
    "effector" | "kind" | "manner"
  >;

  /** The `touch` parameters a preset fixes: `effector`, `kind`, `hold`, `hand`. */
  export type ITouchEffectorKindHoldHandPreset = Pick<
    IAutoMovieMotionHumanTouch.IParams,
    "effector" | "kind" | "hold" | "hand"
  >;

  /**
   * How a touch's arms hold on their regions: `relaxed`, the elbow never
   * locked, or `straight`, the elbow locked and the arm's whole length
   * reached.
   */
  export type Arms = "relaxed" | "straight";

  /** Parameters. */
  export interface IParams {
    /**
     * A balancing shift (`IAutoMovieMotionHumanBalance`): one closed-form shift
     * of its part, scaled by its weight between its two event-named instants,
     * each field absent taking the law's recommendation. Absent, none: the
     * posture is the law's own kinematic one with no balance shift or
     * centre-of-mass reading.
     */
    balance?: IAutoMovieMotionHumanBalance;

    /**
     * The site touched on a person, the performer, a prop or another target
     * admitted by the scene.
     */
    target: IAutoMovieMotionTarget;

    /**
     * Follow a moving prop's site from where it was at the start of the action.
     * Use `"observed"` with a prop target and one bare hand. The reach aims at
     * the initial site and corrects toward the site's sampled world position as
     * it moves. The played stroke end refuses if the hand misses its requested
     * position by more than 0.01 metres. Omit this setting to use the touch
     * law's usual planning for the chosen target.
     */
    tracking?: "observed";

    /** The kind; `pat` when absent. */
    kind?: IAutoMovieMotionHumanTouchForm.Kind;

    /**
     * The part of the hand; the palm when absent. `forefinger` is the end of
     * the forefinger of a flat hand held in line with its forearm, the palm
     * turned down, as a salute meets the brow.
     */
    effector?: IAutoMovieMotionHumanTouchEffectors.With;

    /**
     * The hand; when absent, the one whose arm reaches the region with the
     * least strain, or the hand holding `prop` (`touchSide`).
     */
    hand?: AutoMovieHumanSide;

    /**
     * Where on the region the first hand lands (`touchSite`): an offset, a
     * place the seed draws, or the place a rule chooses; the region's own point
     * when absent.
     */
    site?: IAutoMovieMotionHumanTouchSite.ISite;

    /**
     * The subject id of the prop that hand holds, whose point touches in place
     * of the hand part: a cigarette's lit end tapped on an ashtray, a pen's tip
     * on a page. No prop when absent.
     */
    prop?: string;

    /**
     * The held prop's point that touches, one of its affordance ids; required
     * with `prop`.
     */
    point?: string;

    /**
     * With `prop` on a region of the performer's own, the grasp the tool was
     * taken up by for its use (`pickUp`'s `handle` and `use.line`): the stroke
     * holds the tool as that grasp presents it at the region
     * (`HumanGraspUse.presented`, the region as the use's place) and moves only
     * its point, as a razor keeps its angle on the jaw. Absent, the prop's
     * point faces into the region.
     */
    grasp?: IAutoMovieMotionHumanHeldUse.IGrasp;

    /**
     * A miss staged as a touch: the effector passes the region this far off its
     * surface along its normal, in the hand's lengths, at the stroke's full
     * speed, and no contact is declared (a stage slap). A touch that lands when
     * absent.
     */
    clear?: number;

    /**
     * Where the elbow lies while the hand is on the region: `natural`, the
     * place of least strain, or `level`, raised to the shoulder's height so the
     * upper arm is horizontal, as a salute or a hand shading the eyes holds it.
     * `natural` when absent.
     */
    elbow?: "natural" | "level";

    /**
     * How the arms hold while the hands are on their regions: `relaxed`, the
     * elbow never locked, the wrist kept within a share of the arm's length
     * (`touch.REACH`), or `straight`, the elbow locked and the whole arm's
     * length reached, as chest compressions are given with the arms straight
     * and the shoulders over the hands (American Heart Association 2020).
     * `relaxed` when absent.
     */
    arms?: IAutoMovieMotionHumanTouch.Arms;

    /**
     * The other hand's region, touched the same way at the same time; one hand
     * when absent.
     */
    other?: IAutoMovieMotionTarget;

    /**
     * The arms' segments that lie on the performer's own body while the hands
     * are on their regions, as a self-hug's forearms lie on each other and on
     * the chest (`AutoMovieMotionHumanTouchContacts.sided`); none when absent.
     */
    rests?: readonly IAutoMovieMotionHumanTouchContacts.IDeclared[];

    /**
     * Repetitions; 3 for a tap, a pat, a rub or a scratch and 1 otherwise when
     * absent.
     */
    count?: number;

    /**
     * Seconds the hand stays after the repetitions; 0.4, or 1.2 for a press, a
     * squeeze or a hold, when absent.
     */
    hold?: number;

    /**
     * The travel's direction on the region; when absent, `up`, or `across` for
     * a hand on the performer's own region whose travel up and down would sink
     * it into another part of the body (`touchHold.lay`).
     */
    tangent?: IAutoMovieMotionHumanTouchForm.Tangent;

    /** How it is performed. */
    manner?: IAutoMovieMotionManner;
  }

  /** One touch. */
  export interface ITouch {
    /** The body. */
    body: IAutoMovieMotionHumanBody;

    /**
     * A phrase clock: arrive by `ready`, repeat from `strokeStart` to
     * `strokeEnd`, leave from `relax`.
     */
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
     * @param resolution Optional same-body FK metadata borrowed only during
     *   this invocation.
     * @param projection Optional genuine same-body ROM metadata borrowed only
     *   during this invocation.
     * @returns The region's point in world metres and its unit normal, pointing
     *   away from the surface.
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

    /**
     * The effector's stand-off from the region along its normal beyond the
     * skin's pad, metres; 0 when absent.
     */
    standoff?: number;

    /** Factor on the lift and the travel; 1 when absent. */
    extent?: number;

    /**
     * The elbow's bend hint, world, on the entry posture; carried with the
     * root.
     */
    bend: IAutoMovieVector3;

    /**
     * The arm laid on the region at the entry (`laid`), which every second's
     * fit is held to; no reference when absent.
     */
    reference?: NonNullable<IAutoMovieHumanLimbGoal["reference"]>;

    /**
     * What the effector's along axis lies on: the travel's tangent, or `arm`,
     * the direction away from the elbow across the region
     * (`AutoMovieMotionHumanTouchPath.lay`), or `reach`, for an effector that
     * meets its place end on: its facing axis runs from the elbow straight to
     * the place (`AutoMovieMotionHumanTouchPath.reach`) and its along axis lies
     * on the world's up, or `upright`, the world's up as a held vessel stands,
     * the effector facing against `facing`, or `limb`, the long axis of the
     * touched limb (`facing`) square to the region's normal, so a flat hand
     * lies along a curved segment rather than across it; the tangent when
     * absent.
     */
    lay?: "tangent" | "arm" | "reach" | "upright" | "limb";

    /**
     * The hand's rotation the stroke keeps, world, on the entry posture, turned
     * with the posture's heading: a held tool laid as the grasp chosen for its
     * use presents it (`HumanGraspUse.presented`), so only its point moves. The
     * effector is laid by `lay` when absent.
     */
    held?: IAutoMovieQuaternion;

    /**
     * With `upright`, the level world direction the effector faces against
     * (`AutoMovieMotionHumanTouchUpright`); the region's level normal when
     * absent. With `limb`, the touched limb's long axis, world, that the
     * effector's along axis follows; the travel's tangent when absent.
     */
    facing?: IAutoMovieVector3;

    /**
     * With `upright` or `held`, how far the vessel leans toward the region at
     * the face, degrees (`AutoMovieMotionHumanTouchUpright.tip`): the goal
     * holds it so leaned, so the arm is carried toward the arm that holds it at
     * the lips, while the hand's attitude on the way
     * (`AutoMovieMotionHumanDrinkingArm.carried`) carries it as it is laid or
     * held, tipped over the last `TIP` of the carry's progress and righted over
     * the first `TIP` of the way back; no lean when absent.
     */
    lean?: number;

    /**
     * Where the elbow lies while the hand is on the region, which `arm` lays
     * the effector from: the place of least strain (`natural`) or `level` with
     * the shoulder; `natural` when absent.
     */
    elbow?: "natural" | "level";

    /**
     * With `reach`, the elbow's place the effector runs from (`settled`),
     * world, on the entry posture; carried with the root. Read from the body's
     * measures when absent.
     */
    from?: IAutoMovieVector3;

    /** The entry posture the hint was solved on. */
    entry: Pick<IAutoMovieMotionHumanPosture, "root" | "yaw">;

    /**
     * What the hand bears on while it is on the region; no window when absent,
     * nor when a held tool's point touches a person (the tool touches them, not
     * the hand, so the hand's fingers are read against the body like any other
     * part).
     */
    contact?: IAutoMovieMotionHumanContactWindow.Support;

    /**
     * `keep` leaves the fingers as the base holds them, as a hand that grips a
     * prop must; they take the effector's shape when absent.
     */
    fingers?: "keep";

    /**
     * The arm's segments that lie on a person's segment while the hand is on
     * the region, each declared as a contact from `ready` to `relax` (a
     * self-hug's forearm on the other forearm or on the chest); none when
     * absent.
     */
    rests?: readonly IAutoMovieMotionHumanTouchContacts.IRest[];

    /**
     * The arms of a touch with two hands, planned as one trajectory
     * (`IAutoMovieMotionHumanArmPlanned.ITogether`); this arm alone when
     * absent.
     */
    together?: IAutoMovieMotionHumanArmPlanned.ITogether;

    /**
     * The radius about its site the hand may land within on the region, metres:
     * the site's own, or the region's extent; the audit's contact skin when
     * absent.
     */
    disc?: number;
    /**
     * Maximum distance in metres between the hand skin and a held material
     * site.
     */
    skinDistance?: number;

    /**
     * The target region and optional colliders as the initial plan perceives
     * them. A touch of another person or an observed prop follows the sampled
     * site during the reach and hold.
     */
    perceived?: Pick<IAutoMovieMotionHumanTouch.ITouch, "region" | "others">;

    /**
     * The performer's own bone the region rides, for a region of the performer,
     * so a region on the other arm of the touch rides that arm as it is
     * planned.
     */
    on?: AutoMovieHumanoidBone;

    /**
     * Another body's placed colliders the arm keeps clear of at a second
     * (`IAutoMovieHumanLimbGoal.clear`), and the ones it lays the hand on
     * (`IAutoMovieHumanLimbGoal.rests`); none when absent.
     *
     * @param posture The posture written so far in this frame.
     * @param seconds Seconds since the action's start.
     * @param resolution Optional same-body FK metadata borrowed only during
     *   this invocation.
     * @param projection Optional genuine same-body ROM metadata borrowed only
     *   during this invocation.
     * @returns The colliders, placed in the world, kept clear of and rested on.
     */
    others?(
      posture: IAutoMovieMotionHumanPosture,
      seconds: number,
      resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
      projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
    ): Pick<IAutoMovieHumanLimbGoal, "clear" | "rests">;
  }
}
