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
