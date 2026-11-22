import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { IAutoMovieMotionHumanClinch } from "../grappling/IAutoMovieMotionHumanClinch";
import type { IAutoMovieMotionHumanForceResponse } from "../grappling/IAutoMovieMotionHumanForceResponse";
import type { IAutoMovieMotionHumanKuzushi } from "../grappling/IAutoMovieMotionHumanKuzushi";
import type { IAutoMovieMotionHumanLungeGrab } from "../grappling/IAutoMovieMotionHumanLungeGrab";
import type { IAutoMovieMotionHumanArmWrestle } from "../touch/IAutoMovieMotionHumanArmWrestle";

/**
 * Holds, throws, clinches and arm wrestling between two bodies. The grappling law reads no skill: its scene lengths are authored.
 *
 * @template Chain The chain every method returns; the chain implements this interface.
 * @evidence contracts/development/common.md#meaningful-documentation States the family's shared model and what its methods have in common.
 * @evidence contracts/development/design.md#principled-representation One method per law of the Grapple family, each taking the law's own parameter type.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The Grapple laws and nothing the other families own.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each method takes the existing parameter type of its law; nothing is redefined.
 */
export interface IAutoMovieMotionHumanGrapple<Chain> {
  /**
   * Arm wrestle one role of a bout (#3350): the elbow planted on the table's
   * top, the hand clasped with the partner's above it, the struggle, and the
   * pin onto the winner's side. Both roles read one scene, so they agree
   * without a shared draw.
   *
   * @param params The partner, the table, who wins, the bout's seconds and the pin.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the arm wrestle appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the bout's phases and end, how the roles agree, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanGrapple.armWrestle is provided by the chain that implements IAutoMovieMotionHumanGrapple.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanGrapple.armWrestle is provided by the chain that implements IAutoMovieMotionHumanGrapple.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanGrapple.armWrestle is provided by the chain that implements IAutoMovieMotionHumanGrapple.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanGrapple.armWrestle is provided by the chain that implements IAutoMovieMotionHumanGrapple.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanGrapple.armWrestle is provided by the chain that implements IAutoMovieMotionHumanGrapple.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanGrapple.armWrestle is provided by the chain that implements IAutoMovieMotionHumanGrapple.
   */
  armWrestle(
    params: IAutoMovieMotionHumanGrapple.IArmWrestle,
    anchor?: string,
  ): Chain;

  /**
   * Taking a clinch grip on a partner standing within reach and holding it: the two-handed neck tie of Muay Thai (`plum`), or judo's collar and sleeve grip (`collarSleeve`, kumikata).
   *
   * @param params The `balance`, `partner`, `grip`, `hand`, `hold`, `under` and `manner` of `IAutoMovieMotionHumanClinch.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanGrapple.clinch is provided by the chain that implements IAutoMovieMotionHumanGrapple.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanGrapple.clinch is provided by the chain that implements IAutoMovieMotionHumanGrapple.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanGrapple.clinch is provided by the chain that implements IAutoMovieMotionHumanGrapple.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanGrapple.clinch is provided by the chain that implements IAutoMovieMotionHumanGrapple.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanGrapple.clinch is provided by the chain that implements IAutoMovieMotionHumanGrapple.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanGrapple.clinch is provided by the chain that implements IAutoMovieMotionHumanGrapple.
   */
  clinch(params: IAutoMovieMotionHumanGrapple.IClinch, anchor?: string): Chain;

  /**
   * Inputs shared by two actors in a preplanned sport grappling scene.
   *
   * @param params The `role` and `partner` of `IAutoMovieMotionHumanGrapple.IParams`, with those of `IScene`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanGrapple.grapple is provided by the chain that implements IAutoMovieMotionHumanGrapple.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanGrapple.grapple is provided by the chain that implements IAutoMovieMotionHumanGrapple.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanGrapple.grapple is provided by the chain that implements IAutoMovieMotionHumanGrapple.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanGrapple.grapple is provided by the chain that implements IAutoMovieMotionHumanGrapple.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanGrapple.grapple is provided by the chain that implements IAutoMovieMotionHumanGrapple.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanGrapple.grapple is provided by the chain that implements IAutoMovieMotionHumanGrapple.
   */
  grapple(
    params: IAutoMovieMotionHumanGrapple.IGrapple,
    anchor?: string,
  ): Chain;

  /**
   * A broken base (kuzushi): the receiver of a judo throw drawn off balance forward, the whole body tipped about the ankles over the toes while the feet stay on the floor, the stage before a throw carries the body over.
   *
   * @param params The `partner`, `depth` and `hold` of `IAutoMovieMotionHumanKuzushi.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanGrapple.kuzushi is provided by the chain that implements IAutoMovieMotionHumanGrapple.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanGrapple.kuzushi is provided by the chain that implements IAutoMovieMotionHumanGrapple.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanGrapple.kuzushi is provided by the chain that implements IAutoMovieMotionHumanGrapple.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanGrapple.kuzushi is provided by the chain that implements IAutoMovieMotionHumanGrapple.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanGrapple.kuzushi is provided by the chain that implements IAutoMovieMotionHumanGrapple.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanGrapple.kuzushi is provided by the chain that implements IAutoMovieMotionHumanGrapple.
   */
  kuzushi(
    params: IAutoMovieMotionHumanGrapple.IKuzushi,
    anchor?: string,
  ): Chain;

  /**
   * A sudden lunge that closes both hands on a victim's region, as a shambler breaks from its walk: the front foot steps long, the trunk pitches forward and the hands close on the region through the stage.
   *
   * @param params The `partner`, `region` and `side` of `IAutoMovieMotionHumanLungeGrab.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanGrapple.lungeGrab is provided by the chain that implements IAutoMovieMotionHumanGrapple.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanGrapple.lungeGrab is provided by the chain that implements IAutoMovieMotionHumanGrapple.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanGrapple.lungeGrab is provided by the chain that implements IAutoMovieMotionHumanGrapple.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanGrapple.lungeGrab is provided by the chain that implements IAutoMovieMotionHumanGrapple.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanGrapple.lungeGrab is provided by the chain that implements IAutoMovieMotionHumanGrapple.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanGrapple.lungeGrab is provided by the chain that implements IAutoMovieMotionHumanGrapple.
   */
  lungeGrab(
    params: IAutoMovieMotionHumanGrapple.ILungeGrab,
    anchor?: string,
  ): Chain;

  /**
   * A partner's response to a pull through grips (#3439), the outcomes of `perturb` a sustained force decides: `resist`, `yield` and `thrown`.
   *
   * @param params The `by`, `fulcrum` and `on` of `IAutoMovieMotionHumanForceResponse.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanGrapple.forceResponse is provided by the chain that implements IAutoMovieMotionHumanGrapple.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanGrapple.forceResponse is provided by the chain that implements IAutoMovieMotionHumanGrapple.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanGrapple.forceResponse is provided by the chain that implements IAutoMovieMotionHumanGrapple.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanGrapple.forceResponse is provided by the chain that implements IAutoMovieMotionHumanGrapple.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanGrapple.forceResponse is provided by the chain that implements IAutoMovieMotionHumanGrapple.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanGrapple.forceResponse is provided by the chain that implements IAutoMovieMotionHumanGrapple.
   */
  forceResponse(
    params: IAutoMovieMotionHumanGrapple.IForceResponse,
    anchor?: string,
  ): Chain;
}

/**
 * The parameter types of the Grapple methods.
 */
export namespace IAutoMovieMotionHumanGrapple {
  /**
   * The parameters of `armWrestle`: `IAutoMovieMotionHumanArmWrestle.IParams`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanArmWrestle.IParams`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanArmWrestle.IParams` owns the shape; the alias serves `armWrestle` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast, so `armWrestle` takes the type its law reads.
   */
  export type IArmWrestle = IAutoMovieMotionHumanArmWrestle.IParams;

  /**
   * The parameters of `clinch`: the law's own `IAutoMovieMotionHumanClinch.IParams`, unchanged.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method it parameterises and the law type it aliases unchanged.
   * @evidence contracts/development/design.md#principled-representation An alias: units, frames, defaults and invariants are those the law type states; the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanClinch` owns the type; the alias serves this family's `clinch` signature.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast, so `clinch` takes the type its law reads.
   */
  export type IClinch = IAutoMovieMotionHumanClinch.IParams;

  /**
   * The parameters of `grapple`: the grappling law's own `IAutoMovieMotionHumanGrapple.IParams` (imported as `IAutoMovieMotionHumanGrapple`), unchanged.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method it parameterises and the law type it aliases unchanged, with its import name.
   * @evidence contracts/development/design.md#principled-representation An alias: units, frames, defaults and invariants are those the law type states; the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The grappling folder's `IAutoMovieMotionHumanGrapple` owns the type; the alias serves this family's `grapple` signature.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast, so `grapple` takes the type its law reads.
   */
  export type IGrapple = IAutoMovieMotionHumanGrapple.IParams;

  /**
   * The parameters of `kuzushi`: the law's own `IAutoMovieMotionHumanKuzushi.IParams`, unchanged.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method it parameterises and the law type it aliases unchanged.
   * @evidence contracts/development/design.md#principled-representation An alias: units, frames, defaults and invariants are those the law type states; the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanKuzushi` owns the type; the alias serves this family's `kuzushi` signature.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast, so `kuzushi` takes the type its law reads.
   */
  export type IKuzushi = IAutoMovieMotionHumanKuzushi.IParams;

  /**
   * The parameters of `lungeGrab`: the law's own `IAutoMovieMotionHumanLungeGrab.IParams`, unchanged.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method it parameterises and the law type it aliases unchanged.
   * @evidence contracts/development/design.md#principled-representation An alias: units, frames, defaults and invariants are those the law type states; the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanLungeGrab` owns the type; the alias serves this family's `lungeGrab` signature.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast, so `lungeGrab` takes the type its law reads.
   */
  export type ILungeGrab = IAutoMovieMotionHumanLungeGrab.IParams;

  /**
   * The parameters of `forceResponse`: the law's own `IAutoMovieMotionHumanForceResponse.IParams`, unchanged.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method it parameterises and the law type it aliases unchanged.
   * @evidence contracts/development/design.md#principled-representation An alias: units, frames, defaults and invariants are those the law type states; the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanForceResponse` owns the type; the alias serves this family's `forceResponse` signature.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast, so `forceResponse` takes the type its law reads.
   */
  export type IForceResponse = IAutoMovieMotionHumanForceResponse.IParams;
}

/**
 * Inputs shared by two actors in a preplanned sport grappling scene. The
 * scene is one law and one parameter set for judo, wrestling, MMA mat work
 * and sumo: a paired clock of reach, take, release and rest beats whose
 * length is `seconds`, and an authored outcome. The scene takes 3 to 6 s
 * at the lengths on `Kind`; no skill or strength
 * is read. A kind is a staging, not a rulebook: the award is not inferred
 * from the pose.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States that both roles share one authored scene.
 * @evidence contracts/development/design.md#principled-representation A closed scene kind and explicit staged outcome separate choreography from partner identity.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Exposes the shared scene settings and the settings of each action role.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Neither the venue nor the rulebook's award is inferred from a pose.
 */
export namespace IAutoMovieMotionHumanGrapple {
  /**
   * Staged entries and mat exchanges distinguished by their displayed movement.
   * The sumo bouts crouch at the shikiri lines, charge at the tachiai and end
   * with a push out of the ring (`oshiDashi`), a belt-grip force-out
   * (`yoriKiri`) or an overarm belt throw (`uwateNage`).
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each literal names one selectable judo, wrestling or mat scene.
   * @evidence contracts/development/design.md#principled-representation Closed scene kinds select the named staging rows and their corresponding support movements.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The scene input uses these fourteen names to select its choreography.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Scene kind and scene outcome are separate inputs.
   */
  export type Kind =
    /** Judo shoulder throw, 3.5 s by default. */
    | "seoiNage"
    /** Judo hip throw, 3.8 s. */
    | "oGoshi"
    /** Judo major outer reap, 3.4 s. */
    | "oSotoGari"
    /** Judo forward foot sweep timed to the step, the quickest scene, 3 s. */
    | "deAshiHarai"
    /** Wrestling single-leg takedown, 3.8 s. */
    | "singleLeg"
    /** Wrestling double-leg takedown, 3.6 s. */
    | "doubleLeg"
    /** Greco-Roman upper-body throw, 3.8 s. */
    | "grecoRoman"
    /** Judo hold on the mat, 5 s. */
    | "judoHold"
    /** Wrestling fall to the back, 5 s. */
    | "wrestlingFall"
    /** Mat guard pass, the longest scene, 6 s. */
    | "guardPass"
    /** MMA reset after a mat exchange, 4.2 s. */
    | "mmaReset"
    /** Sumo push out, 4.5 s: the crouch at the shikiri lines 0.7 m apart to 22 % of the scene, the tachiai charge to 32 %, a drive of 2.1 m in 0.35 m steps over the 4.55 m ring to 82 % (`grappleSumo.LINES`, `RING`, `DRIVE`, `STEP`, `SHIKIRI`, `TACHIAI`, `FINISH`; the lengths are provisional). The roots meet 0.3 stature apart, at arm's length. */
    | "oshiDashi"
    /** Sumo belt-grip force-out, 5 s, timed and driven as `oshiDashi`; the roots meet 0.22 stature apart, chest to chest. */
    | "yoriKiri"
    /** Sumo overarm belt throw, 4 s, timed as `oshiDashi`; the roots meet 0.22 stature apart. */
    | "uwateNage";

  /**
   * The two parts of a scene played on the same clock.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The initiator supplies the moving hand goals and the receiver supplies their partner-relative frames.
   * @evidence contracts/development/design.md#principled-representation Each actor plays one of two distinct position and contact schedules.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two roles are sufficient for the paired composition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Actor identities are bound separately from their chosen roles.
   */
  export type Role = "initiator" | "receiver";

  /**
   * Whether the planned movement settles or is interrupted and released.
   *
   * @evidence contracts/development/common.md#meaningful-documentation A complete scene proceeds to its selected finish and a denied scene returns to standing.
   * @evidence contracts/development/design.md#principled-representation The two outcomes select the shared completion or interruption path.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One authored outcome is shared by both roles.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A contact distance or a score never chooses the outcome.
   */
  export type Outcome = "complete" | "denied";

  /**
   * Settings common to both roles.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each input describes its staging meaning and default.
   * @evidence contracts/development/design.md#principled-representation A named scene, lead side, selected branch and per-scene duration.
   * @evidence contracts/development/design.md#minimal-and-owned-surface These four settings are the inputs common to the two actors.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The outcome is an input, independent of body dimensions or performance sampling.
   */
  export interface IScene {
    /** Which authored scene to stage. */
    kind: Kind;

    /** Author's result, `complete` when absent. */
    outcome?: Outcome;

    /** Lead side of the staged scene, right when absent. */
    side?: AutoMovieHumanSide;

    /** Total scene duration in seconds, positive and finite. Absent, each kind takes its own length listed on `Kind` (`grappleStances.seconds`, `grappleSumo.seconds`); every one is an authored staging length, provisional: no study of a bout's phase times was read. The phases keep their shares of it, so a longer scene is the same beats slower. */
    duration?: number;
  }

  /**
   * One actor's action in a shared grappling scene.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the role and the other actor.
   * @evidence contracts/development/design.md#principled-representation The scene is common, while role and reciprocal subject identify this actor's part.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The motion law consumes the shared settings and the two actor-specific fields.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No participant placement or score is embedded in the inputs.
   */
  export interface IParams extends IScene {
    /** The actor's part in the paired scene. */
    role: Role;

    /** The other actor's subject in the same performance. */
    partner: string;
  }
}
