/** Type contracts exchanged by AutoMovieHumanHandWindow; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanHandWindow {
  /** A function's value and its first and second derivatives.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A function's value and its first and second derivatives.
   * @evidence contracts/development/design.md#principled-representation `value`: Value. `slope`: First derivative in the window's own coordinate. `curvature`: Second derivative in the window's own coordinate.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanHandWindow.bump.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `value`, `slope`, `curvature`; callers supply the complete record.
   */
  export interface IJet {
    /** Value. */
    value: number;

    /** First derivative in the window's own coordinate. */
    slope: number;

    /** Second derivative in the window's own coordinate. */
    curvature: number;
  }

  /**
   * An elliptic mass over the palmar skin, `h(s, t) = height D (1 - (s /
   * a)^2 - (t / b)^2)^3` with `a = length L` and `b = width W`: its height
   * over a depth `D` and its footprint's half extents over a length `L` and a
   * half width `W` of its own frame, all CONVENTIONS (no mass of the hand is
   * measured in the repository). It vanishes with slope and curvature at the
   * footprint's edge (rule J7), so it meets the skin under it without a seam.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation An elliptic mass over the palmar skin, `h(s, t) = height D (1 - (s / a)^2 - (t / b)^2)^3` with `a = length L` and `b = width W`: its height over a depth `D` and its footprint's half extents over a length `L` and a half width `W` of its own frame, all CONVENTIONS (no mass of the hand is measured in the repository).
   * @evidence contracts/development/design.md#principled-representation `height`: Height over the depth `D`. `length`: Footprint half length over the length `L`. `width`: Footprint half width over the half width `W`.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanHandWindow.mass. Also types AutoMovieHumanHandWindow.PULP, AutoMovieHumanHandWindow.HYPOTHENAR.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `height`, `length`, `width`; callers supply the complete record.
   */
  export interface IMass {
    /** Height over the depth `D`. */
    height: number;

    /** Footprint half length over the length `L`. */
    length: number;

    /** Footprint half width over the half width `W`. */
    width: number;
  }

  /** A mass's fixed sizes in its own frame, mm.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A mass's fixed sizes in its own frame, mm.
   * @evidence contracts/development/design.md#principled-representation `length`: The length `L` its footprint's half length is a share of. `width`: The half width `W` its footprint's half width is a share of. `depth`: The depth `D` its height is a share of.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanHandWindow.mass. Also types AutoMovieHumanDigitProfile.pad, AutoMovieHumanPalmRelief.hypothenar.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `length`, `width`, `depth`; callers supply the complete record.
   */
  export interface IMassSize {
    /** The length `L` its footprint's half length is a share of. */
    length: number;

    /** The half width `W` its footprint's half width is a share of. */
    width: number;

    /** The depth `D` its height is a share of. */
    depth: number;
  }
}
