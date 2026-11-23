/**
 * An action target that is a heading relative to the actor's current facing (0
 * ahead, +90 its left), so the model can say "walk off to the left" without
 * inventing world coordinates.
 *
 * No engine path resolves the heading yet: a `locomote` toward a direction
 * target steps in place, and every other verb refuses it because it names no
 * place. `resolveTargetPoint` answers `null` for it.
 */
export interface IAutoMovieDirectionTarget {
  /** Selects an actor-relative heading as the target representation. */
  kind: "direction";

  /** Heading in degrees relative to the actor's facing: 0 ahead, +90 left. */
  headingDeg: number;
}
