/**
 * Phalanx identity and normalized palmar/dorsal section proportions relative to a root half-width.
 *
 * The interface package owns these declarations; AutoMovieHumanDigitSpan in Human supplies their runtime values.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Phalanx identity and normalized palmar/dorsal section proportions relative to a root half-width. Member comments specify the individual units, frames and optional-value meanings.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace groups only Phalanx, IKnot, IInput declarations; it adds no runtime state, fixture dispatch or alternate implementation. Each member retains its own concrete data or callable representation.
 * @evidence contracts/development/design.md#principled-representation Phalanx, IKnot, IInput separate the declared inputs, results and related quantities. Their numeric domains and geometric consistency remain the Human producers' and engine operators' runtime responsibility; the namespace introduces no additional frame or clock.
 * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieHumanDigitSpan exchanges the named Phalanx, IKnot, IInput contracts with its Human callers. Interface owns these type declarations without importing that implementation.
 */
export namespace IAutoMovieHumanDigitSpan {
  /** Which phalanx.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Which phalanx.
   * @evidence contracts/development/design.md#principled-representation Which phalanx. The closed alternatives are "proximal", "middle", "distal".
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanDigitSpan.shape. Also types AutoMovieHumanDigitProfile.phalanx, AutoMovieHumanDigitSpan.START.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanDigitProfile.phalanx, AutoMovieHumanDigitSpan.START, AutoMovieHumanDigitSpan.shape for which phalanx.
   */
  export type Phalanx = "proximal" | "middle" | "distal";

  /** The three shares at one station, over the root half width.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation The three shares at one station, over the root half width.
   * @evidence contracts/development/design.md#principled-representation `width`: Half width. `palmar`: Palmar depth from the bone. `dorsal`: Dorsal depth from the bone.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Also types AutoMovieHumanFootToeTaper.knots, AutoMovieHumanFootToeTaper.first.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `width`, `palmar`, `dorsal`; callers supply the complete record.
   */
  export interface IKnot {
    /** Half width. */
    width: number;

    /** Palmar depth from the bone. */
    palmar: number;

    /** Dorsal depth from the bone. */
    dorsal: number;
  }

  /** A span's fixed inputs.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A span's fixed inputs.
   * @evidence contracts/development/design.md#principled-representation `root`: The finger's root half width, mm. `apex`: Section palmar apex share, as a share of the ellipse's curvature (1 is the ellipse).
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanDigitSpan.shape.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `root`, `apex`; callers supply the complete record.
   */
  export interface IInput {
    /** The finger's root half width, mm. */
    root: number;

    /** Section palmar apex share, as a share of the ellipse's curvature (1 is the ellipse). */
    apex: number;
  }
}
