import type { IAutoMovieMotionHumanDress as ILegacyDress } from "../dressing/IAutoMovieMotionHumanDress";
import type { IAutoMovieMotionHumanSheath } from "../handling/IAutoMovieMotionHumanSheath";

/**
 * Mechanism: Putting on, taking off and fastening clothing, and sheathing and drawing from the body.
 *
 * @template Chain The chain every method returns; the chain implements this interface.
 * @evidence contracts/development/common.md#meaningful-documentation States the family's shared model and what its methods have in common.
 * @evidence contracts/development/design.md#principled-representation One method per law of the Dress family, each taking the law's own parameter type.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The Dress laws and nothing the other families own.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each method takes the existing parameter type of its law; nothing is redefined.
 */
export interface IAutoMovieMotionHumanDress<Chain> {
  /**
   * Putting on a hat or a pair of glasses held in one hand, with both hands, while standing.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanDress.dress: Putting on a hat or a pair of glasses held in one hand, with both hands, while standing.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanDress.dress is provided by the chain that implements IAutoMovieMotionHumanDress.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanDress.dress is provided by the chain that implements IAutoMovieMotionHumanDress.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanDress.dress is provided by the chain that implements IAutoMovieMotionHumanDress.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanDress.dress is provided by the chain that implements IAutoMovieMotionHumanDress.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanDress.dress is provided by the chain that implements IAutoMovieMotionHumanDress.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanDress.dress is provided by the chain that implements IAutoMovieMotionHumanDress.
   */
  dress(params: IAutoMovieMotionHumanDress.IDress, anchor?: string): Chain;

  /**
   * A rigid blade staged seated in a separate carrier, such as a sword in its scabbard or a knife in its sheath, and the line it is drawn and returned along.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanDress.sheath: A rigid blade staged seated in a separate carrier, such as a sword in its scabbard or a knife in its sheath, and the line it is drawn and returned along.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanDress.sheath is provided by the chain that implements IAutoMovieMotionHumanDress.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanDress.sheath is provided by the chain that implements IAutoMovieMotionHumanDress.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanDress.sheath is provided by the chain that implements IAutoMovieMotionHumanDress.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanDress.sheath is provided by the chain that implements IAutoMovieMotionHumanDress.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanDress.sheath is provided by the chain that implements IAutoMovieMotionHumanDress.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanDress.sheath is provided by the chain that implements IAutoMovieMotionHumanDress.
   */
  sheath(params: IAutoMovieMotionHumanDress.ISheath, anchor?: string): Chain;
}

/**
 * The parameter types of the Dress methods.
 */
export namespace IAutoMovieMotionHumanDress {
  /**
   * The parameters of `dress`: the dressing law's own `IAutoMovieMotionHumanDress.IParams` (imported as `ILegacyDress`), unchanged.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method it parameterises and the law type it aliases unchanged, with its import name.
   * @evidence contracts/development/design.md#principled-representation An alias: units, frames, defaults and invariants are those the law type states; the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The dressing folder's `IAutoMovieMotionHumanDress` owns the type; the alias serves this family's `dress` signature.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast, so `dress` takes the type its law reads.
   */
  export type IDress = ILegacyDress.IParams;

  /**
   * The parameters of `sheath`: `IAutoMovieMotionHumanSheath.IParams`, the carrier's mouth, the blade's tip and handle and the draw's clearance, unchanged.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method it parameterises, the type it aliases unchanged and the four things that type names.
   * @evidence contracts/development/design.md#principled-representation An alias: the sockets, affordance ids and the clearance in metres are those `IAutoMovieMotionHumanSheath.IParams` states; the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanSheath` owns the type; the alias serves this family's `sheath` signature.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Gap: the aliased type is the staging input `HumanSheath.of` reads, not an action law's parameters; the draw and the return are separate laws (`drawFromCarrier`, `putDownAperture`) on `IAutoMovieMotionHumanSheath.IStaged`, so no single law plans a `sheath` action from this type.
   */
  export type ISheath = IAutoMovieMotionHumanSheath.IParams;
}
