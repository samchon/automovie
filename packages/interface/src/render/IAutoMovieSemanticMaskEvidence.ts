import { IAutoMovieSemanticMask } from "./IAutoMovieSemanticMask";
import { IAutoMovieSemanticMaskCoverage } from "./IAutoMovieSemanticMaskCoverage";

/** One shot's palette and runtime coverage captured as one indivisible fact. */
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
