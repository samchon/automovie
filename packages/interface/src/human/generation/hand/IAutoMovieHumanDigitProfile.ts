import type { IAutoMovieHumanDigitSection } from "../IAutoMovieHumanDigitSection";

/**
 * Digit section evaluators, joint windows and nail dimensions along a
 * millimetre centre-line clock.
 *
 * The interface package owns these declarations; AutoMovieHumanDigitProfile in
 * Human supplies their runtime values.
 */
export namespace IAutoMovieHumanDigitProfile {
  /** The digit's base section and its loci along the line, mm. */
  export interface IInput {
    /**
     * The digit's own section at an arc length along the line: half width,
     * palmar and dorsal depths.
     */
    base: (s: number) => [number, number, number];

    /** Arc length of the digit's root, where its own sections start. */
    root: number;

    /**
     * Arc lengths of the two distal joints (PIP and DIP, or the thumb's MCP and
     * IP).
     */
    joints: readonly [number, number];

    /** Arc length of the apex. */
    length: number;

    /** Arc length where the tip's cap starts. */
    cap: number;

    /** Half length of a joint's turn, per joint radius (the elbow's softness). */
    softness: number;

    /**
     * True for the thumb, whose base sections are its own and whose creases
     * stand at its two joints.
     */
    thumb: boolean;
  }

  /** A relief's window along the line. */
  export interface IWindow {
    /** Arc length of the window's centre, mm. */
    at: number;

    /** Half width of the window along the line, mm. */
    half: number;
  }

  /**
   * The root argument of AutoMovieHumanDigitProfile.span. A finger's base
   * section from the span law, scaled to its root section.
   *
   * @param root The finger's own half width and half depth at its root, mm.
   * @param stations Arc lengths of the root, PIP, DIP and the cap's start, mm.
   */
  export type SpanRoot = readonly [number, number];

  /**
   * The stations argument of AutoMovieHumanDigitProfile.span. A finger's base
   * section from the span law, scaled to its root section.
   *
   * @param root The finger's own half width and half depth at its root, mm.
   * @param stations Arc lengths of the root, PIP, DIP and the cap's start, mm.
   */
  export type SpanStations = readonly [number, number, number, number];

  /**
   * Result of AutoMovieHumanDigitProfile.span. A finger's base section from the
   * span law, scaled to its root section.
   *
   * @param root The finger's own half width and half depth at its root, mm.
   * @param stations Arc lengths of the root, PIP, DIP and the cap's start, mm.
   */
  export type SpanResult = (s: number) => [number, number, number];

  /**
   * Result of AutoMovieHumanDigitProfile.nail. The nail plate's window along
   * the line: its root, its free edge at the cap's start, and its width, the
   * window the skin's nail part takes on the digit's chain.
   *
   * @param input The digit's base and loci.
   */
  export type INailResult = {
    /** Proximal nail-plate station along the digit's centre line, millimetres. */
    root: number;
    /**
     * Free nail edge at the distal cap's start, millimetres along the digit's
     * centre line.
     */
    edge: number;
    /** Nail plate's full transverse width, millimetres. */
    width: number;
  };

  /**
   * Result of AutoMovieHumanDigitProfile.of. The section shape at every arc
   * length.
   *
   * @param input The digit's base and loci.
   */
  export type OfResult = (s: number) => IAutoMovieHumanDigitSection.IShape;
}
