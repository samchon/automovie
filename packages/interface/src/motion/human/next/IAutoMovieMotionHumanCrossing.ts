import type { IAutoMovieMotionHumanSquatVault } from "../sport/IAutoMovieMotionHumanSquatVault";
import type { IAutoMovieMotionHumanStepOver } from "../everyday/IAutoMovieMotionHumanStepOver";
import type { IAutoMovieMotionHumanVault } from "../sport/IAutoMovieMotionHumanVault";

/**
 * Mechanism: Crossing an obstacle: stepping over it and the vaults.
 *
 * @template Chain The chain every method returns; the chain implements this interface.
 * @evidence contracts/development/common.md#meaningful-documentation States the family's shared model and what its methods have in common.
 * @evidence contracts/development/design.md#principled-representation One method per law of the Crossing family, each taking the law's own parameter type.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The Crossing laws and nothing the other families own.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each method takes the existing parameter type of its law; nothing is redefined.
 */
export interface IAutoMovieMotionHumanCrossing<Chain> {
  /**
   * Stepping over a low obstacle placed in the scene, a kerb or a hurdle (`HumanObstacle`), from standing in front of it: the lead foot lifts over it and lands beyond, then the trail foot follows and lands beside it, both feet clearing the obstacle's top.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanCrossing.stepOver: Stepping over a low obstacle placed in the scene, a kerb or a hurdle (`HumanObstacle`), from standing in front of it: the lead foot lifts over it and lands beyond, then the trail foot follows and lands beside it, both feet clearing the obstacle's top.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanCrossing.stepOver is provided by the chain that implements IAutoMovieMotionHumanCrossing.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanCrossing.stepOver is provided by the chain that implements IAutoMovieMotionHumanCrossing.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanCrossing.stepOver is provided by the chain that implements IAutoMovieMotionHumanCrossing.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanCrossing.stepOver is provided by the chain that implements IAutoMovieMotionHumanCrossing.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanCrossing.stepOver is provided by the chain that implements IAutoMovieMotionHumanCrossing.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanCrossing.stepOver is provided by the chain that implements IAutoMovieMotionHumanCrossing.
   */
  stepOver(params: IAutoMovieMotionHumanCrossing.IStepOver, anchor?: string): Chain;

  /**
   * A handspring vault (#3377): a front handspring whose hands land on a prop's top, a vaulting table, a box or a plyometric box, and fly from it to a chosen mat or the floor beyond.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanCrossing.vault: A handspring vault (#3377): a front handspring whose hands land on a prop's top, a vaulting table, a box or a plyometric box, and fly from it to a chosen mat or the floor beyond.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanCrossing.vault is provided by the chain that implements IAutoMovieMotionHumanCrossing.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanCrossing.vault is provided by the chain that implements IAutoMovieMotionHumanCrossing.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanCrossing.vault is provided by the chain that implements IAutoMovieMotionHumanCrossing.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanCrossing.vault is provided by the chain that implements IAutoMovieMotionHumanCrossing.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanCrossing.vault is provided by the chain that implements IAutoMovieMotionHumanCrossing.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanCrossing.vault is provided by the chain that implements IAutoMovieMotionHumanCrossing.
   */
  vault(params: IAutoMovieMotionHumanCrossing.IVault, anchor?: string): Chain;

  /**
   * A squat vault over a box: the hands set on the near edge of the box's top, the body tucked over them, a push-off into a flight over the box and a landing on both feet beyond its far edge.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanCrossing.squatVault: A squat vault over a box: the hands set on the near edge of the box's top, the body tucked over them, a push-off into a flight over the box and a landing on both feet beyond its far edge.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanCrossing.squatVault is provided by the chain that implements IAutoMovieMotionHumanCrossing.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanCrossing.squatVault is provided by the chain that implements IAutoMovieMotionHumanCrossing.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanCrossing.squatVault is provided by the chain that implements IAutoMovieMotionHumanCrossing.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanCrossing.squatVault is provided by the chain that implements IAutoMovieMotionHumanCrossing.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanCrossing.squatVault is provided by the chain that implements IAutoMovieMotionHumanCrossing.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanCrossing.squatVault is provided by the chain that implements IAutoMovieMotionHumanCrossing.
   */
  squatVault(params: IAutoMovieMotionHumanCrossing.ISquatVault, anchor?: string): Chain;
}

/**
 * The parameter types of the Crossing methods.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the parameter type of each Crossing method.
 * @evidence contracts/development/design.md#principled-representation Each parameter type is the law's existing type, named once here.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One parameter type per method.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Nothing is redefined: every name aliases the type its law already reads.
 */
export namespace IAutoMovieMotionHumanCrossing {
  /** The parameters of `stepOver`. */
  export type IStepOver = IAutoMovieMotionHumanStepOver.IParams;

  /** The parameters of `vault`. */
  export type IVault = IAutoMovieMotionHumanVault.IParams;

  /** The parameters of `squatVault`. */
  export type ISquatVault = IAutoMovieMotionHumanSquatVault.IParams;
}
