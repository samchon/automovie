import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { IAutoMovieMotionHumanEnvironmentRecovery } from "../lexicon/IAutoMovieMotionHumanEnvironmentRecovery";
import type { IAutoMovieMotionHumanStuntFall } from "../lexicon/IAutoMovieMotionHumanStuntFall";
import type { IAutoMovieMotionHumanCollapse } from "../reaction/IAutoMovieMotionHumanCollapse";
import type { IAutoMovieMotionHumanKnockdown } from "../reaction/IAutoMovieMotionHumanKnockdown";
import type { IAutoMovieMotionHumanPerturb } from "../reaction/IAutoMovieMotionHumanPerturb";
import type { IAutoMovieMotionHumanStagger } from "../reaction/IAutoMovieMotionHumanStagger";
import type { IAutoMovieMotionHumanThrown } from "../reaction/IAutoMovieMotionHumanThrown";
import type { IAutoMovieMotionHumanVehicleHit } from "../reaction/IAutoMovieMotionHumanVehicleHit";
import type { IAutoMovieMotionHumanWireFlight } from "../reaction/IAutoMovieMotionHumanWireFlight";

/**
 * The falls and the balance reactions: a collapse, a stagger, a knockdown, a body thrown or hit by a car, a perturbation, a wire flight or arrest, a staged stunt fall and the recovery from a trip or a slip. Each is planned by physics of the body and its support, not by a fixed pose. A reaction that leaves the feet where they are is a `IAutoMovieMotionHumanReaction`, not a fall.
 *
 * `AutoMovieMotionHumanFall.GOALKEEPER_DIVE_LEFT` and `GOALKEEPER_DIVE_RIGHT` (`IDivePreset`) are the one-side dives of a goalkeeper, data spread into the dive law's parameters; a preset adds no method.
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
   * @param params The `direction`, `tone`, `side`, `from`, `sag` and `seconds` of `IAutoMovieMotionHumanCollapse.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
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
   * @param params The `from`, `speed` and `manner` of `IAutoMovieMotionHumanStagger.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
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
   * @param params The `from` and `seconds` of `IAutoMovieMotionHumanKnockdown.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanFall.knockdown is provided by the chain that implements IAutoMovieMotionHumanFall.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanFall.knockdown is provided by the chain that implements IAutoMovieMotionHumanFall.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanFall.knockdown is provided by the chain that implements IAutoMovieMotionHumanFall.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanFall.knockdown is provided by the chain that implements IAutoMovieMotionHumanFall.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanFall.knockdown is provided by the chain that implements IAutoMovieMotionHumanFall.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanFall.knockdown is provided by the chain that implements IAutoMovieMotionHumanFall.
   */
  knockdown(
    params: IAutoMovieMotionHumanFall.IKnockdown,
    anchor?: string,
  ): Chain;

  /**
   * A struck body thrown clear of the floor by a blast or a jerk-back, then landing on its back.
   *
   * @param params The `rig`, `from`, `distance`, `height`, `seconds` and `wall` of `IAutoMovieMotionHumanThrown.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
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
   * @param params The `outcome`, `by`, `fulcrum` and `on` of `IAutoMovieMotionHumanPerturb.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
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
   * @param params The `to`, `via`, `seconds`, `shape` and `touches` of `IAutoMovieMotionHumanWireFlight.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanFall.wireFlight is provided by the chain that implements IAutoMovieMotionHumanFall.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanFall.wireFlight is provided by the chain that implements IAutoMovieMotionHumanFall.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanFall.wireFlight is provided by the chain that implements IAutoMovieMotionHumanFall.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanFall.wireFlight is provided by the chain that implements IAutoMovieMotionHumanFall.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanFall.wireFlight is provided by the chain that implements IAutoMovieMotionHumanFall.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanFall.wireFlight is provided by the chain that implements IAutoMovieMotionHumanFall.
   */
  wireFlight(
    params: IAutoMovieMotionHumanFall.IWireFlight,
    anchor?: string,
  ): Chain;

  /**
   * A pedestrian struck by a moving car.
   *
   * @param params The `vehicle`, `edge`, `horizon` and `hold` of `IAutoMovieMotionHumanVehicleHit.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanFall.vehicleHit is provided by the chain that implements IAutoMovieMotionHumanFall.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanFall.vehicleHit is provided by the chain that implements IAutoMovieMotionHumanFall.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanFall.vehicleHit is provided by the chain that implements IAutoMovieMotionHumanFall.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanFall.vehicleHit is provided by the chain that implements IAutoMovieMotionHumanFall.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanFall.vehicleHit is provided by the chain that implements IAutoMovieMotionHumanFall.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanFall.vehicleHit is provided by the chain that implements IAutoMovieMotionHumanFall.
   */
  vehicleHit(
    params: IAutoMovieMotionHumanFall.IVehicleHit,
    anchor?: string,
  ): Chain;

  /**
   * A body held on a wire after a free drop: it falls `drop` metres, then the wire decelerates it to rest at the height `stop`; a fall the wire cannot stop above `stop` is refused.
   *
   * @param params The `drop`, `stop` and `deceleration` of `IAutoMovieMotionHumanWireFlight.IArrest`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanFall.wireArrest is provided by the chain that implements IAutoMovieMotionHumanFall.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanFall.wireArrest is provided by the chain that implements IAutoMovieMotionHumanFall.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanFall.wireArrest is provided by the chain that implements IAutoMovieMotionHumanFall.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanFall.wireArrest is provided by the chain that implements IAutoMovieMotionHumanFall.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanFall.wireArrest is provided by the chain that implements IAutoMovieMotionHumanFall.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanFall.wireArrest is provided by the chain that implements IAutoMovieMotionHumanFall.
   */
  wireArrest(
    params: IAutoMovieMotionHumanFall.IWireArrest,
    anchor?: string,
  ): Chain;

  /**
   * A staged stunt fall: a tumble or a seat slide down a named staircase, or a high fall from a named top onto a pad or the ground.
   *
   * @param params The `kind` and its members of `IAutoMovieMotionHumanStuntFall.IParams`: `stairs` and `slide` for a staircase, `exit`, `pad`, `top` and `descender` for a high fall.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanFall.stuntFall is provided by the chain that implements IAutoMovieMotionHumanFall.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanFall.stuntFall is provided by the chain that implements IAutoMovieMotionHumanFall.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanFall.stuntFall is provided by the chain that implements IAutoMovieMotionHumanFall.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanFall.stuntFall is provided by the chain that implements IAutoMovieMotionHumanFall.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanFall.stuntFall is provided by the chain that implements IAutoMovieMotionHumanFall.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanFall.stuntFall is provided by the chain that implements IAutoMovieMotionHumanFall.
   */
  stuntFall(
    params: IAutoMovieMotionHumanFall.IStuntFall,
    anchor?: string,
  ): Chain;

  /**
   * The answer to a staged trip or slip in a walk: the walk is cut at the measured cue and continues into a capture step, a fall or a braced rail catch.
   *
   * @param params The `kind`, `foot`, `outcome` and `rail` of `IAutoMovieMotionHumanEnvironmentRecovery.IParams`, with `obstacle` for a trip and `coefficient` and `support` for a slip.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanFall.environmentalRecovery is provided by the chain that implements IAutoMovieMotionHumanFall.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanFall.environmentalRecovery is provided by the chain that implements IAutoMovieMotionHumanFall.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanFall.environmentalRecovery is provided by the chain that implements IAutoMovieMotionHumanFall.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanFall.environmentalRecovery is provided by the chain that implements IAutoMovieMotionHumanFall.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanFall.environmentalRecovery is provided by the chain that implements IAutoMovieMotionHumanFall.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanFall.environmentalRecovery is provided by the chain that implements IAutoMovieMotionHumanFall.
   */
  environmentalRecovery(
    params: IAutoMovieMotionHumanFall.IEnvironmentRecovery,
    anchor?: string,
  ): Chain;

  /**
   * A pedestrian diving clear of a moving car to the side.
   *
   * @param params The `vehicle`, `side` and `horizon` of `IAutoMovieMotionHumanVehicleHit.IDive`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanFall.vehicleDive is provided by the chain that implements IAutoMovieMotionHumanFall.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanFall.vehicleDive is provided by the chain that implements IAutoMovieMotionHumanFall.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanFall.vehicleDive is provided by the chain that implements IAutoMovieMotionHumanFall.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanFall.vehicleDive is provided by the chain that implements IAutoMovieMotionHumanFall.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanFall.vehicleDive is provided by the chain that implements IAutoMovieMotionHumanFall.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanFall.vehicleDive is provided by the chain that implements IAutoMovieMotionHumanFall.
   */
  vehicleDive(
    params: IAutoMovieMotionHumanFall.IVehicleDive,
    anchor?: string,
  ): Chain;
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

  /**
   * The parameters of `wireArrest`: the law's own `IAutoMovieMotionHumanWireFlight.IArrest`, unchanged.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method it parameterises and the law type it aliases unchanged.
   * @evidence contracts/development/design.md#principled-representation An alias: units, frames, defaults and invariants are those the law type states; the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanWireFlight` owns the type; the alias serves this family's `wireArrest` signature.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast, so `wireArrest` takes the type its law reads.
   */
  export type IWireArrest = IAutoMovieMotionHumanWireFlight.IArrest;

  /**
   * The parameters of `stuntFall`: the law's own `IAutoMovieMotionHumanStuntFall.IParams`, unchanged.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method it parameterises and the law type it aliases unchanged.
   * @evidence contracts/development/design.md#principled-representation An alias: units, frames, defaults and invariants are those the law type states; the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanStuntFall` owns the type; the alias serves this family's `stuntFall` signature.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast, so `stuntFall` takes the type its law reads.
   */
  export type IStuntFall = IAutoMovieMotionHumanStuntFall.IParams;

  /**
   * The parameters of `environmentalRecovery`: the law's own `IAutoMovieMotionHumanEnvironmentRecovery.IParams`, unchanged.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method it parameterises and the law type it aliases unchanged.
   * @evidence contracts/development/design.md#principled-representation An alias: units, frames, defaults and invariants are those the law type states; the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanEnvironmentRecovery` owns the type; the alias serves this family's `environmentalRecovery` signature.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast, so `environmentalRecovery` takes the type its law reads.
   */
  export type IEnvironmentRecovery =
    IAutoMovieMotionHumanEnvironmentRecovery.IParams;

  /**
   * The parameters of `vehicleDive`: the law's own `IAutoMovieMotionHumanVehicleHit.IDive`, unchanged.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method it parameterises and the law type it aliases unchanged.
   * @evidence contracts/development/design.md#principled-representation An alias: units, frames, defaults and invariants are those the law type states; the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanVehicleHit` owns the type; the alias serves this family's `vehicleDive` signature.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast, so `vehicleDive` takes the type its law reads.
   */
  export type IVehicleDive = IAutoMovieMotionHumanVehicleHit.IDive;

  /**
   * The values a goalkeeper's dive fixes: the side the body dives to. It is spread into the dive law's parameters, which add the kind of fall.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the one value the preset fixes and how it is applied.
   * @evidence contracts/development/design.md#principled-representation `side` is an `AutoMovieHumanSide`, the person's own side, as the dive law reads it.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only the fixed key of the rows `goalkeeperDiveLeft` and `goalkeeperDiveRight`; the law's other parameters stay open.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the preset carries no value the law does not read.
   */
  export interface IDivePreset {
    /** The side the body dives to, the person's own left or right. */
    side: AutoMovieHumanSide;
  }
}
