import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { IAutoMovieMotionTarget } from "../../IAutoMovieMotionTarget";
import type { IAutoMovieMotionHumanLieDown } from "../floor/IAutoMovieMotionHumanLieDown";
import type { IAutoMovieMotionHumanBalance } from "../law/IAutoMovieMotionHumanBalance";

/**
 * A body support: a hand or foot taking the body's weight on a place.
 *
 * @template Chain The chain every method returns; the chain implements this
 *   interface.
 */
export interface IAutoMovieMotionHumanSupport<Chain> {
  /**
   * Moving the body's weight across a sequence of supports: each stance's
   * contacts (`IAutoMovieMotionHumanSupport.IStance`) solved into one static
   * key posture, and the body carried from key to key with every new contact
   * placed and bearing before any contact the next stance lacks lets go.
   *
   * @param params The `balance`, `stances`, `on` and `assist` of
   *   `IAutoMovieMotionHumanSupport.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  support(params: IAutoMovieMotionHumanSupport.IParams, anchor?: string): Chain;
}

/** The parameter types of the Support methods. */
export namespace IAutoMovieMotionHumanSupport {
  /**
   * A support preset: the stances a row of `support` fixes, so a movement over
   * one surface is data over the one planner.
   * `AutoMovieMotionHumanSupport.SCRAMBLE` and `SLIDE_OFF` are its data.
   */
  export interface IPreset {
    /** The stances in order, as `IAutoMovieMotionHumanSupport.IParams.stances`. */
    stances: readonly IAutoMovieMotionHumanSupport.IStance[];
  }

  /**
   * The parameters a support row leaves to the composition: those of `support`
   * without the stances its preset fixes.
   */
  export type IRow = Omit<IAutoMovieMotionHumanSupport.IParams, "stances">;
}

/**
 * Moving the body's weight across a sequence of supports: each stance's
 * contacts (`IAutoMovieMotionHumanSupport.IStance`) solved into one static key
 * posture, and the body carried from key to key with every new contact placed
 * and bearing before any contact the next stance lacks lets go.
 *
 * A key posture is the static multi-contact posture nearest the posture the
 * body enters with that puts every contact on its target, keeps the centre of
 * mass over the hull of the bearing contacts and every joint in its range
 * (`HumanBodyFit`, Bouyarmane and Kheddar 2010; Escande, Kheddar and Miossec
 * 2013), solved from the key before it, as a planner grows its next stance from
 * its parent. Between two stances the planner solves a third key on the union
 * of both stances' contacts, so the new contacts bear before the old ones
 * release (Escande et al.'s transition configurations, in both stances at
 * once), and the body moves between keys on a minimum-jerk course in joint
 * space (Flash and Hogan 1985), each joint on its own range
 * (`blendHumanJoint`). A part that bears in two stances in a row on different
 * targets steps: the planner first solves a key without its old contact, the
 * part over the middle of its step lifted a stepping limb's rise (`crawl.LIFT`)
 * clear of the higher end and bearing on nothing, then the transition key with
 * it set down, so a contact is broken before it is made again. The joint-space
 * course currently pins one common contact; it does not yet enforce all of the
 * other held contacts between keys. A contact no key posture reaches is refused
 * with the contact, its stance and the miss.
 *
 * A bearing foot lies on the floor at its toes' joint with its toes flat; a
 * bearing hand lies on its palm laid flat on the surface; on the floor a knee
 * bears on its shin and the trunk on its colliders, resting on their lowest
 * points, and on a raised surface each lays its own skin flat on it (the knee,
 * the seat, the upper back or the abdomen); a contact held across stances
 * without a place stays where it was first laid; a gripping hand closes on its
 * target at its grip. Each move takes `SECONDS` (provisional: no study of the
 * timing of a general support sequence was located) or its stance's own, a
 * step's third of it each to lift, to set down and to settle. Events: `lift<i>`
 * when the move into stance `i` has its stepping parts at the top of their
 * swing, `bear<i>` when it has placed its new contacts, `stance<i>` (or the
 * stance's own event) when stance `i` is held alone.
 */
export namespace IAutoMovieMotionHumanSupport {
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

    /** The stances, in order; the body enters the first from where it stands. */
    stances: readonly IAutoMovieMotionHumanSupport.IStance[];

    /**
     * The surface a row's `on` contacts touch: a box's top to vault, a ledge to
     * scramble onto, a table's edge to slide off; refused where a contact names
     * `on` and this is absent.
     */
    on?: IAutoMovieMotionTarget;

    /**
     * A paired support whose two matching hand contacts move through one shared
     * course.
     */
    assist?: IAssist;
  }

  /** The paired support's role in an assisted rise. */
  export type AssistRole = "helper" | "helped";

  /** Partners and the hand used to take weight during an assisted rise. */
  export interface IAssist {
    /** The role this performer takes. */
    role: AssistRole;

    /** The other role's subject id. */
    partner: string;

    /** The hand each participant contributes to the clasp. */
    hand: AutoMovieHumanSide;
  }

  /** One stance: the contacts the body rests on at once. */
  export interface IStance {
    /** The contacts, at least one. */
    contacts: readonly IAutoMovieMotionHumanSupport.IContact[];

    /** Seconds the move into this stance takes; the planner's own when absent. */
    seconds?: number;

    /**
     * The heading the stance faces, degrees about the vertical from the heading
     * the body enters with: half a turn after a roll from the back to the
     * front; the entry's when absent.
     */
    turn?: number;

    /**
     * The event the stance is held at, unique in the sequence; `stance<i>` when
     * absent.
     */
    event?: string;

    /**
     * The posture the stance's solve stays nearest, by its whole body's tilt
     * and its joints (degrees); the posture the body enters with when absent. A
     * stance without targets is shaped by it: kneeling, squatting, standing.
     */
    prefer?: IAutoMovieMotionHumanLieDown.IPose;

    /**
     * The parts the stance lets go free: each lifts off the contact it bore by
     * in the stance before and hangs as the stance's posture carries it,
     * bearing on nothing, instead of holding its last place until another
     * contact of its limb replaces it; none when absent.
     */
    free?: readonly IAutoMovieMotionHumanSupport.Part[];

    /**
     * The least height of both shoulder joints, world metres, in the lift keys
     * of a step into this stance, where the stepping feet bear nothing and the
     * body hangs on its hands: a crutch walker's pushing arms keep the axillae
     * above the crutches' pads; no height when absent.
     */
    shoulders?: number;
  }

  /** One contact of a stance. */
  export interface IContact {
    /** The part. */
    part: IAutoMovieMotionHumanSupport.Part;

    /**
     * Where it touches: a floor point, a prop's surface, a person's region;
     * `on`, the surface the action is given
     * (`IAutoMovieMotionHumanSupport.IParams.on`), the part placed on its own
     * side of it by the body's own width; anywhere on the floor the stance's
     * solve lays it when absent, so a stance can name the parts it rests on
     * without a place.
     */
    target?: IAutoMovieMotionTarget | "on";

    /**
     * How it touches: `bear`, laid on a surface whose up it faces and pressed
     * by the body's weight; `grip`, a hand closed on a handle, holding as well
     * as pressing.
     */
    kind: "bear" | "grip";

    /**
     * How far in from the edge of the action's surface a contact on it (`on`)
     * lies along the heading, as a share of the forearm and hand's length:
     * positive onto a surface ahead of the body, negative onto one behind it;
     * at the edge when absent.
     */
    inset?: number;

    /**
     * Whether the part is set down anew in this stance, stepping from where it
     * bore before to where the stance's solve lays it; a part that bears on
     * from the stance before stays where it bore when absent.
     */
    step?: boolean;
  }

  /**
   * A body part that bears: a foot on its ball and toes, a hand on its palm, a
   * knee on the shin's top, the seat on the buttocks, the back or the front of
   * the trunk lying on it.
   */
  export type Part =
    | "leftFoot"
    | "rightFoot"
    | "leftHand"
    | "rightHand"
    | "leftKnee"
    | "rightKnee"
    | "seat"
    | "back"
    | "front";
}
