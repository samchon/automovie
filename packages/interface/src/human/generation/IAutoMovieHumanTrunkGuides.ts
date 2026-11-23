import type { IAutoMovieHumanTrunkQuadrant } from "./IAutoMovieHumanTrunkQuadrant";
import type { IAutoMovieHumanTrunkSection } from "./IAutoMovieHumanTrunkSection";

/**
 * Closed left-side guide identities and the sector pairs that carry crotch-fold displacement.
 *
 * The interface package owns these declarations; AutoMovieHumanTrunkGuides in Human supplies their runtime values.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Closed left-side guide identities and the sector pairs that carry crotch-fold displacement. Member comments specify the individual units, frames and optional-value meanings.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace groups only Guide, ISector, SectorSpeeds declarations; it adds no runtime state, fixture dispatch or alternate implementation. Each member retains its own concrete data or callable representation.
 * @evidence contracts/development/design.md#principled-representation Guide, ISector, SectorSpeeds separate the declared inputs, results and related quantities. Their numeric domains and geometric consistency remain the Human producers' and engine operators' runtime responsibility; the namespace introduces no additional frame or clock.
 * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieHumanTrunkGuides exchanges the named Guide, ISector, SectorSpeeds contracts with its Human callers. Interface owns these type declarations without importing that implementation.
 */
export namespace IAutoMovieHumanTrunkGuides {
  /** A guide of the canonical left side.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A guide of the canonical left side.
   * @evidence contracts/development/design.md#principled-representation A guide of the canonical left side. The closed alternatives are "frontMidline", "bustLine", "anteriorAxillary", "midAxillary", "posteriorAxillary", "scapular", "backMidline".
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanTrunkGuides.jet. Also types AutoMovieHumanTrunkGuides.ORDER, AutoMovieHumanTrunkGuides.KNOT.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanTrunkGuides.ORDER, AutoMovieHumanTrunkGuides.KNOT, AutoMovieHumanTrunkGuides.jet, AutoMovieHumanTrunkGuides.sector for a guide of the canonical left side.
   */
  export type Guide =
    | "frontMidline"
    | "bustLine"
    | "anteriorAxillary"
    | "midAxillary"
    | "posteriorAxillary"
    | "scapular"
    | "backMidline";

  /** A left sector: the quadrant it lies on, its two guides and whether the crotch fold acts on it.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A left sector: the quadrant it lies on, its two guides and whether the crotch fold acts on it.
   * @evidence contracts/development/design.md#principled-representation `name`: The sector's name in findings. `side`: The quadrant the sector lies on. `guides`: Its first and second guide.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanTrunkGuides.sector. Also types AutoMovieHumanTrunkGuides.SECTORS, AutoMovieHumanTrunkRing.SECTORS.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `name`, `side`, `guides`, `folded`, `shares`; callers supply the complete record.
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

    /**
     * The lateral shares of its first and second guide in a section.
     *
     * @evidence contracts/development/common.md#meaningful-documentation The lateral shares of its first and second guide in a section.
     */
    shares: (s: IAutoMovieHumanTrunkSection) => [number, number];
  }

  /** The speeds argument of AutoMovieHumanTrunkGuides.sector. A sector of a section: its jet at a phase between its guides' knots, per
  radian (point, first and second derivatives), its guides' jets read once
  without the crotch fold.
  @param sector The sector.
  @param s The section's measures.
  @param speeds Its guides' speeds, mm per radian.
  @returns The sector's jet function.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation A sector of a section: its jet at a phase between its guides' knots, per radian (point, first and second derivatives), its guides' jets read once without the crotch fold.
 * @evidence contracts/development/design.md#principled-representation A sector of a section: its jet at a phase between its guides' knots, per radian (point, first and second derivatives), its guides' jets read once without the crotch fold. The outer tuple/array is readonly; nested element types determine whether their contents can change.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanTrunkGuides.SectorSpeeds is the canonical exchange used by AutoMovieHumanTrunkGuides.sector.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanTrunkGuides.sector for a sector of a section: its jet at a phase between its guides' knots, per radian (point, first and second derivatives), its guides' jets read once without the crotch fold.
 */
  export type SectorSpeeds = readonly [number, number];
}
