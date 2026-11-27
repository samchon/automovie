import type { IAutoMovieHumanTrunkQuadrant } from "./IAutoMovieHumanTrunkQuadrant";
import type { IAutoMovieHumanTrunkSection } from "./IAutoMovieHumanTrunkSection";

/**
 * Closed left-side guide identities and the sector pairs that carry crotch-fold
 * displacement.
 *
 * The interface package owns these declarations; AutoMovieHumanTrunkGuides in
 * Human supplies their runtime values.
 */
export namespace IAutoMovieHumanTrunkGuides {
  /** A guide of the canonical left side. */
  export type Guide =
    | "frontMidline"
    | "bustLine"
    | "anteriorAxillary"
    | "midAxillary"
    | "posteriorAxillary"
    | "scapular"
    | "backMidline";

  /**
   * A left sector: the quadrant it lies on, its two guides and whether the
   * crotch fold acts on it.
   */
  export interface ISector {
    /** The sector's name in findings. */
    name: string;

    /** The quadrant the sector lies on. */
    side: IAutoMovieHumanTrunkQuadrant.Side;

    /** Its first and second guide. */
    guides: readonly [Guide, Guide];

    /** Whether the crotch fold or the gluteal cleft's displacement acts on it. */
    folded: boolean;

    /** The lateral shares of its first and second guide in a section. */
    shares: (s: IAutoMovieHumanTrunkSection) => [number, number];
  }

  /**
   * The speeds argument of AutoMovieHumanTrunkGuides.sector. A sector of a
   * section: its jet at a phase between its guides' knots, per radian (point,
   * first and second derivatives), its guides' jets read once without the
   * crotch fold.
   *
   * @param sector The sector.
   * @param s The section's measures.
   * @param speeds Its guides' speeds, mm per radian.
   * @returns The sector's jet function.
   */
  export type SectorSpeeds = readonly [number, number];
}
