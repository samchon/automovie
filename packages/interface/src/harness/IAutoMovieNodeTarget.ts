/**
 * A target that is a staged scene node, a camera included. Prefer it over a
 * literal {@link IAutoMoviePointTarget} whenever the target is a thing in the
 * scene, because the engine reads the node's own placement instead of a copied
 * coordinate.
 *
 * performShot refuses a blank or unresolved id and can ask its host targetAt callback during admission. The reference actor synthesizer resolves node targets from staged or resumed placement tables; its live target callback is used only for bone targets, so the admission callback alone does not make a node-following gaze or reach. LookAt raises an actor node to its declared eye height. Camera framing follows compiled actor/object translation with an opening rest extent, while launch has its own locomotion-leading path.
 *
 * @evidence contracts/common.md#principled-implementation resolveTargetPoint reads the staged/resumed placement table; reference actor synthesis, camera following and launch leading then have distinct motion readers. Their current-input consistency is a host premise, and framing retains its opening height/radius rather than recomputing the deformed visible extent.
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
