/**
 * A target that is a frame edge, meant for an exit or a glance "off-screen
 * left" that needs no invented world coordinates.
 *
 * No engine path resolves an edge yet, since it depends on the camera that
 * frames the shot: a `locomote` toward one steps in place, every other verb
 * refuses it because it names no place, and `resolveTargetPoint` answers
 * `null` for it.
 *
 * @evidence contracts/common.md#principled-implementation An edge is a direction in the camera's frame, so a closed set of four names states the intent without coordinates for a future resolver to map through the framing camera.
 * @evidence contracts/common.md#clear-and-simple-design One closed field is the whole target, kept apart from the actor-relative `IAutoMovieDirectionTarget` because the two are relative to different frames.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The engine does not guess a world point for an edge; the locomote synthesizer steps in place and every other verb refuses it, and the gap is stated here.
 * @evidence contracts/common.md#meaningful-documentation States the intended use, that nothing resolves it and why, and exactly what each verb does with it today; the member lists the edges.
 * @author Samchon
 */
export interface IAutoMovieOffscreenTarget {
  /** Selects a frame edge as the target representation. */
  kind: "offscreen";

  /**
   * Intended exit edge. `left` and `right` name the sides of the picture; no
   * consumer defines `forward` or `back` yet.
   */
  edge: "left" | "right" | "forward" | "back";
}
