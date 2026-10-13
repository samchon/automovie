import { AutoMovieContentDigest } from "../production/AutoMovieContentDigest";
import { IAutoMovieDrawingGap } from "./IAutoMovieDrawingGap";
import { IAutoMovieQuantityFinding } from "./IAutoMovieQuantityFinding";

/**
 * Every quantity the design can currently answer for, and every one it cannot.
 *
 * Quantities come from geometry, not from a bill somebody typed: an area is the
 * area of an authored footprint and a length is the length of an authored
 * route, so a change to the design is a change to the quantity with nothing in
 * between to fall out of date.
 *
 * What the design cannot answer is stated as a gap rather than omitted or
 * defaulted to zero. Material take-off, layer thickness and pattern cut waste
 * all need declarations the design does not carry yet; a report that silently
 * left them out would read as a building that needs no material.
 *
 * {@link findings} always holds one finding per subject, so a quantity the
 * design has none of is a zero total rather than a missing finding.
 *
 * @evidence contracts/common.md#principled-implementation `measureAutoMovieQuantities` validates the environment, then sums shoelace footprint areas with holes subtracted, shell or cone-decomposed cell volumes, closed-form arc-corrected opening areas, polyline route lengths and occurrence counts per owner, and hashes a canonical text of the result with SHA-256.
 * @evidence contracts/common.md#clear-and-simple-design One finding per subject in the fixed `AUTOMOVIE_QUANTITY_SUBJECTS` order plus the gap shape the drawing also uses, so a consumer indexes findings by position and reads gaps with the same code for both artifacts.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Five gaps (material quantity, pattern cut waste, opening deduction, developed surface area, surface identity) are emitted on every report because the environment cannot answer them; they are declared limits, not values defaulted to zero.
 * @evidence contracts/common.md#meaningful-documentation Explains that quantities come from authored geometry, that unanswerable quantities are gaps, that every subject always has a finding, and which version, protocol and digest identify the record.
 * @author Samchon
 */
export interface IAutoMovieQuantityReport {
  /** Report format. */
  version: 1;

  /** Versioned quantity protocol. */
  protocol: "automovie.quantity.v1";

  /** Built environment this report was derived from. */
  environment: string;

  /** One finding per subject, in the fixed subject order. */
  findings: IAutoMovieQuantityFinding[];

  /** Derivations this report could not perform, in canonical order. */
  gaps: IAutoMovieDrawingGap[];

  /** Digest over the whole record. */
  digest: AutoMovieContentDigest;
}
