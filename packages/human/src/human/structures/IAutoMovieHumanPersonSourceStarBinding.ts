import type { IAutoMovieHumanPersonSourceStarWeight } from "./IAutoMovieHumanPersonSourceStarWeight";

/**
 * How one sample reads the source normal field under one incident parent: the weighted stars it requires, their identity, and the chart coordinates and corner keys it interpolates them with.
 *
 * @evidence contracts/common.md#principled-implementation Sorted weighted vertex/domain stars distinguish shading incidence from geometric samples; chart coordinates and ordered corner keys feed the shared affine interpolator.
 * @evidence contracts/common.md#clear-and-simple-design Weights and serialized identity support equivalence checks while coordinates and corner keys preserve the interpolation order needed by the normal reader.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Distinct normal domains remain separate at coincident geometry; the record does not merge them to conceal opposed shading incidence.
 * @evidence contracts/common.md#meaningful-documentation The comment explains sorted stars, serialized weighted identity and two-coordinate interpolation under an incident parent.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A star binding stores an already selected interpolation stencil; sorting and normal accumulation occur in source-normal compilation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The identity is a cache operand rather than a cache implementation; reference-field lookup owns memoization of sample and weighted-star combinations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Binding arrays are ordinary result data with no disposal hook; their containing normal plan bounds the retained population.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonSourceStarBinding {
  /** The required stars, sorted by key. */
  weights: IAutoMovieHumanPersonSourceStarWeight[];

  /** The serialized weighted-key list, equal for equal stars. */
  identity: string;

  /** Dimensionless coordinates in the sample's ordered original/cut/refinement chart. */
  coordinates: readonly [number, number];

  /** Star keys of the sample chart's three ordered corners; original and cut charts can repeat keys. */
  keys: string[];
}
