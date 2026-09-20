import { IAutoMovieSemanticMask } from "./IAutoMovieSemanticMask";
import { IAutoMovieSemanticMaskCoverage } from "./IAutoMovieSemanticMaskCoverage";

/**
 * One shot's palette and runtime coverage captured as one indivisible fact.
 *
 * @evidence requirements/rendering/passes-channels-and-products.md#rendering-identity-mask-channels Exposes `IAutoMovieSemanticMaskEvidence` as the portable data boundary for same-frame palette and coverage evidence.
 * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-pass-products Types `IAutoMovieSemanticMaskEvidence` for the semantic render-product closure.
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
