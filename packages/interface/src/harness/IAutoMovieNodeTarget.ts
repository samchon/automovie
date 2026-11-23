/**
 * A target that is a staged scene node, a camera included. Prefer it over a
 * literal {@link IAutoMoviePointTarget} whenever the target is a thing in the
 * scene, because the engine reads the node's own placement instead of a copied
 * coordinate.
 *
 * PerformShot refuses a blank or unresolved id and can ask its host targetAt
 * callback during admission. The reference actor synthesizer resolves node
 * targets from staged or resumed placement tables; its live target callback is
 * used only for bone targets, so the admission callback alone does not make a
 * node-following gaze or reach. LookAt raises an actor node to its declared eye
 * height. Camera framing follows compiled actor/object translation with an
 * opening rest extent, while launch has its own locomotion-leading path.
 */
export interface IAutoMovieNodeTarget {
  /** Selects a staged scene node as the target representation. */
  kind: "node";

  /** Staged scene node or camera id pointed at. */
  node: string;
}
