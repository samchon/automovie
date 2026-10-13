/**
 * Asks for the world pose of `actor` at shot-local time `t`, so the next action
 * can be chained onto where a hand or foot actually ends up rather than onto a
 * re-derived guess.
 *
 * No source in this repository answers this request: `readSlateContext`
 * excludes it by type, and no resolver or tool surface accepts it. The closest
 * stored answer is a beat's end state through
 * {@link IAutoMovieGetBeatEndRequest}, which gives the articulation at the shot
 * end only.
 *
 * @evidence contracts/common.md#principled-implementation A record of the question only, an actor and a shot-local instant, which is the input a forward-kinematics sample of a performed clip needs.
 * @evidence contracts/common.md#clear-and-simple-design Two fields name the sample; which shot is sampled is left to the resolver's context, so the record carries no motion or skeleton of its own.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The documentation states that nothing answers the request and names the stored alternative instead of describing a resolver that does not exist.
 * @evidence contracts/common.md#meaningful-documentation States the question, that nothing answers it, and the stored request that covers the shot end; members give the actor role and the instant's unit and frame.
 * @author Samchon
 */
export interface IAutoMovieGetResolvedPoseRequest {
  /** Selects the query that samples an engine-resolved actor pose. */
  type: "getResolvedPose";

  /** Staged actor node whose pose is asked for. */
  actor: string;

  /** Shot-local time in seconds. */
  t: number;
}
