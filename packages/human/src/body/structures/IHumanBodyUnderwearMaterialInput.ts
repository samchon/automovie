import type { IAutoMovieMaterial, IAutoMovieModel } from "@automovie/interface";

/**
 * Final source skin part and its aligned rest-material coverage.
 *
 * @evidence contracts/common.md#principled-implementation A final static skin part, render-aligned coverage and source ordinals define an independent lifted fabric split.
 * @evidence contracts/common.md#clear-and-simple-design The material input keeps the actual final part and its aligned field together.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The source skin frame remains the lift authority rather than a fitted garment replacement.
 * @evidence contracts/common.md#meaningful-documentation Members state source ordinals, registered material and signed metre lift.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The final fabric material inputs declares data and signatures without implementing runtime algorithms.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The final fabric material inputs declaration shares no computations across consumers.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The final fabric material inputs type has no runtime acquisition, retention or release operation.
 *
 * @author Samchon
 */
export interface IHumanBodyUnderwearMaterialInput {
  /** Final placed or stitched skin part, with its normal local frame. */
  part: IAutoMovieModel["parts"][number];

  /** Coverage aligned with final mesh render vertices. */
  field: readonly number[];

  /** Source or actual appended-stencil ordinals aligned with those vertices. */
  sources: readonly number[];

  /** Fabric material already registered in the final model. */
  material: IAutoMovieMaterial;

  /** Signed normal lift from this final skin frame, metres. */
  offsetMetres: number;
}
