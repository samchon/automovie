import type { IAutoMovieHumanConstructionRootInsertionWitness } from "./IAutoMovieHumanConstructionRootInsertionWitness";

/**
 * One witnessed crossing of a measured relation: the first subject triangle
 * that a reference triangle crosses transversally, with the coordinates of
 * both, so a consumer can find where two parts intersect without opening
 * their geometry. Coordinates are metres in the owning model's frame, on the
 * locally Float32-published mesh reconstructed through ordinary part TRS
 * without a second rounding. It is a witness, not the population;
 * the reading's crossing count states how many there are.
 *
 * @evidence contracts/common.md#principled-implementation Subject and reference triangle ordinals accompany their actual corners, identifying one transverse pair in the measured model frame.
 * @evidence contracts/common.md#clear-and-simple-design One witness locates the first reported crossing while the enclosing clearance reading owns the entire crossing count.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A witness is not the full intersection population; optional root insertion values do not enlarge the existing admitted root region.
 * @evidence contracts/common.md#meaningful-documentation The description states model metres, reconstruction from local Float32 publication, and separation of witness from population.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Transverse crossing witness schema is erased by TypeScript; its runtime consumer owns the actual geometry or measurement traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Transverse crossing witness schema specifies caller data and performs no runtime recomputation or cache lookup.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Transverse crossing witness schema acquires no runtime handle or retained cache; concrete array and map ownership belongs to its producing and consuming functions.
 *
 *
 * @author Samchon
 */
export interface IAutoMovieHumanConstructionCrossingWitness {
  /** Ordinal of the crossed subject triangle among the tested subject triangles. */
  subjectTriangle: number;

  /** Ordinal of the crossing reference triangle. */
  referenceTriangle: number;

  /** Corners of the subject triangle. */
  subjectPoints: number[];

  /** Corners of the reference triangle. */
  referencePoints: number[];

  /** Actual free-root classification of this same crossing pair, when its owner excludes a closed insertion ball. These are the predicate's Float32-mesh witness and measured root values in model metres, not a larger permitted insertion region. */
  rootInsertion?: IAutoMovieHumanConstructionRootInsertionWitness;
}
