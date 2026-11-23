import type { IAutoMovieMotionHumanEdgeRescue } from "../lexicon/IAutoMovieMotionHumanEdgeRescue";

/**
 * A rescue from an edge. A rescuer and a faller each play a role, planned together on one ledge scene. The code defines no timing from a study; the scene is authored (provisional).
 *
 * @template Chain The chain every method returns; the chain implements this interface.
 */
export interface IAutoMovieMotionHumanRescue<Chain> {
  /**
   * The cliffhanger rescue: one person hangs from a named ledge's lip and loses the grip; the other, braced prone at the lip, catches the falling wrist in a mutual grip and hauls them up and over onto the top, both ending kneeling above the edge.
   *
   * @param params The `role` and `partner` of `IAutoMovieMotionHumanEdgeRescue.IParams`, with those of `IScene`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  edgeRescue(
    params: IAutoMovieMotionHumanEdgeRescue.IParams,
    anchor?: string,
  ): Chain;
}
