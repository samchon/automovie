import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMoviePhysicalSupportPatch } from "./IAutoMoviePhysicalSupportPatch";

/**
 * One measured floor application point and its Coulomb coefficient. No handle or borrowed manifold survives this collection.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the collider carrier, world application point and source of the friction coefficient. Separates actual floor samples from the positive-impulse loaded flag.
 * @evidence contracts/development/design.md#principled-representation World metres and a dimensionless combined Coulomb coefficient describe one measured floor constraint. Extends the canonical balance support with constraint samples; loaded distinguishes a touching constraint from measured positive load.
 * @evidence contracts/development/design.md#minimal-and-owned-surface collectPhysicalSupports copies manifold facts for support-wrench allocation; no native manifold handle escapes. collectPhysicalSupports supplies balance assessment and wrench allocation from one collected contact population.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The carrier is the segment actually owning the contact, which may differ from the pattern endpoint. Zero-load constraints remain available to allocation; a nominal full sole is never substituted for measured points.
 */
export namespace IAutoMovieCollectPhysicalSupports {
  /**
   * One measured floor application point and its Coulomb coefficient.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Identifies the collider carrier, world application point and source of the friction coefficient.
   * @evidence contracts/development/design.md#principled-representation World metres and a dimensionless combined Coulomb coefficient describe one measured floor constraint.
   * @evidence contracts/development/design.md#minimal-and-owned-surface collectPhysicalSupports copies manifold facts for support-wrench allocation; no native manifold handle escapes.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The carrier is the segment actually owning the contact, which may differ from the pattern endpoint.
   */
  export interface IPoint {
    /** Collider-owning segment; a distal endpoint does not carry every patch contact. */
    carrier: string;
    /** World metres. */
    point: IAutoMovieVector3;
    /** Actual native combined coefficient, or the declared mean for a solved compliant-surface receipt fallback. */
    friction: number;
  }

  /**
   * No handle or borrowed manifold survives this collection.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Separates actual floor samples from the positive-impulse loaded flag.
   * @evidence contracts/development/design.md#principled-representation Extends the canonical balance support with constraint samples; loaded distinguishes a touching constraint from measured positive load.
   * @evidence contracts/development/design.md#minimal-and-owned-surface collectPhysicalSupports supplies balance assessment and wrench allocation from one collected contact population.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Zero-load constraints remain available to allocation; a nominal full sole is never substituted for measured points.
   */
  export interface ISupport extends IAutoMoviePhysicalSupportPatch {
    /** A touching upward constraint carried a positive actual native or compliant-solver impulse. Zero-load constraints remain available for wrench allocation. */
    loaded: boolean;
    /** Actual floor constraints, not a complete nominal sole. */
    samples: IAutoMovieCollectPhysicalSupports.IPoint[];
  }
}
