import type { IAutoMovieMotionHumanClinch } from "../grappling/IAutoMovieMotionHumanClinch";
import type { IAutoMovieMotionHumanForceResponse } from "../grappling/IAutoMovieMotionHumanForceResponse";
import type { IAutoMovieMotionHumanGrapple as ILegacyGrapple } from "../grappling/IAutoMovieMotionHumanGrapple";
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
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanGrapple.clinch: Taking a clinch grip on a partner standing within reach and holding it: the two-handed neck tie of Muay Thai (`plum`), or judo's collar and sleeve grip (`collarSleeve`, kumikata).
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
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanGrapple.grapple: Inputs shared by two actors in a preplanned sport grappling scene.
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
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanGrapple.kuzushi: A broken base (kuzushi): the receiver of a judo throw drawn off balance forward, the whole body tipped about the ankles over the toes while the feet stay on the floor, the stage before a throw carries the body over.
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
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanGrapple.lungeGrab: A sudden lunge that closes both hands on a victim's region, as a shambler breaks from its walk: the front foot steps long, the trunk pitches forward and the hands close on the region through the stage.
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
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanGrapple.forceResponse: A partner's response to a pull through grips (#3439), the outcomes of `perturb` a sustained force decides: `resist`, `yield` and `thrown`.
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
   * The parameters of `grapple`: the grappling law's own `IAutoMovieMotionHumanGrapple.IParams` (imported as `ILegacyGrapple`), unchanged.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method it parameterises and the law type it aliases unchanged, with its import name.
   * @evidence contracts/development/design.md#principled-representation An alias: units, frames, defaults and invariants are those the law type states; the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The grappling folder's `IAutoMovieMotionHumanGrapple` owns the type; the alias serves this family's `grapple` signature.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast, so `grapple` takes the type its law reads.
   */
  export type IGrapple = ILegacyGrapple.IParams;

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
