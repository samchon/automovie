import type { IAutoMovieMotionHumanEdgeRescue } from "../lexicon/IAutoMovieMotionHumanEdgeRescue";

/**
 * A rescue from an edge. A rescuer and a faller each play a role, planned
 * together on one ledge scene. The code defines no timing from a study; the
 * scene is authored (provisional).
 *
 * A method here is a method of `HumanChain` when its name is in
 * `AutoMovieMotionHumanActionName`. Any other member is a registered law or
 * row: pass it in `laws: [...]` to the performance, taking it from
 * `AutoMovieMotionHumanRescue` or from the row namespace of the family, and
 * append it with `chain.registered("<name>", params)`. A member that is a
 * function, a reader or a layer says so in its own comment.
 *
 * @template Chain The chain every method returns; the chain implements this
 *   interface.
 */
export interface IAutoMovieMotionHumanRescue<Chain> {
  /**
   * The cliffhanger rescue: one person hangs from a named ledge's lip and loses
   * the grip; the other, braced prone at the lip, catches the falling wrist in
   * a mutual grip and hauls them up and over onto the top, both ending kneeling
   * above the edge.
   *
   * Registered law: `registered("edgeRescue", params)`; not a chain method.
   *
   * @param params The `role` and `partner` of
   *   `IAutoMovieMotionHumanEdgeRescue.IParams`, with those of `IScene`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  edgeRescue(
    params: IAutoMovieMotionHumanEdgeRescue.IParams,
    anchor?: string,
  ): Chain;
}
