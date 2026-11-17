import type { IAutoMovieCubicBezierCurve64 } from "../../geometry/curve/IAutoMovieCubicBezierCurve64";
import type {
  IAutoMovieRecoveryHermiteCurve,
  IAutoMovieRecoverySlabsInput,
} from "../../index";

/** Acquisition owner for ordered source cuts and equality-gated saved-cubic correspondence.
 * Source bytes and stage receipts remain the existing program's responsibility.
 * Both operations return acquisition metadata and never replace generated or saved skin.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Members document original versus local addresses, physical units, caller byte verification, unavailable maps and the limits of replay qualification.
 * @evidence contracts/development/design.md#principled-representation Original source/selection identities and saved-plane addresses distinguish raw cut incidence from equality-gated cubic replay correspondence.
 * @evidence contracts/development/design.md#minimal-and-owned-surface observeCuts and bindSavedFits consume IAutoMovieRecoveryOrderedLineage records; the host remains responsible for verifying actual bytes.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A new accepted replay trace proves saved numeric cubic equality only, never historical trace identity, material phase or a replacement fitted surface.
 */

export namespace IAutoMovieRecoveryOrderedLineage {
  /** Registered immutable mesh and complete saved-plane population for one source selection.
   * Source identities are compared opaque strings; the adapter verifies actual bytes.
   * @evidence contracts/development/design.md#principled-representation Extending the existing slab input without slabPairs retains its mesh, physical frame, alias and complete saved-publication premises; originalTriangleIds adds the explicit local-to-original face injection checked by observeCuts.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One input serves both metadata operations; only bindSavedFits separately receives saved coefficients and the original fitting policy.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The declaration contains no anatomical selector, fitted coordinates, native control override or source-specific count; identities do not claim to hash borrowed arrays.
   * @evidence contracts/development/common.md#meaningful-documentation The added member identifies its ordinal spaces and direction; inherited members retain the slab contract's units, immutability and caller hash obligations.
   */
  export interface Input extends Omit<
    IAutoMovieRecoverySlabsInput,
    "slabPairs"
  > {
    /** Injective local input face ordinal to complete original native face ordinal; no vertex remapping is implied. */
    originalTriangleIds: readonly number[];
  }

  /** Explicit saved cubic and its caller-bound original numerical fit policy.
   * This operation supports the stored cubic basis only, not a reduction of another degree or rational curve.
   * @evidence contracts/development/design.md#principled-representation Physical plane/raw contour/artifact addresses select one immutable published cubic; its recorded tolerance, budget, corner policy and orientation define the existing fitter replay problem.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Coefficients and fit policy are admitted only by bindSavedFits; coefficient-free observeCuts consumes neither.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The target has no person key, relaxed replacement policy, nearest-root hint or source mesh/normal fallback; its identity cannot certify historical accepted parameters.
   * @evidence contracts/development/common.md#meaningful-documentation Members state physical phase, raw-publication addressing, actual policy units and the caller's responsibility for byte-bound policy provenance.
   */
  export interface Target {
    /** Original physical source plane in registered mm. */
    coordinateMm: number;

    /** Raw contour ordinal, not a fitted loop index. */
    contourIndex: number;

    /** Verified saved artifact dependency containing the target publication. */
    observationIdentity: string;

    /** Unchanged saved physical-h cubic in its original Bernstein or Hermite basis. */
    curve: IAutoMovieCubicBezierCurve64 | IAutoMovieRecoveryHermiteCurve;

    /** Caller-bound actual historical fitting settings; no inference from output size. */
    policy: {
      /** Requested source-polyline correspondence tolerance in mm. */
      toleranceMm: number;

      /** Original fitter span budget, a positive integer. */
      maxSpans: number;

      /** Declared C0-corner threshold in degrees. */
      cornerDegrees: number;

      /** Actual material-side orientation convention, not inferred anatomical direction. */
      sourceOrientationSign: 1 | -1;
    };
  }
}
