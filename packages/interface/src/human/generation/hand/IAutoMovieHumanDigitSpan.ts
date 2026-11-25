/**
 * Phalanx identity and normalized palmar/dorsal section proportions relative to
 * a root half-width.
 *
 * The interface package owns these declarations; AutoMovieHumanDigitSpan in
 * Human supplies their runtime values.
 */
export namespace IAutoMovieHumanDigitSpan {
  /** Which phalanx. */
  export type Phalanx = "proximal" | "middle" | "distal";

  /** The three shares at one station, over the root half width. */
  export interface IKnot {
    /** Half width. */
    width: number;

    /** Palmar depth from the bone. */
    palmar: number;

    /** Dorsal depth from the bone. */
    dorsal: number;
  }

  /** A span's fixed inputs. */
  export interface IInput {
    /** The finger's root half width, mm. */
    root: number;

    /**
     * Section palmar apex share, as a share of the ellipse's curvature (1 is
     * the ellipse).
     */
    apex: number;
  }
}
