import type { IAutoMovieHumanBodySimpleShapeSiri } from "./IAutoMovieHumanBodySimpleShapeSiri";

/**
 * The simple tier's mass model: Siri's density equation and the body fat
 * fraction band the model is trusted over.
 *
 * @evidence contracts/common.md#principled-implementation A Siri density-equation record and trusted fat-fraction interval define the mass conversion model.
 * @evidence contracts/common.md#clear-and-simple-design Density coefficients are grouped separately from the domain over which the model is used.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The trusted interval is a modeling domain rather than an individualized composition result.
 * @evidence contracts/common.md#meaningful-documentation The prose identifies the density equation and the interval tuple order.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The mass density model declaration is erased by TypeScript and chooses no runtime algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The mass density model schema coordinates no requests or cached computations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The mass density model type acquires no handles, tasks or retained storage.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodySimpleShapeMass {
  /** Siri's density equation. */
  siri: IAutoMovieHumanBodySimpleShapeSiri;

  /** The trusted body fat fraction band, `[low, high]`. */
  fatFraction: [number, number];
}
