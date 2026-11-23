import type { IAutoMovieMotionHumanEdgeRescue } from "../lexicon/IAutoMovieMotionHumanEdgeRescue";

/**
 * A rescue from an edge. A rescuer and a faller each play a role, planned together on one ledge scene. The code defines no timing from a study; the scene is authored (provisional).
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
   * @param params The `role` and `partner` of `IAutoMovieMotionHumanEdgeRescue.IParams`, with those of `IScene`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   */
  edgeRescue(
    params: IAutoMovieMotionHumanEdgeRescue.IParams,
    anchor?: string,
  ): Chain;
}
