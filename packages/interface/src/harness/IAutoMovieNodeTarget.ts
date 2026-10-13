/**
 * A target that is a staged scene node, a camera included. Prefer it over a
 * literal {@link IAutoMoviePointTarget} whenever the target is a thing in the
 * scene, because the engine reads the node's own placement instead of a copied
 * coordinate.
 *
 * `performShot` refuses a blank id and a node that does not resolve. Actor
 * verbs (`lookAt`, `reach`, `locomote`, the `point` and `strike` gestures) read
 * the node's staged placement, or where a previous beat left it, so they do not
 * follow a node that moves during the same shot unless the host supplies a
 * live target resolver; `lookAt` lifts an actor node to its eye height. A
 * camera frames the box the node's model draws and follows its compiled motion,
 * and a `launch` leads a node whose actions include a `locomote`.
 *
 * @evidence contracts/common.md#principled-implementation `resolveTargetPoint` maps the id through the placement table the shot staged or resumed, and the framing and launch paths sample the node's compiled clip, so every consumer reads the same placement.
 * @evidence contracts/common.md#clear-and-simple-design One id is the whole target; position, rig and motion belong to the staged node, so the record copies none of them.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An unknown id is refused with a located violation instead of resolving to the origin, and the documentation states which consumers follow motion and which do not.
 * @evidence contracts/common.md#meaningful-documentation States when to prefer it, the refusals, and per consumer where the position comes from and whether it moves; the member says which ids it accepts.
 * @author Samchon
 */
export interface IAutoMovieNodeTarget {
  /** Selects a staged scene node as the target representation. */
  kind: "node";

  /** Staged scene node or camera id pointed at. */
  node: string;
}
