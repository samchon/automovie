import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { IAutoMovieMotionHumanChain } from "../IAutoMovieMotionHumanChain";
import type { IAutoMovieMotionHumanFirefight } from "../tasks/IAutoMovieMotionHumanFirefight";

/**
 * Fighting a fire. A nozzle and a backup role extinguish, run a hose line and beat flames; a victim whose clothes burn stops, drops and rolls. The durations are provisional.
 *
 * @template Chain The chain every method returns; the chain implements this interface.
 * @evidence contracts/development/common.md#meaningful-documentation States the family's shared model and what its methods have in common.
 * @evidence contracts/development/design.md#principled-representation One method per law of the Firefighting family, each taking the law's own parameter type.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The Firefighting laws and nothing the other families own.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each method takes the existing parameter type of its law; nothing is redefined.
 */
export interface IAutoMovieMotionHumanFirefighting<Chain> {
  /**
   * Firefighting drills with coarse inert props.
   *
   * @param params The `prop`, `target`, `sweeps` and `span` of `IAutoMovieMotionHumanFirefight.IExtinguish`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanFirefighting.extinguish is provided by the chain that implements IAutoMovieMotionHumanFirefighting.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanFirefighting.extinguish is provided by the chain that implements IAutoMovieMotionHumanFirefighting.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanFirefighting.extinguish is provided by the chain that implements IAutoMovieMotionHumanFirefighting.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanFirefighting.extinguish is provided by the chain that implements IAutoMovieMotionHumanFirefighting.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanFirefighting.extinguish is provided by the chain that implements IAutoMovieMotionHumanFirefighting.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanFirefighting.extinguish is provided by the chain that implements IAutoMovieMotionHumanFirefighting.
   */
  extinguish(
    params: IAutoMovieMotionHumanFirefighting.IExtinguish,
    anchor?: string,
  ): Chain;

  /**
   * Firefighting drills with coarse inert props.
   *
   * @param params The `prop`, `role`, `grip`, `advance`, `target` and `sweeps` of `IAutoMovieMotionHumanFirefight.IHoseLine`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanFirefighting.hoseLine is provided by the chain that implements IAutoMovieMotionHumanFirefighting.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanFirefighting.hoseLine is provided by the chain that implements IAutoMovieMotionHumanFirefighting.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanFirefighting.hoseLine is provided by the chain that implements IAutoMovieMotionHumanFirefighting.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanFirefighting.hoseLine is provided by the chain that implements IAutoMovieMotionHumanFirefighting.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanFirefighting.hoseLine is provided by the chain that implements IAutoMovieMotionHumanFirefighting.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanFirefighting.hoseLine is provided by the chain that implements IAutoMovieMotionHumanFirefighting.
   */
  hoseLine(
    params: IAutoMovieMotionHumanFirefighting.IHoseLine,
    anchor?: string,
  ): Chain;

  /**
   * Firefighting drills with coarse inert props.
   *
   * @param params The `prop`, `partner`, `region` and `count` of `IAutoMovieMotionHumanFirefight.IBeatFlames`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanFirefighting.beatFlames is provided by the chain that implements IAutoMovieMotionHumanFirefighting.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanFirefighting.beatFlames is provided by the chain that implements IAutoMovieMotionHumanFirefighting.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanFirefighting.beatFlames is provided by the chain that implements IAutoMovieMotionHumanFirefighting.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanFirefighting.beatFlames is provided by the chain that implements IAutoMovieMotionHumanFirefighting.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanFirefighting.beatFlames is provided by the chain that implements IAutoMovieMotionHumanFirefighting.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanFirefighting.beatFlames is provided by the chain that implements IAutoMovieMotionHumanFirefighting.
   */
  beatFlames(
    params: IAutoMovieMotionHumanFirefighting.IBeatFlames,
    anchor?: string,
  ): Chain;

  /**
   * Firefighting drills with coarse inert props.
   *
   * @param params The `rolls` of `IAutoMovieMotionHumanFirefight.IStopDropRoll`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanFirefighting.stopDropRoll is provided by the chain that implements IAutoMovieMotionHumanFirefighting.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanFirefighting.stopDropRoll is provided by the chain that implements IAutoMovieMotionHumanFirefighting.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanFirefighting.stopDropRoll is provided by the chain that implements IAutoMovieMotionHumanFirefighting.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanFirefighting.stopDropRoll is provided by the chain that implements IAutoMovieMotionHumanFirefighting.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanFirefighting.stopDropRoll is provided by the chain that implements IAutoMovieMotionHumanFirefighting.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanFirefighting.stopDropRoll is provided by the chain that implements IAutoMovieMotionHumanFirefighting.
   */
  stopDropRoll(
    params: IAutoMovieMotionHumanFirefighting.IStopDropRoll,
    anchor?: string,
  ): Chain;
  /**
   * The PASS drill whole (OSHA): the extinguisher taken by its carrying handle, the pin pulled by the free hand by its ring, then aim, squeeze and sweep, so the pin is out before the lever moves.
   *
   * @param params The extinguisher, the fire, the sweeps and the carrying `hand` of `IAutoMovieMotionHumanFirefighting.IPass`.
   * @param anchor The action's id for `sync` and `until`, set on the sweep; none when absent.
   * @returns The chain with the take, the pin's pull and the sweep appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanFirefighting.pass is provided by the chain that implements IAutoMovieMotionHumanFirefighting.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanFirefighting.pass is provided by the chain that implements IAutoMovieMotionHumanFirefighting.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanFirefighting.pass is provided by the chain that implements IAutoMovieMotionHumanFirefighting.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanFirefighting.pass is provided by the chain that implements IAutoMovieMotionHumanFirefighting.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanFirefighting.pass is provided by the chain that implements IAutoMovieMotionHumanFirefighting.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanFirefighting.pass is provided by the chain that implements IAutoMovieMotionHumanFirefighting.
   */
  pass(params: IAutoMovieMotionHumanFirefighting.IPass, anchor?: string): Chain;
}
/**
 * The parameter types of the Firefighting methods.
 */
export namespace IAutoMovieMotionHumanFirefighting {
  /**
   * The parameters of `extinguish`: the law's own `IAutoMovieMotionHumanFirefight.IExtinguish`, unchanged.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method it parameterises and the law type it aliases unchanged.
   * @evidence contracts/development/design.md#principled-representation An alias: units, frames, defaults and invariants are those the law type states; the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanFirefight` owns the type; the alias serves this family's `extinguish` signature.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast, so `extinguish` takes the type its law reads.
   */
  export type IExtinguish = IAutoMovieMotionHumanFirefight.IExtinguish;

  /**
   * The parameters of `hoseLine`: the law's own `IAutoMovieMotionHumanFirefight.IHoseLine`, unchanged.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method it parameterises and the law type it aliases unchanged.
   * @evidence contracts/development/design.md#principled-representation An alias: units, frames, defaults and invariants are those the law type states; the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanFirefight` owns the type; the alias serves this family's `hoseLine` signature.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast, so `hoseLine` takes the type its law reads.
   */
  export type IHoseLine = IAutoMovieMotionHumanFirefight.IHoseLine;

  /**
   * The parameters of `beatFlames`: the law's own `IAutoMovieMotionHumanFirefight.IBeatFlames`, unchanged.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method it parameterises and the law type it aliases unchanged.
   * @evidence contracts/development/design.md#principled-representation An alias: units, frames, defaults and invariants are those the law type states; the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanFirefight` owns the type; the alias serves this family's `beatFlames` signature.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast, so `beatFlames` takes the type its law reads.
   */
  export type IBeatFlames = IAutoMovieMotionHumanFirefight.IBeatFlames;

  /**
   * The parameters of `stopDropRoll`: the law's own `IAutoMovieMotionHumanFirefight.IStopDropRoll`, unchanged.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method it parameterises and the law type it aliases unchanged.
   * @evidence contracts/development/design.md#principled-representation An alias: units, frames, defaults and invariants are those the law type states; the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanFirefight` owns the type; the alias serves this family's `stopDropRoll` signature.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast, so `stopDropRoll` takes the type its law reads.
   */
  export type IStopDropRoll = IAutoMovieMotionHumanFirefight.IStopDropRoll;
  /**
   * The parameters of `pass`: those of `extinguish` and the hand that carries the extinguisher.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method it parameterises, the type it extends and the one member it adds.
   * @evidence contracts/development/design.md#principled-representation The extinguisher drill's own members, with the hand the take and the pin's pull use.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Serves this family's `pass` signature.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the drill's members are inherited, not redefined.
   */
  export interface IPass extends IAutoMovieMotionHumanFirefight.IExtinguish {
    /** The hand that carries the extinguisher; `right` when absent. */
    hand?: AutoMovieHumanSide;
  }

  /**
   * The team's shared parameters: the line, the advance, the target and the sweeps; each member's role and grip are set per member.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names what the team shares and what each member sets.
   * @evidence contracts/development/design.md#principled-representation A named derivation of `IHoseLine` without the two members that differ per member.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What `hoseTeam` reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No member is added.
   */
  export type IHoseTeam = Omit<
    IAutoMovieMotionHumanFirefight.IHoseLine,
    "role" | "grip"
  >;

  /**
   * A team member's chain and standing place.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the chain and the place.
   * @evidence contracts/development/design.md#principled-representation A chain and world metres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What `hoseTeam` reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Both members are required.
   */
  export interface ITeamMember {
    /** The member's chain so far. */
    chain: IAutoMovieMotionHumanChain;

    /** Where the member stands, world metres; the advance walks from it along `+Z`. */
    at: IAutoMovieVector3;
  }

  /**
   * The operator's and the backup's chains, in that order.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names what it holds and in which order.
   * @evidence contracts/development/design.md#principled-representation A pair of chains.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What `hoseTeam` returns.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No member is added.
   */
  export type Team = readonly [
    IAutoMovieMotionHumanChain,
    IAutoMovieMotionHumanChain,
  ];
}

