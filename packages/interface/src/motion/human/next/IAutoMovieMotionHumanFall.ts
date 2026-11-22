import type { IAutoMovieMotionHumanCollapse } from "../reaction/IAutoMovieMotionHumanCollapse";
import type { IAutoMovieMotionHumanKnockdown } from "../reaction/IAutoMovieMotionHumanKnockdown";
import type { IAutoMovieMotionHumanPerturb } from "../reaction/IAutoMovieMotionHumanPerturb";
import type { IAutoMovieMotionHumanStagger } from "../reaction/IAutoMovieMotionHumanStagger";
import type { IAutoMovieMotionHumanThrown } from "../reaction/IAutoMovieMotionHumanThrown";
import type { IAutoMovieMotionHumanVehicleHit } from "../reaction/IAutoMovieMotionHumanVehicleHit";
import type { IAutoMovieMotionHumanWireFlight } from "../reaction/IAutoMovieMotionHumanWireFlight";

/**
 * Mechanism: The falls and the balance reactions: a collapse, a stagger, a knockdown, a body thrown or hit, a perturbation and a wire flight. Each is planned by physics of the body and its support, not by a fixed pose.
 *
 * @template Chain The chain every method returns; the chain implements this interface.
 * @evidence contracts/development/common.md#meaningful-documentation States the family's shared model and what its methods have in common.
 * @evidence contracts/development/design.md#principled-representation One method per law of the Fall family, each taking the law's own parameter type.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The Fall laws and nothing the other families own.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each method takes the existing parameter type of its law; nothing is redefined.
 */
export interface IAutoMovieMotionHumanFall<Chain> {
  /**
   * A staged collapse: the body goes down to the floor in a chosen direction and tone, for a faint or a fatal hit.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanFall.collapse: A staged collapse: the body goes down to the floor in a chosen direction and tone, for a faint or a fatal hit.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanFall.collapse is provided by the chain that implements IAutoMovieMotionHumanFall.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanFall.collapse is provided by the chain that implements IAutoMovieMotionHumanFall.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanFall.collapse is provided by the chain that implements IAutoMovieMotionHumanFall.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanFall.collapse is provided by the chain that implements IAutoMovieMotionHumanFall.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanFall.collapse is provided by the chain that implements IAutoMovieMotionHumanFall.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanFall.collapse is provided by the chain that implements IAutoMovieMotionHumanFall.
   */
  collapse(params: IAutoMovieMotionHumanFall.ICollapse, anchor?: string): Chain;

  /**
   * A stagger: a blow pushes the centre of mass past the base of support and recovery steps catch it.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanFall.stagger: A stagger: a blow pushes the centre of mass past the base of support and recovery steps catch it.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanFall.stagger is provided by the chain that implements IAutoMovieMotionHumanFall.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanFall.stagger is provided by the chain that implements IAutoMovieMotionHumanFall.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanFall.stagger is provided by the chain that implements IAutoMovieMotionHumanFall.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanFall.stagger is provided by the chain that implements IAutoMovieMotionHumanFall.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanFall.stagger is provided by the chain that implements IAutoMovieMotionHumanFall.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanFall.stagger is provided by the chain that implements IAutoMovieMotionHumanFall.
   */
  stagger(params: IAutoMovieMotionHumanFall.IStagger, anchor?: string): Chain;

  /**
   * A knockdown: the legs give way and the body goes down away from the blow, sitting onto the floor and falling back to lie supine.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanFall.knockdown: A knockdown: the legs give way and the body goes down away from the blow, sitting onto the floor and falling back to lie supine.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanFall.knockdown is provided by the chain that implements IAutoMovieMotionHumanFall.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanFall.knockdown is provided by the chain that implements IAutoMovieMotionHumanFall.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanFall.knockdown is provided by the chain that implements IAutoMovieMotionHumanFall.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanFall.knockdown is provided by the chain that implements IAutoMovieMotionHumanFall.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanFall.knockdown is provided by the chain that implements IAutoMovieMotionHumanFall.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanFall.knockdown is provided by the chain that implements IAutoMovieMotionHumanFall.
   */
  knockdown(params: IAutoMovieMotionHumanFall.IKnockdown, anchor?: string): Chain;

  /**
   * A struck body thrown clear of the floor by a blast or a jerk-back, then landing on its back.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanFall.thrown: A struck body thrown clear of the floor by a blast or a jerk-back, then landing on its back.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanFall.thrown is provided by the chain that implements IAutoMovieMotionHumanFall.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanFall.thrown is provided by the chain that implements IAutoMovieMotionHumanFall.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanFall.thrown is provided by the chain that implements IAutoMovieMotionHumanFall.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanFall.thrown is provided by the chain that implements IAutoMovieMotionHumanFall.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanFall.thrown is provided by the chain that implements IAutoMovieMotionHumanFall.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanFall.thrown is provided by the chain that implements IAutoMovieMotionHumanFall.
   */
  thrown(params: IAutoMovieMotionHumanFall.IThrown, anchor?: string): Chain;

  /**
   * One perturbation law whose response follows from the forces on its performer (#3430): the body absorbs an impulse within its base, catches it with capture steps, or falls, as the engine's balance outcome decides from the impulse, the body's mass and its support (`resolveAutoMovieBalanceOutcome`), or as the author fixes the outcome.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanFall.perturb: One perturbation law whose response follows from the forces on its performer (#3430): the body absorbs an impulse within its base, catches it with capture steps, or falls, as the engine's balance outcome decides from the impulse, the body's mass and its support (`resolveAutoMovieBalanceOutcome`), or as the author fixes the outcome.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanFall.perturb is provided by the chain that implements IAutoMovieMotionHumanFall.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanFall.perturb is provided by the chain that implements IAutoMovieMotionHumanFall.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanFall.perturb is provided by the chain that implements IAutoMovieMotionHumanFall.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanFall.perturb is provided by the chain that implements IAutoMovieMotionHumanFall.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanFall.perturb is provided by the chain that implements IAutoMovieMotionHumanFall.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanFall.perturb is provided by the chain that implements IAutoMovieMotionHumanFall.
   */
  perturb(params: IAutoMovieMotionHumanFall.IPerturb, anchor?: string): Chain;

  /**
   * A body flown on wires along an authored path that ignores gravity: a superhero's flight, a wuxia leap, a levitation (wire work in Hong Kong action cinema, David Bordwell, Planet Hong Kong, 2nd ed., 2011).
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanFall.wireFlight: A body flown on wires along an authored path that ignores gravity: a superhero's flight, a wuxia leap, a levitation (wire work in Hong Kong action cinema, David Bordwell, Planet Hong Kong, 2nd ed., 2011).
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanFall.wireFlight is provided by the chain that implements IAutoMovieMotionHumanFall.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanFall.wireFlight is provided by the chain that implements IAutoMovieMotionHumanFall.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanFall.wireFlight is provided by the chain that implements IAutoMovieMotionHumanFall.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanFall.wireFlight is provided by the chain that implements IAutoMovieMotionHumanFall.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanFall.wireFlight is provided by the chain that implements IAutoMovieMotionHumanFall.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanFall.wireFlight is provided by the chain that implements IAutoMovieMotionHumanFall.
   */
  wireFlight(params: IAutoMovieMotionHumanFall.IWireFlight, anchor?: string): Chain;

  /**
   * A pedestrian struck by a moving car, or diving clear of it.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanFall.vehicleHit: A pedestrian struck by a moving car, or diving clear of it.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanFall.vehicleHit is provided by the chain that implements IAutoMovieMotionHumanFall.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanFall.vehicleHit is provided by the chain that implements IAutoMovieMotionHumanFall.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanFall.vehicleHit is provided by the chain that implements IAutoMovieMotionHumanFall.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanFall.vehicleHit is provided by the chain that implements IAutoMovieMotionHumanFall.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanFall.vehicleHit is provided by the chain that implements IAutoMovieMotionHumanFall.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanFall.vehicleHit is provided by the chain that implements IAutoMovieMotionHumanFall.
   */
  vehicleHit(params: IAutoMovieMotionHumanFall.IVehicleHit, anchor?: string): Chain;
}

/**
 * The parameter types of the Fall methods.
 */
export namespace IAutoMovieMotionHumanFall {
  /**
   * The parameters of `collapse`: the law's own `IAutoMovieMotionHumanCollapse.IParams`, unchanged.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method it parameterises and the law type it aliases unchanged.
   * @evidence contracts/development/design.md#principled-representation An alias: units, frames, defaults and invariants are those the law type states; the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanCollapse` owns the type; the alias serves this family's `collapse` signature.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast, so `collapse` takes the type its law reads.
   */
  export type ICollapse = IAutoMovieMotionHumanCollapse.IParams;

  /**
   * The parameters of `stagger`: the law's own `IAutoMovieMotionHumanStagger.IParams`, unchanged.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method it parameterises and the law type it aliases unchanged.
   * @evidence contracts/development/design.md#principled-representation An alias: units, frames, defaults and invariants are those the law type states; the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanStagger` owns the type; the alias serves this family's `stagger` signature.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast, so `stagger` takes the type its law reads.
   */
  export type IStagger = IAutoMovieMotionHumanStagger.IParams;

  /**
   * The parameters of `knockdown`: the law's own `IAutoMovieMotionHumanKnockdown.IParams`, unchanged.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method it parameterises and the law type it aliases unchanged.
   * @evidence contracts/development/design.md#principled-representation An alias: units, frames, defaults and invariants are those the law type states; the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanKnockdown` owns the type; the alias serves this family's `knockdown` signature.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast, so `knockdown` takes the type its law reads.
   */
  export type IKnockdown = IAutoMovieMotionHumanKnockdown.IParams;

  /**
   * The parameters of `thrown`: the law's own `IAutoMovieMotionHumanThrown.IParams`, unchanged.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method it parameterises and the law type it aliases unchanged.
   * @evidence contracts/development/design.md#principled-representation An alias: units, frames, defaults and invariants are those the law type states; the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanThrown` owns the type; the alias serves this family's `thrown` signature.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast, so `thrown` takes the type its law reads.
   */
  export type IThrown = IAutoMovieMotionHumanThrown.IParams;

  /**
   * The parameters of `perturb`: the law's own `IAutoMovieMotionHumanPerturb.IParams`, unchanged.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method it parameterises and the law type it aliases unchanged.
   * @evidence contracts/development/design.md#principled-representation An alias: units, frames, defaults and invariants are those the law type states; the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanPerturb` owns the type; the alias serves this family's `perturb` signature.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast, so `perturb` takes the type its law reads.
   */
  export type IPerturb = IAutoMovieMotionHumanPerturb.IParams;

  /**
   * The parameters of `wireFlight`: the law's own `IAutoMovieMotionHumanWireFlight.IParams`, unchanged.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method it parameterises and the law type it aliases unchanged.
   * @evidence contracts/development/design.md#principled-representation An alias: units, frames, defaults and invariants are those the law type states; the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanWireFlight` owns the type; the alias serves this family's `wireFlight` signature.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast, so `wireFlight` takes the type its law reads.
   */
  export type IWireFlight = IAutoMovieMotionHumanWireFlight.IParams;

  /**
   * The parameters of `vehicleHit`: the law's own `IAutoMovieMotionHumanVehicleHit.IParams`, unchanged.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method it parameterises and the law type it aliases unchanged.
   * @evidence contracts/development/design.md#principled-representation An alias: units, frames, defaults and invariants are those the law type states; the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanVehicleHit` owns the type; the alias serves this family's `vehicleHit` signature.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast, so `vehicleHit` takes the type its law reads.
   */
  export type IVehicleHit = IAutoMovieMotionHumanVehicleHit.IParams;
}
