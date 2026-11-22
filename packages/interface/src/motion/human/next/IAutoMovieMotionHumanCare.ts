import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { AutoMovieHumanoidRegion } from "../../../skeleton/AutoMovieHumanoidRegion";
import type { IAutoMovieMotionTarget } from "../../IAutoMovieMotionTarget";
import type { IAutoMovieMotionHumanHoldInfant } from "../tasks/IAutoMovieMotionHumanHoldInfant";

/**
 * Caring for another person: first aid on a lying or seated partner (#3983) and holding an infant. The first-aid methods append shipped kneel and touch actions to the carer's chain, so they are fitted, refused and checked as those actions are.
 *
 * Compressions follow the American Heart Association 2020 adult guideline: 100 to 120 a minute, 30 compressions to 2 breaths, both palms on the partner's lower sternum, one hand over the other, the arms straight. A pulse is felt for 10 s, the check of AHA 2020 basic life support. The owning constants are `AutoMovieMotionHumanCare.COMPRESSION_CYCLE` and `PULSE_HOLD`.
 *
 * The first-aid methods are helpers over a chain: each takes the chain first and returns it with the actions appended, as the runtime namespace takes it. `holdInfant` is an action law planned by the chain, so it takes the law's parameters and an anchor.
 *
 * @template Chain The chain every method takes and returns.
 * @evidence contracts/development/common.md#meaningful-documentation States the family's shared model, its rhythm and its source.
 * @evidence contracts/development/design.md#principled-representation One method per helper or law of the Care behaviour, each taking one named parameter type.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The compositions the care scenes use and nothing the other families own.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No posture is authored here; the kneel and touch laws fit and refuse each contact.
 */
export interface IAutoMovieMotionHumanCare<Chain> {
  /**
   * Holding an infant taken up before (`pickUp` at its `seat`), standing or seated as the body entered: in the cradle hold, against the shoulder with the other hand patting its back, or feeding it from a bottle in the other hand, optionally rocking it.
   *
   * @param params The `hold`, `prop`, `hand`, `seconds`, `rock`, `pats` and `bottle` of `IAutoMovieMotionHumanHoldInfant.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanCare.holdInfant is provided by the chain that implements IAutoMovieMotionHumanCare.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanCare.holdInfant is provided by the chain that implements IAutoMovieMotionHumanCare.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanCare.holdInfant is provided by the chain that implements IAutoMovieMotionHumanCare.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanCare.holdInfant is provided by the chain that implements IAutoMovieMotionHumanCare.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanCare.holdInfant is provided by the chain that implements IAutoMovieMotionHumanCare.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanCare.holdInfant is provided by the chain that implements IAutoMovieMotionHumanCare.
   */
  holdInfant(
    params: IAutoMovieMotionHumanCare.IHoldInfant,
    anchor?: string,
  ): Chain;

  /**
   * Kneel on both knees beside the partner and stay down for the care that follows, the right knee coming down at the floor point beside the partner, so the knees end against the side of a lying partner rather than a reverse lunge back from it.
   * @param chain The chain the helper appends to; it is returned with the actions added.
   * @param params The `at` of `IAutoMovieMotionHumanCare.IKneelBeside`.
   * @returns The chain with the kneel appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanCare.kneelBeside is provided by the chain that implements IAutoMovieMotionHumanCare.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanCare.kneelBeside is provided by the chain that implements IAutoMovieMotionHumanCare.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanCare.kneelBeside is provided by the chain that implements IAutoMovieMotionHumanCare.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanCare.kneelBeside is provided by the chain that implements IAutoMovieMotionHumanCare.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanCare.kneelBeside is provided by the chain that implements IAutoMovieMotionHumanCare.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanCare.kneelBeside is provided by the chain that implements IAutoMovieMotionHumanCare.
   */
  kneelBeside(chain: Chain, params: IAutoMovieMotionHumanCare.IKneelBeside): Chain;

  /**
   * One cycle of chest compressions: both palms press the partner's sternum, 30 times with the arms straight.
   * @param chain The chain the helper appends to; it is returned with the actions added.
   * @param params The `partner` of `IAutoMovieMotionHumanCare.ICompressions`.
   * @returns The chain with the compressions appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanCare.compressions is provided by the chain that implements IAutoMovieMotionHumanCare.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanCare.compressions is provided by the chain that implements IAutoMovieMotionHumanCare.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanCare.compressions is provided by the chain that implements IAutoMovieMotionHumanCare.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanCare.compressions is provided by the chain that implements IAutoMovieMotionHumanCare.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanCare.compressions is provided by the chain that implements IAutoMovieMotionHumanCare.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanCare.compressions is provided by the chain that implements IAutoMovieMotionHumanCare.
   */
  compressions(chain: Chain, params: IAutoMovieMotionHumanCare.ICompressions): Chain;

  /**
   * Feel the partner's pulse with the fingertips for 10 s.
   * @param chain The chain the helper appends to; it is returned with the actions added.
   * @param params The `partner`, `site` and `side` of `IAutoMovieMotionHumanCare.IPulse`.
   * @returns The chain with the check appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanCare.pulse is provided by the chain that implements IAutoMovieMotionHumanCare.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanCare.pulse is provided by the chain that implements IAutoMovieMotionHumanCare.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanCare.pulse is provided by the chain that implements IAutoMovieMotionHumanCare.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanCare.pulse is provided by the chain that implements IAutoMovieMotionHumanCare.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanCare.pulse is provided by the chain that implements IAutoMovieMotionHumanCare.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanCare.pulse is provided by the chain that implements IAutoMovieMotionHumanCare.
   */
  pulse(chain: Chain, params: IAutoMovieMotionHumanCare.IPulse): Chain;

  /**
   * Press a wound with both palms and hold.
   * @param chain The chain the helper appends to; it is returned with the actions added.
   * @param params The `partner`, `region` and `hold` of `IAutoMovieMotionHumanCare.IPressWound`.
   * @returns The chain with the pressure appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanCare.pressWound is provided by the chain that implements IAutoMovieMotionHumanCare.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanCare.pressWound is provided by the chain that implements IAutoMovieMotionHumanCare.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanCare.pressWound is provided by the chain that implements IAutoMovieMotionHumanCare.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanCare.pressWound is provided by the chain that implements IAutoMovieMotionHumanCare.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanCare.pressWound is provided by the chain that implements IAutoMovieMotionHumanCare.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanCare.pressWound is provided by the chain that implements IAutoMovieMotionHumanCare.
   */
  pressWound(chain: Chain, params: IAutoMovieMotionHumanCare.IPressWound): Chain;
}

/**
 * The parameter types of the Care methods.
 */
export namespace IAutoMovieMotionHumanCare {
  /**
   * The parameters of `holdInfant`: the law's own `IAutoMovieMotionHumanHoldInfant.IParams`, unchanged.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method it parameterises and the law type it aliases unchanged.
   * @evidence contracts/development/design.md#principled-representation An alias: units, frames, defaults and invariants are those the law type states; the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanHoldInfant` owns the type; the alias serves this family's `holdInfant` signature.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast, so `holdInfant` takes the type its law reads.
   */
  export type IHoldInfant = IAutoMovieMotionHumanHoldInfant.IParams;

  /**
   * Where a pulse is felt: the carotid at the neck or the radial at the wrist.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names each site and the body part it is felt at.
   * @evidence contracts/development/design.md#principled-representation The closed set of the two sites the care scenes feel.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only the sites `pulse` reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted literals are the two clinical sites.
   */
  export type IPulseSite = "carotid" | "radial";

  /**
   * The parameters of `kneelBeside`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The member states its meaning.
   * @evidence contracts/development/design.md#principled-representation The floor point the right knee comes down on.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only the member `kneelBeside` reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The point is the shared target type.
   */
  export interface IKneelBeside {
    /** The floor point beside the partner the right knee comes down on. */
    at: IAutoMovieMotionTarget;
  }

  /**
   * The parameters of `compressions`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The member states its meaning.
   * @evidence contracts/development/design.md#principled-representation The partner whose sternum is pressed.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only the member `compressions` reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The partner is a subject name, never a pose.
   */
  export interface ICompressions {
    /** The partner's subject. */
    partner: string;
  }

  /**
   * The parameters of `pulse`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and default.
   * @evidence contracts/development/design.md#principled-representation The partner, the site and the feeling hand.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only the members `pulse` reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The site is the closed clinical set.
   */
  export interface IPulse {
    /** The partner's subject. */
    partner: string;

    /** The carotid or the radial pulse. */
    site: IPulseSite;

    /** The feeling hand; the right when absent. */
    side?: AutoMovieHumanSide;
  }

  /**
   * The parameters of `pressWound`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and units.
   * @evidence contracts/development/design.md#principled-representation The partner, the wounded region and the hold.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only the members `pressWound` reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The region is the body's own region name.
   */
  export interface IPressWound {
    /** The partner's subject. */
    partner: string;

    /** The wounded region. */
    region: AutoMovieHumanoidRegion;

    /** Seconds the pressure is held. */
    hold: number;
  }
}
