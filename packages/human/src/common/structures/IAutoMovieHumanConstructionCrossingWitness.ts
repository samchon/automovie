import type { IAutoMovieHumanConstructionRootInsertionWitness } from "./IAutoMovieHumanConstructionRootInsertionWitness";

/**
 * One witnessed crossing of a measured relation: the first subject triangle
 * that a reference triangle crosses transversally, with the coordinates of
 * both, so a consumer can find where two parts intersect without opening
 * their geometry. Coordinates are metres in the owning model's frame, on the
 * Float32 values the instrument read. It is a witness, not the population;
 * the reading's crossing count states how many there are.
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
