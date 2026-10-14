import { IAutoMovieSemanticMask } from "./IAutoMovieSemanticMask";
import { IAutoMovieSemanticMaskCoverage } from "./IAutoMovieSemanticMaskCoverage";

/**
 * One exact shot's semantic palette and runtime coverage observed together.
 *
 * @evidence contracts/common.md#principled-implementation The capture owner supplies palette and assembled-scene coverage together; production verifies version, exact shot, envelope keys, palette container schema/digest and coverage count/order before classifying gaps. The palette verifier does not rederive scalar values, colors, owner links or scene correspondence, and dense unresolved arrays remain a caller premise.
 * @evidence contracts/common.md#clear-and-simple-design One envelope carries palette and coverage at the shot boundary; their origin in the same scene and frame remains the supplying owner's responsibility rather than something the shape can establish.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unresolved or unaddressed runtime drawables remain explicit and prevent complete coverage; foreign shots and unsupported versions refuse. Empty coverage and a valid self-consistent digest do not independently prove draw provenance, current scene equality or complete per-slot allocation.
 * @evidence contracts/common.md#meaningful-documentation Defines envelope version, exact compiled shot and same-frame palette/coverage ownership.
 * @author Samchon
 */
export interface IAutoMovieSemanticMaskEvidence {
  /** Evidence envelope schema. */
  version: 1;

  /** Exact compiled shot whose drawn scene was audited. */
  shot: string;

  /** Supplied semantic palette whose container schema and canonical digest are verified at production admission; graph/scalar truth remains a producer premise. */
  mask: IAutoMovieSemanticMask;

  /** Assembled-scene membership coverage from the same capture context, as established by the supplying owner. */
  coverage: IAutoMovieSemanticMaskCoverage;
}
