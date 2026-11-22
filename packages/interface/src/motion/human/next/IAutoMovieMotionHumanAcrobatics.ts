import type { IAutoMovieMotionHumanTrampoline } from "../exercise/IAutoMovieMotionHumanTrampoline";
import type { IAutoMovieMotionHumanSkydive } from "../lexicon/IAutoMovieMotionHumanSkydive";
import type { IAutoMovieMotionHumanCartwheel } from "../sport/IAutoMovieMotionHumanCartwheel";
import type { IAutoMovieMotionHumanGymnastics } from "../sport/IAutoMovieMotionHumanGymnastics";
import type { IAutoMovieMotionHumanHandspring } from "../sport/IAutoMovieMotionHumanHandspring";
import type { IAutoMovieMotionHumanRoundOff } from "../sport/IAutoMovieMotionHumanRoundOff";
import type { IAutoMovieMotionHumanSalto } from "../sport/IAutoMovieMotionHumanSalto";

/**
 * Gymnastic and tumbling skills in flight: the salto, cartwheel, round-off, handspring and trampoline.
 *
 * @template Chain The chain every method returns; the chain implements this interface.
 * @evidence contracts/development/common.md#meaningful-documentation States the family's shared model and what its methods have in common.
 * @evidence contracts/development/design.md#principled-representation One method per law of the Acrobatics family, each taking the law's own parameter type.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The Acrobatics laws and nothing the other families own.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each method takes the existing parameter type of its law; nothing is redefined.
 */
export interface IAutoMovieMotionHumanAcrobatics<Chain> {
  /**
   * A handstand kicked up from standing, held and stepped down (#3251).
   *
   * @param params The `seconds` and `manner` of `IAutoMovieMotionHumanGymnastics.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanAcrobatics.gymnastics is provided by the chain that implements IAutoMovieMotionHumanAcrobatics.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanAcrobatics.gymnastics is provided by the chain that implements IAutoMovieMotionHumanAcrobatics.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanAcrobatics.gymnastics is provided by the chain that implements IAutoMovieMotionHumanAcrobatics.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanAcrobatics.gymnastics is provided by the chain that implements IAutoMovieMotionHumanAcrobatics.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanAcrobatics.gymnastics is provided by the chain that implements IAutoMovieMotionHumanAcrobatics.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanAcrobatics.gymnastics is provided by the chain that implements IAutoMovieMotionHumanAcrobatics.
   */
  gymnastics(
    params: IAutoMovieMotionHumanAcrobatics.IGymnastics,
    anchor?: string,
  ): Chain;

  /**
   * A salto: a jump whose flight turns the whole body head over heels about its centre of mass, forward or backward, a whole number of times, and lands on the feet (#3377: the salti of floor gymnastics, a diver's and a free-runner's flip).
   *
   * @param params The `to`, `apex`, `way` and `turns` of `IAutoMovieMotionHumanSalto.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanAcrobatics.salto is provided by the chain that implements IAutoMovieMotionHumanAcrobatics.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanAcrobatics.salto is provided by the chain that implements IAutoMovieMotionHumanAcrobatics.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanAcrobatics.salto is provided by the chain that implements IAutoMovieMotionHumanAcrobatics.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanAcrobatics.salto is provided by the chain that implements IAutoMovieMotionHumanAcrobatics.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanAcrobatics.salto is provided by the chain that implements IAutoMovieMotionHumanAcrobatics.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanAcrobatics.salto is provided by the chain that implements IAutoMovieMotionHumanAcrobatics.
   */
  salto(params: IAutoMovieMotionHumanAcrobatics.ISalto, anchor?: string): Chain;

  /**
   * A cartwheel (#3377): the body turns once about its front-to-back axis, sideways, passing from one foot to one hand, the other hand, and the other foot, and stands again a wheel's roll to the side.
   *
   * @param params The `to` and `seconds` of `IAutoMovieMotionHumanCartwheel.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanAcrobatics.cartwheel is provided by the chain that implements IAutoMovieMotionHumanAcrobatics.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanAcrobatics.cartwheel is provided by the chain that implements IAutoMovieMotionHumanAcrobatics.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanAcrobatics.cartwheel is provided by the chain that implements IAutoMovieMotionHumanAcrobatics.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanAcrobatics.cartwheel is provided by the chain that implements IAutoMovieMotionHumanAcrobatics.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanAcrobatics.cartwheel is provided by the chain that implements IAutoMovieMotionHumanAcrobatics.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanAcrobatics.cartwheel is provided by the chain that implements IAutoMovieMotionHumanAcrobatics.
   */
  cartwheel(
    params: IAutoMovieMotionHumanAcrobatics.ICartwheel,
    anchor?: string,
  ): Chain;

  /**
   * A round-off (#3377): a cartwheel that travels along the way the body faced, turns half round about the vertical and lands on both feet at once, facing back where it came from, the entry to a back handspring or a back salto.
   *
   * @param params The `lead` and `seconds` of `IAutoMovieMotionHumanRoundOff.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanAcrobatics.roundOff is provided by the chain that implements IAutoMovieMotionHumanAcrobatics.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanAcrobatics.roundOff is provided by the chain that implements IAutoMovieMotionHumanAcrobatics.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanAcrobatics.roundOff is provided by the chain that implements IAutoMovieMotionHumanAcrobatics.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanAcrobatics.roundOff is provided by the chain that implements IAutoMovieMotionHumanAcrobatics.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanAcrobatics.roundOff is provided by the chain that implements IAutoMovieMotionHumanAcrobatics.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanAcrobatics.roundOff is provided by the chain that implements IAutoMovieMotionHumanAcrobatics.
   */
  roundOff(
    params: IAutoMovieMotionHumanAcrobatics.IRoundOff,
    anchor?: string,
  ): Chain;

  /**
   * A front handspring (#3377): from standing, the body reaches forward into a lunge, turns head over heels in pitch over its hands, leaves them and flies to its feet, landing arched and rising to stand.
   *
   * @param params The `lead` of `IAutoMovieMotionHumanHandspring.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanAcrobatics.handspring is provided by the chain that implements IAutoMovieMotionHumanAcrobatics.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanAcrobatics.handspring is provided by the chain that implements IAutoMovieMotionHumanAcrobatics.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanAcrobatics.handspring is provided by the chain that implements IAutoMovieMotionHumanAcrobatics.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanAcrobatics.handspring is provided by the chain that implements IAutoMovieMotionHumanAcrobatics.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanAcrobatics.handspring is provided by the chain that implements IAutoMovieMotionHumanAcrobatics.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanAcrobatics.handspring is provided by the chain that implements IAutoMovieMotionHumanAcrobatics.
   */
  handspring(
    params: IAutoMovieMotionHumanAcrobatics.IHandspring,
    anchor?: string,
  ): Chain;

  /**
   * Bouncing on a trampoline (#4006): straight bounces that build toward an apex, a shape held at each flight's apex, and a kill that absorbs the last landing to a stop.
   *
   * @param params The `on`, `bounces`, `apex` and `shape` of `IAutoMovieMotionHumanTrampoline.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanAcrobatics.trampoline is provided by the chain that implements IAutoMovieMotionHumanAcrobatics.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanAcrobatics.trampoline is provided by the chain that implements IAutoMovieMotionHumanAcrobatics.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanAcrobatics.trampoline is provided by the chain that implements IAutoMovieMotionHumanAcrobatics.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanAcrobatics.trampoline is provided by the chain that implements IAutoMovieMotionHumanAcrobatics.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanAcrobatics.trampoline is provided by the chain that implements IAutoMovieMotionHumanAcrobatics.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanAcrobatics.trampoline is provided by the chain that implements IAutoMovieMotionHumanAcrobatics.
   */
  trampoline(
    params: IAutoMovieMotionHumanAcrobatics.ITrampoline,
    anchor?: string,
  ): Chain;

  /**
   * A parachute jump from a named edge: the exit, the belly-to-earth freefall in the arch with an optional track and turn, the deployment at an authored altitude, the canopy flight steered by the toggles with a flare before the ground, and the landing in a parachute landing fall or on the feet.
   *
   * @param params The `from`, `edge`, `deploy`, `track`, `turn`, `toggles` and `landing` of `IAutoMovieMotionHumanSkydive.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanAcrobatics.skydive is provided by the chain that implements IAutoMovieMotionHumanAcrobatics.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanAcrobatics.skydive is provided by the chain that implements IAutoMovieMotionHumanAcrobatics.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanAcrobatics.skydive is provided by the chain that implements IAutoMovieMotionHumanAcrobatics.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanAcrobatics.skydive is provided by the chain that implements IAutoMovieMotionHumanAcrobatics.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanAcrobatics.skydive is provided by the chain that implements IAutoMovieMotionHumanAcrobatics.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanAcrobatics.skydive is provided by the chain that implements IAutoMovieMotionHumanAcrobatics.
   */
  skydive(
    params: IAutoMovieMotionHumanAcrobatics.ISkydive,
    anchor?: string,
  ): Chain;
}

/**
 * The parameter types of the Acrobatics methods.
 */
export namespace IAutoMovieMotionHumanAcrobatics {
  /**
   * The parameters of `gymnastics`: the handstand law's own `IAutoMovieMotionHumanGymnastics.IParams`, unchanged.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method it parameterises and the law type it aliases unchanged.
   * @evidence contracts/development/design.md#principled-representation An alias: the units, frames, defaults and invariants are those `IAutoMovieMotionHumanGymnastics.IParams` states; the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanGymnastics` owns the type; the alias serves this family's `gymnastics` signature.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast, so `gymnastics` takes exactly the type its law reads.
   */
  export type IGymnastics = IAutoMovieMotionHumanGymnastics.IParams;

  /**
   * The parameters of `salto`: the salto law's own `IAutoMovieMotionHumanSalto.IParams`, unchanged.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method it parameterises and the law type it aliases unchanged.
   * @evidence contracts/development/design.md#principled-representation An alias: the units, frames, defaults and invariants are those `IAutoMovieMotionHumanSalto.IParams` states; the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanSalto` owns the type; the alias serves this family's `salto` signature.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast, so `salto` takes exactly the type its law reads.
   */
  export type ISalto = IAutoMovieMotionHumanSalto.IParams;

  /**
   * The parameters of `cartwheel`: the cartwheel law's own `IAutoMovieMotionHumanCartwheel.IParams`, unchanged.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method it parameterises and the law type it aliases unchanged.
   * @evidence contracts/development/design.md#principled-representation An alias: the units, frames, defaults and invariants are those `IAutoMovieMotionHumanCartwheel.IParams` states; the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanCartwheel` owns the type; the alias serves this family's `cartwheel` signature.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast, so `cartwheel` takes exactly the type its law reads.
   */
  export type ICartwheel = IAutoMovieMotionHumanCartwheel.IParams;

  /**
   * The parameters of `roundOff`: the round-off law's own `IAutoMovieMotionHumanRoundOff.IParams`, unchanged.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method it parameterises and the law type it aliases unchanged.
   * @evidence contracts/development/design.md#principled-representation An alias: the units, frames, defaults and invariants are those `IAutoMovieMotionHumanRoundOff.IParams` states; the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanRoundOff` owns the type; the alias serves this family's `roundOff` signature.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast, so `roundOff` takes exactly the type its law reads.
   */
  export type IRoundOff = IAutoMovieMotionHumanRoundOff.IParams;

  /**
   * The parameters of `handspring`: the handspring law's own `IAutoMovieMotionHumanHandspring.IParams`, unchanged.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method it parameterises and the law type it aliases unchanged.
   * @evidence contracts/development/design.md#principled-representation An alias: the units, frames, defaults and invariants are those `IAutoMovieMotionHumanHandspring.IParams` states; the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanHandspring` owns the type; the alias serves this family's `handspring` signature.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast, so `handspring` takes exactly the type its law reads.
   */
  export type IHandspring = IAutoMovieMotionHumanHandspring.IParams;

  /**
   * The parameters of `trampoline`: the trampoline law's own `IAutoMovieMotionHumanTrampoline.IParams`, unchanged.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method it parameterises and the law type it aliases unchanged.
   * @evidence contracts/development/design.md#principled-representation An alias: the units, frames, defaults and invariants are those `IAutoMovieMotionHumanTrampoline.IParams` states; the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanTrampoline` owns the type; the alias serves this family's `trampoline` signature.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast, so `trampoline` takes exactly the type its law reads.
   */
  export type ITrampoline = IAutoMovieMotionHumanTrampoline.IParams;

  /**
   * The parameters of `skydive`: the skydive law's own `IAutoMovieMotionHumanSkydive.IParams`, unchanged.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method it parameterises and the law type it aliases unchanged.
   * @evidence contracts/development/design.md#principled-representation An alias: the units, frames, defaults and invariants are those `IAutoMovieMotionHumanSkydive.IParams` states; the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanSkydive` owns the type; the alias serves this family's `skydive` signature.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast, so `skydive` takes exactly the type its law reads.
   */
  export type ISkydive = IAutoMovieMotionHumanSkydive.IParams;
}
