/**
 * An action target that is a **heading relative to the actor's current facing**
 * (0 = ahead, +90 = its left), so the model can say "walk off to the left"
 * without inventing world coordinates.
 *
 * No engine path resolves the heading yet: a `locomote` toward a direction
 * target steps in place, and every other verb refuses it because it names no
 * place.
 *
 * @evidence contracts/common.md#principled-implementation An actor-relative heading in degrees with the yaw sign convention of `IAutoMovieYawPitch` (0 ahead, +90 left), which needs only the actor's facing to become a world direction; no engine path performs that conversion yet, an unresolved limitation.
 * @evidence contracts/common.md#clear-and-simple-design One angle plus the discriminant; how far to travel is left to the verb, so the target states which way and nothing else.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No heading value is special-cased or range-checked; because nothing reads `headingDeg`, `performShot` applies no check to it and a `locomote` toward any heading steps in place.
 * @evidence contracts/common.md#meaningful-documentation States the reference forward, the sign convention and degree unit, and that no verb realizes the heading today.
 * @author Samchon
 */
export interface IAutoMovieDirectionTarget {
  /** Selects an actor-relative heading as the target representation. */
  kind: "direction";

  /** Heading in degrees, relative to the actor's facing (0 = ahead). */
  headingDeg: number;
}
