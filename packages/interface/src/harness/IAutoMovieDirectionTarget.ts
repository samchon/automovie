/**
 * An action target that is a heading relative to the actor's current facing
 * (0 ahead, +90 its left), so the model can say "walk off to the left" without
 * inventing world coordinates.
 *
 * No engine path resolves the heading yet: a `locomote` toward a direction
 * target steps in place, and every other verb refuses it because it names no
 * place. `resolveTargetPoint` answers `null` for it.
 *
 * @evidence contracts/common.md#principled-implementation A heading in the actor's own frame uses the same sign convention as `aimYawPitch`'s yaw, positive toward the actor's left, so a future resolver can rotate it by the staged facing about +Y without a new convention.
 * @evidence contracts/common.md#clear-and-simple-design One angle field states a relative goal; distance and destination are left to the verb, so the record carries no coordinates the model would have to invent.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The engine does not guess a destination from the heading; the locomote synthesizer steps in place and `positionalTargetFault` refuses it elsewhere, and the gap is stated here.
 * @evidence contracts/common.md#meaningful-documentation States the frame and sign of the heading, the intended use, and exactly what each verb does with the unresolved target today; the member gives the unit and zero.
 * @author Samchon
 */
export interface IAutoMovieDirectionTarget {
  /** Selects an actor-relative heading as the target representation. */
  kind: "direction";

  /** Heading in degrees relative to the actor's facing: 0 ahead, +90 left. */
  headingDeg: number;
}
