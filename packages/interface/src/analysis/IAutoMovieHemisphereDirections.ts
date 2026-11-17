import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * Data and callback contracts shared by the HemisphereDirections operations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Deterministic cosine-weighted unit directions over the hemisphere around `normal`, `count` of them in index order. Member documentation states the supplied records, units and absence meanings used by autoMovieHemisphereDirections.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Plain numbers do not bound allocation or prove a usable normal; the direction generator owns those numeric checks and count has no upper allocation cap.
 * @evidence contracts/development/design.md#principled-representation normal determines the hemisphere axis and count determines the ordered sample population; autoMovieHemisphereDirections normalizes a finite usable axis and requires a positive safe-integer count.
 * @evidence contracts/development/design.md#minimal-and-owned-surface interface owns IAutoMovieHemisphereDirections, used by autoMovieHemisphereDirections. Its IProps members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
 */
export namespace IAutoMovieHemisphereDirections {
  /**
   * Deterministic cosine-weighted unit directions over the hemisphere around
   * `normal`, `count` of them in index order.
   *
   * The set is a Hammersley sequence mapped by Malley's method, so it is a
   * property of the normal and sample count: no random state, no host entropy, the
   * same directions in the same order on Windows and POSIX. Cosine weighting is
   * what makes the estimator exact for the case that matters most: a plane facing
   * the ground's own up with nothing above it sees every one of its directions,
   * so the estimate of an isotropic sky's contribution collapses to the declared
   * horizontal illuminance with no sampling error in ideal arithmetic. A tilted
   * plane loses the directions that point below the horizon, and the fraction it
   * loses does carry sampling error.
   *
   * `normal` need not be unit length; it is normalized first. Throws when `count`
   * is not a positive safe integer, or when `normal` has a non-finite component
   * or a measured norm that is nonfinite or `1e-12` or less. Memory grows with `count`, which has no upper
   * bound here.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Deterministic cosine-weighted unit directions over the hemisphere around `normal`, `count` of them in index order. Member documentation states the supplied records, units and absence meanings used by autoMovieHemisphereDirections.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Plain numbers do not bound allocation or prove a usable normal; the direction generator owns those numeric checks and count has no upper allocation cap.
   * @evidence contracts/development/design.md#principled-representation normal determines the hemisphere axis and count determines the ordered sample population; autoMovieHemisphereDirections normalizes a finite usable axis and requires a positive safe-integer count.
   * @evidence contracts/development/design.md#minimal-and-owned-surface interface owns IAutoMovieHemisphereDirections.IProps, used by autoMovieHemisphereDirections. Its normal, count members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
   */
  export type IProps = {
    /** Axis of the hemisphere; any finite non-zero length. */
    normal: IAutoMovieVector3;

    /** Number of directions, a positive safe integer. */
    count: number;
  };
}
