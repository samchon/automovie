import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * An inclusive world-space axis-aligned box, in metres.
 *
 * @evidence contracts/development/common.md#meaningful-documentation An inclusive world-space axis-aligned box, in metres. Member documentation states the supplied records, units and absence meanings used by evaluateCameraClearance.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The vector pair cannot enforce finite ordered corners in TypeScript; evaluateCameraClearance uses bounds derived from admitted geometry rather than treating the pair as mesh-contact proof.
 * @evidence contracts/development/design.md#principled-representation min and max are componentwise world-space corners in metres for an inclusive axis-aligned camera-clearance proxy.
 * @evidence contracts/development/design.md#minimal-and-owned-surface interface owns IAutoMovieEvaluateCameraClearanceBox, used by evaluateCameraClearance. Its min, max members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
 */
export interface IAutoMovieEvaluateCameraClearanceBox {
  /** Smallest corner. */
  min: IAutoMovieVector3;

  /** Largest corner. */
  max: IAutoMovieVector3;
}
