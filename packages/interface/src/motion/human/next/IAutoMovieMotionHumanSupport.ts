import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { IAutoMovieMotionTarget } from "../../IAutoMovieMotionTarget";
import type { IAutoMovieMotionHumanLieDown } from "../floor/IAutoMovieMotionHumanLieDown";
import type { IAutoMovieMotionHumanBalance } from "../law/IAutoMovieMotionHumanBalance";

/**
 * A body support: a hand or foot taking the body's weight on a place.
 *
 * @template Chain The chain every method returns; the chain implements this interface.
 * @evidence contracts/development/common.md#meaningful-documentation States the family's shared model and what its methods have in common.
 * @evidence contracts/development/design.md#principled-representation One method per law of the Support family, each taking the law's own parameter type.
 */
export interface IAutoMovieMotionHumanSupport<Chain> {
  /**
   * Moving the body's weight across a sequence of supports: each stance's contacts (`IAutoMovieMotionHumanSupport.IStance`) solved into one static key posture, and the body carried from key to key with every new contact placed and bearing before any contact the next stance lacks lets go.
   *
   * @param params The `balance`, `stances`, `on` and `assist` of `IAutoMovieMotionHumanSupport.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanSupport.support is provided by the chain that implements IAutoMovieMotionHumanSupport.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanSupport.support is provided by the chain that implements IAutoMovieMotionHumanSupport.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanSupport.support is provided by the chain that implements IAutoMovieMotionHumanSupport.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanSupport.support is provided by the chain that implements IAutoMovieMotionHumanSupport.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanSupport.support is provided by the chain that implements IAutoMovieMotionHumanSupport.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanSupport.support is provided by the chain that implements IAutoMovieMotionHumanSupport.
   */
  support(
    params: IAutoMovieMotionHumanSupport.ISupport,
    anchor?: string,
  ): Chain;
}

/**
 * The parameter types of the Support methods.
 */
export namespace IAutoMovieMotionHumanSupport {
  /**
   * The parameters of `support`: `IAutoMovieMotionHumanSupport.IParams` (`actions/IAutoMovieMotionHumanSupport`), the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanSupport.IParams` (`actions/IAutoMovieMotionHumanSupport`): the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanSupport.IParams` (`actions/IAutoMovieMotionHumanSupport`) owns the shape; the alias serves `support` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type ISupport = IAutoMovieMotionHumanSupport.IParams;

  /**
   * A support preset: the stances a row of `support` fixes, so a movement over one surface is data over the one planner. `AutoMovieMotionHumanSupport.SCRAMBLE` and `SLIDE_OFF` are its data.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the preset fixes, which presets use it and how the rows read it.
   * @evidence contracts/development/design.md#principled-representation One required member with the planner's own stances, so a preset fixes exactly that key and the composition gives the rest.
   * @evidence contracts/development/design.md#minimal-and-owned-surface This family owns the preset shape; the scramble and slide-off rows read its data.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the key is named once here instead of an inline pick of the planner's parameters.
   */
  export interface IPreset {
    /** The stances in order, as `IAutoMovieMotionHumanSupport.IParams.stances`. */
    stances: readonly IAutoMovieMotionHumanSupport.IStance[];
  }

  /**
   * The parameters a support row leaves to the composition: those of `support` without the stances its preset fixes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names what a row of `support` still takes.
   * @evidence contracts/development/design.md#principled-representation The planner's parameters less the one key a preset fixes.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Serves the support rows' parameter map.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a named derivation of `IParams`, written once.
   */
  export type IRow = Omit<IAutoMovieMotionHumanSupport.IParams, "stances">;
}

/**
 * Moving the body's weight across a sequence of supports: each stance's
 * contacts (`IAutoMovieMotionHumanSupport.IStance`) solved into one static key posture, and
 * the body carried from key to key with every new contact placed and
 * bearing before any contact the next stance lacks lets go.
 *
 * A key posture is the static multi-contact posture nearest the posture the
 * body enters with that puts every contact on its target, keeps the centre
 * of mass over the hull of the bearing contacts and every joint in its range
 * (`HumanBodyFit`, Bouyarmane and Kheddar 2010; Escande, Kheddar and
 * Miossec 2013), solved from the key before it, as a planner grows its next
 * stance from its parent. Between two stances the planner solves a third key
 * on the union of both stances' contacts, so the new contacts bear before
 * the old ones release (Escande et al.'s transition configurations, in
 * both stances at once), and the body moves between keys on a minimum-jerk
 * course in joint space (Flash and Hogan 1985), each joint on its own range
 * (`blendHumanJoint`). A part that bears in two stances in a row on
 * different targets steps: the planner first solves a key without its old
 * contact, the part over the middle of its step lifted a stepping limb's
 * rise (`crawl.LIFT`) clear of the higher end and bearing on nothing, then
 * the transition key with it set down, so a contact is broken before it is
 * made again. The joint-space course currently pins one common contact;
 * it does not yet enforce all of the other held contacts between keys.
 * A contact no key
 * posture reaches is refused with the contact, its stance and the miss.
 *
 * A bearing foot lies on the floor at its toes' joint with its toes flat; a
 * bearing hand lies on its palm laid flat on the surface; on the floor a
 * knee bears on its shin and the trunk on its colliders, resting on their
 * lowest points, and on a raised surface each lays its own skin flat on it
 * (the knee, the seat, the upper back or the abdomen); a contact held across
 * stances without a place stays where it was first laid; a gripping hand
 * closes on its target at its grip. Each move
 * takes `SECONDS` (provisional: no study of the timing of a general support
 * sequence was located) or its stance's own, a step's third of it each to
 * lift, to set down and to settle. Events: `lift<i>` when the move into
 * stance `i` has its stepping parts at the top of their swing, `bear<i>`
 * when it has placed its new contacts, `stance<i>` (or the stance's own
 * event) when stance `i` is held alone.
 *
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: actions/support.ts (support.plan, context); actions/supportWindows.ts (supportWindows.of, context); chain/HumanChainPosture.ts (HumanChainPosture.support, params); actions/support.ts (support.plan.preference, stance); actions/support.ts (support.plan.seed, stance); actions/support.ts (support.plan, stance).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionTarget, IAutoMovieMotionHumanLieDown.IPose identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanSupport {
  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The member states its meaning.
   * @evidence contracts/development/design.md#principled-representation The stances in order.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One member read by `plan`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No posture is typed.
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

    /** The stances, in order; the body enters the first from where it stands. */
    stances: readonly IAutoMovieMotionHumanSupport.IStance[];

    /** The surface a row's `on` contacts touch: a box's top to vault, a ledge to scramble onto, a table's edge to slide off; refused where a contact names `on` and this is absent. */
    on?: IAutoMovieMotionTarget;

    /** A paired support whose two matching hand contacts move through one shared course. */
    assist?: IAssist;
  }

  /**
   * The paired support's role in an assisted rise.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The helper receives the other person's weight and the helped person moves from seated support to the feet.
   * @evidence contracts/development/design.md#principled-representation Each role has distinct support keys and the roles use the same hand-contact course.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Support uses the role only when an action declares an assisted rise.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The role changes the authored stance, not the reach or refusal allowance.
   */
  export type AssistRole = "helper" | "helped";

  /**
   * Partners and the hand used to take weight during an assisted rise.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the support roles, participating subject and the side of both hands.
   * @evidence contracts/development/design.md#principled-representation The concrete keyed hand course arises from the two rendered bodies; author parameters only identify its participants.
   * @evidence contracts/development/design.md#minimal-and-owned-surface HumanCoupled.helpUp authors the paired roles and the support plan reads them together once.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The action's own contact windows and reach constraints still apply.
   */
  export interface IAssist {
    /** The role this performer takes. */
    role: AssistRole;

    /** The other role's subject id. */
    partner: string;

    /** The hand each participant contributes to the clasp. */
    hand: AutoMovieHumanSide;
  }

  /**
   * One stance: the contacts the body rests on at once.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and default.
   * @evidence contracts/development/design.md#principled-representation A set of contacts and the time the move into it takes.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members, both read by the support law.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No posture is typed: the planner solves it from the contacts.
   */
  export interface IStance {
    /** The contacts, at least one. */
    contacts: readonly IAutoMovieMotionHumanSupport.IContact[];

    /** Seconds the move into this stance takes; the planner's own when absent. */
    seconds?: number;

    /** The heading the stance faces, degrees about the vertical from the heading the body enters with: half a turn after a roll from the back to the front; the entry's when absent. */
    turn?: number;

    /** The event the stance is held at, unique in the sequence; `stance<i>` when absent. */
    event?: string;

    /** The posture the stance's solve stays nearest, by its whole body's tilt and its joints (degrees); the posture the body enters with when absent. A stance without targets is shaped by it: kneeling, squatting, standing. */
    prefer?: IAutoMovieMotionHumanLieDown.IPose;

    /** The parts the stance lets go free: each lifts off the contact it bore by in the stance before and hangs as the stance's posture carries it, bearing on nothing, instead of holding its last place until another contact of its limb replaces it; none when absent. */
    free?: readonly IAutoMovieMotionHumanSupport.Part[];

    /** The least height of both shoulder joints, world metres, in the lift keys of a step into this stance, where the stepping feet bear nothing and the body hangs on its hands: a crutch walker's pushing arms keep the axillae above the crutches' pads; no height when absent. */
    shoulders?: number;
  }

  /**
   * One contact of a stance.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and default.
   * @evidence contracts/development/design.md#principled-representation A part on a target, bearing or gripping.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Five members, all read by the support law.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The target is the shared target union.
   */
  export interface IContact {
    /** The part. */
    part: IAutoMovieMotionHumanSupport.Part;

    /** Where it touches: a floor point, a prop's surface, a person's region; `on`, the surface the action is given (`IAutoMovieMotionHumanSupport.IParams.on`), the part placed on its own side of it by the body's own width; anywhere on the floor the stance's solve lays it when absent, so a stance can name the parts it rests on without a place. */
    target?: IAutoMovieMotionTarget | "on";

    /** How it touches: `bear`, laid on a surface whose up it faces and pressed by the body's weight; `grip`, a hand closed on a handle, holding as well as pressing. */
    kind: "bear" | "grip";

    /** How far in from the edge of the action's surface a contact on it (`on`) lies along the heading, as a share of the forearm and hand's length: positive onto a surface ahead of the body, negative onto one behind it; at the edge when absent. */
    inset?: number;

    /** Whether the part is set down anew in this stance, stepping from where it bore before to where the stance's solve lays it; a part that bears on from the stance before stays where it bore when absent. */
    step?: boolean;
  }

  /**
   * A body part that bears: a foot on its ball and toes, a hand on its palm, a knee on the shin's top, the seat on the buttocks, the back or the front of the trunk lying on it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation A body part that bears: a foot on its ball and toes, a hand on its palm, a knee on the shin's top, the seat on the buttocks, the back or the front of the trunk lying on it.
   * @evidence contracts/development/design.md#principled-representation Closed choices "leftFoot", "rightFoot", "leftHand", "rightHand", "leftKnee", "rightKnee", "seat", "back", "front" distinguish the admitted cases.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: actions/supportContact.ts (supportContact.window, part); actions/supportContact.ts (supportContact.limb, part); actions/supportContact.ts (supportContact.onFloors, parts);floor/getUp.ts (getUp.plan.stances, part); lexicon/HumanSupportRows.ts (on, part).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted literal values are declared here directly; runtime handling remains in supportContact.window.
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
