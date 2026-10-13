import { IAutoMovieSemanticMask } from "./IAutoMovieSemanticMask";
import { IAutoMovieSemanticMaskCoverage } from "./IAutoMovieSemanticMaskCoverage";

/**
 * One exact shot's semantic palette and runtime coverage observed together.
 *
 * @evidence contracts/common.md#principled-implementation Capture supplies an atomic palette-plus-coverage observation and production verifies exact shot identity, full semantic digest and coverage shape before classifying completeness.
 * @evidence contracts/common.md#clear-and-simple-design One envelope prevents a valid palette from one scene being paired with an unrelated scene's coverage list.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unresolved or unaddressed runtime drawables remain explicit and prevent complete evidence; a foreign shot or unsupported envelope cannot be cast into current mask coverage.
 * @evidence contracts/common.md#meaningful-documentation Defines envelope version, exact compiled shot and same-frame palette/coverage ownership.
 * @author Samchon
 */
export interface IAutoMovieSemanticMaskEvidence {
  /** Evidence envelope schema. */
  version: 1;

  /** Exact compiled shot whose drawn scene was audited. */
  shot: string;

  /** Verified current semantic palette. */
  mask: IAutoMovieSemanticMask;

  /** Coverage observed from the same built frame. */
  coverage: IAutoMovieSemanticMaskCoverage;
}
