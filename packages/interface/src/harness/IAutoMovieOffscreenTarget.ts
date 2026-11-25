/**
 * A target that is a frame edge, meant for an exit or a glance "off-screen
 * left" that needs no invented world coordinates.
 *
 * No engine path resolves an edge yet, since it depends on the camera that
 * frames the shot: a `locomote` toward one steps in place, every other verb
 * refuses it because it names no place, and `resolveTargetPoint` answers `null`
 * for it.
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
