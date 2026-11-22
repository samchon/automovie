import type { IAutoMovieMotionHumanEdgeRescue } from "../lexicon/IAutoMovieMotionHumanEdgeRescue";

/**
 * Mechanism: Behaviour: a rescue from an edge. A rescuer and a faller each play a role, planned together on one ledge scene. The code defines no timing from a study; the scene is authored (provisional).
 *
 * @template Chain The chain every method returns; the chain implements this interface.
 * @evidence contracts/development/common.md#meaningful-documentation States the family's shared model and what its methods have in common.
 * @evidence contracts/development/design.md#principled-representation One method per law of the Rescue family, each taking the law's own parameter type.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The Rescue laws and nothing the other families own.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each method takes the existing parameter type of its law; nothing is redefined.
 */
export interface IAutoMovieMotionHumanRescue<Chain> {
  /**
   * The cliffhanger rescue: one person hangs from a named ledge's lip and loses the grip; the other, braced prone at the lip, catches the falling wrist in a mutual grip and hauls them up and over onto the top, both ending kneeling above the edge.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanRescue.edgeRescue: The cliffhanger rescue: one person hangs from a named ledge's lip and loses the grip; the other, braced prone at the lip, catches the falling wrist in a mutual grip and hauls them up and over onto the top, both ending kneeling above the edge.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanRescue.edgeRescue is provided by the chain that implements IAutoMovieMotionHumanRescue.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanRescue.edgeRescue is provided by the chain that implements IAutoMovieMotionHumanRescue.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanRescue.edgeRescue is provided by the chain that implements IAutoMovieMotionHumanRescue.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanRescue.edgeRescue is provided by the chain that implements IAutoMovieMotionHumanRescue.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanRescue.edgeRescue is provided by the chain that implements IAutoMovieMotionHumanRescue.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanRescue.edgeRescue is provided by the chain that implements IAutoMovieMotionHumanRescue.
   */
  edgeRescue(
    params: IAutoMovieMotionHumanRescue.IEdgeRescue,
    anchor?: string,
  ): Chain;
}

/**
 * The parameter types of the Rescue methods.
 */
export namespace IAutoMovieMotionHumanRescue {
  /**
   * The parameters of `edgeRescue`: `IAutoMovieMotionHumanEdgeRescue.IParams`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanEdgeRescue.IParams`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanEdgeRescue.IParams` owns the shape; the alias serves `edgeRescue` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type IEdgeRescue = IAutoMovieMotionHumanEdgeRescue.IParams;
}
