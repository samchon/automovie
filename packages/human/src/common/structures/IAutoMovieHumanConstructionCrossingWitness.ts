import type { IAutoMovieHumanConstructionRootInsertionWitness } from "./IAutoMovieHumanConstructionRootInsertionWitness";

/**
 * One witnessed crossing of a measured relation: the first subject triangle
 * that a reference triangle crosses transversally, with the coordinates of
 * both, so a consumer can find where two parts intersect without opening
 * their geometry. Coordinates are metres in the owning model's frame, on the
 * Float32 values the instrument read. It is a witness, not the population;
 * the reading's crossing count states how many there are.
 *
 * @evidence contracts/common.md#principled-implementation A crossing pair is located exactly by its two triangles; the instrument's own first reported pair is carried unchanged.
 * @evidence contracts/common.md#clear-and-simple-design Two ordinals and two coordinate triples.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The witness is the instrument's first pair in its deterministic order, not a selected or filtered one.
 * @evidence contracts/common.md#meaningful-documentation States what is witnessed, the frame and that it is one of possibly many.
 * @evidence contracts/modeling.md#spatial-conventions Metres in the owning model's frame, nine numbers per triangle as x, y, z of each corner.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Locates geometry of existing parts.
 * @evidenceExclude contracts/modeling.md#parameter-channels Carries no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Reports a measured boundary state.
 * @evidenceExclude contracts/modeling.md#rendered-observation Numerical record.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Supplies no biological value.
 * @evidenceExclude contracts/anatomy.md#permitted-range Bounds nothing.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Defines no input.
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
