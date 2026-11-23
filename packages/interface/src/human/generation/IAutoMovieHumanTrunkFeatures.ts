import type { IAutoMovieLoftRelief } from "../../construction/IAutoMovieLoftRelief";

/**
 * Type contracts exchanged by AutoMovieHumanTrunkFeatures; runtime evaluation
 * remains in Human.
 */
export namespace IAutoMovieHumanTrunkFeatures {
  /** What the features stand on: landmark heights and the tapes that size them. */
  export interface ISites {
    /** Crotch height, mm. */
    crotch: number;

    /** Buttock point height, mm. */
    buttock: number;

    /** Iliocristale height, mm. */
    iliocristale: number;

    /** Omphalion height, mm. */
    omphalion: number;

    /** Natural waist height, mm: the row where the furrow's phase span is read. */
    waist: number;

    /** Inframammary fold height, mm. */
    fold: number;

    /** Bust point height, mm. */
    bust: number;

    /** Axilla height, mm: the top of the trunk's chain. */
    axilla: number;

    /** The furrow's lower end, mm. */
    furrowFrom: number;

    /** The bust span, mm: the breadth between the bust points. */
    bustSpan: number;

    /**
     * The breasts' projection over the chest wall at the bust point, mm: what
     * the chest tape closes over the wall.
     */
    projection: number;

    /**
     * What the base's back lacks at the buttock point for the buttock's depth,
     * mm: the buttock's projection.
     */
    buttockProjection: number;

    /** The crotch-to-cervicale span, mm: the blades' reach is a share of it. */
    span: number;

    /**
     * Height of the neck's bottom ring, the shoulders' top, mm: the windows
     * near the neck stay under it.
     */
    neck: number;
  }

  /**
   * The make argument of AutoMovieHumanTrunkFeatures.guarded. An optional
   * piece's windows, or none and one diagnostic when it breaks its contract.
   *
   * @param producer The piece's name.
   * @param level Its construction level.
   * @param diagnostics The list a broken piece is recorded in.
   * @param make The piece's windows.
   * @returns The windows, or none.
   */
  export type GuardedMake = () => IAutoMovieLoftRelief[];
}
