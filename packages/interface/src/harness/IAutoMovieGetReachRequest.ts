import { IAutoMovieReachTarget } from "./IAutoMovieReachTarget";

/**
 * Asks whether `actor` can reach `target` from where it stands, so a strike or
 * grab can be staged at a distance that connects before it is committed.
 *
 * No source in this repository answers this request: `readSlateContext`
 * excludes it by type, and no resolver or tool surface accepts it. The fields
 * record the intended question. The arm solve such a resolver would share is
 * `reachPose`, which `performShot` already uses for the `reach` verb and which
 * stops the hand on the reachable shell for a target out of range.
 *
 * @evidence contracts/common.md#principled-implementation A record of the question only: an actor, a target restricted by type to the kinds that can resolve to a point, and an optional beat and instant for sampling a moving bone.
 * @evidence contracts/common.md#clear-and-simple-design The target reuses the action target records through `IAutoMovieReachTarget`, so a query and an action name a node, bone, point or group with the same shape.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The documentation states that nothing answers the request instead of describing a resolver that does not exist, and relative targets are excluded by type rather than answered with a guessed point.
 * @evidence contracts/common.md#meaningful-documentation States the question, that nothing answers it and which function a resolver would share; members give the actor and target roles, the beat's role and the instant's unit, frame and intended default.
 * @author Samchon
 */
export interface IAutoMovieGetReachRequest {
  /** Selects the geometric reachability query. */
  type: "getReach";

  /** Staged actor node whose arm would reach. */
  actor: string;

  /** Node, live bone, literal point or group centroid to reach for. */
  target: IAutoMovieReachTarget;

  /** Built beat whose performed motion would place a bone target. */
  beat?: string;

  /** Shot-local seconds at which a bone target would be sampled, meant to default to 0. */
  t?: number;
}
