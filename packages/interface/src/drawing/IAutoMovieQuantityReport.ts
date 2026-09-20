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
 * @evidence requirements/building-exterior/deliverables.md#building-exterior-schedules-quantities Exposes `IAutoMovieQuantityReport` as the portable data boundary for the building exterior schedules quantities requirement.
 * @evidence specifications/building-envelope/phases-deliverables-and-validation.md#building-envelope-deliverable-quantity-invariant Types `IAutoMovieQuantityReport` for the building envelope deliverable quantity invariant system contract.
 * @author Samchon
 */
export interface IAutoMovieQuantityReport {
  /**
   * Report format.
   *
   * @evidence requirements/building-exterior/deliverables.md#building-exterior-schedules-quantities Exposes `version` as the portable data boundary for the building exterior schedules quantities requirement.
   * @evidence specifications/building-envelope/phases-deliverables-and-validation.md#building-envelope-deliverable-quantity-invariant Types `version` for the building envelope deliverable quantity invariant system contract.
   */
  version: 1;

  /**
   * Versioned quantity protocol.
   *
   * @evidence requirements/building-exterior/deliverables.md#building-exterior-schedules-quantities Exposes `protocol` as the portable data boundary for the building exterior schedules quantities requirement.
   * @evidence specifications/building-envelope/phases-deliverables-and-validation.md#building-envelope-deliverable-quantity-invariant Types `protocol` for the building envelope deliverable quantity invariant system contract.
   */
  protocol: "automovie.quantity.v1";

  /**
   * Built environment this report was derived from.
   *
   * @evidence requirements/building-exterior/deliverables.md#building-exterior-schedules-quantities Exposes `environment` as the portable data boundary for the building exterior schedules quantities requirement.
   * @evidence specifications/building-envelope/phases-deliverables-and-validation.md#building-envelope-deliverable-quantity-invariant Types `environment` for the building envelope deliverable quantity invariant system contract.
   */
  environment: string;

  /**
   * One finding per subject, in the fixed subject order.
   *
   * @evidence requirements/building-exterior/deliverables.md#building-exterior-schedules-quantities Exposes `findings` as the portable data boundary for the building exterior schedules quantities requirement.
   * @evidence specifications/building-envelope/phases-deliverables-and-validation.md#building-envelope-deliverable-quantity-invariant Types `findings` for the building envelope deliverable quantity invariant system contract.
   */
  findings: IAutoMovieQuantityFinding[];

  /**
   * Derivations this report could not perform, in canonical order.
   *
   * @evidence requirements/building-exterior/deliverables.md#building-exterior-schedules-quantities Exposes `gaps` as the portable data boundary for the building exterior schedules quantities requirement.
   * @evidence specifications/building-envelope/phases-deliverables-and-validation.md#building-envelope-deliverable-quantity-invariant Types `gaps` for the building envelope deliverable quantity invariant system contract.
   */
  gaps: IAutoMovieDrawingGap[];

  /**
   * Digest over the whole record.
   *
   * @evidence requirements/building-exterior/deliverables.md#building-exterior-schedules-quantities Exposes `digest` as the portable data boundary for the building exterior schedules quantities requirement.
   * @evidence specifications/building-envelope/phases-deliverables-and-validation.md#building-envelope-deliverable-quantity-invariant Types `digest` for the building envelope deliverable quantity invariant system contract.
   */
  digest: AutoMovieContentDigest;
}
