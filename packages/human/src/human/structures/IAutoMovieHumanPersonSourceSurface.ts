import type { IAutoMovieHumanBasisSourcePartition } from "../../common/basis/IAutoMovieHumanBasisSourcePartition";

/**
 * One skin surface as source-partition admission reads it: flat positions in
 * metres, flat triangle index triples, and its compiled source partition when
 * the basis carries one.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonSourceSurface {
  /** Flat vertex positions, metres. */
  positions: readonly number[];

  /** Flat triangle vertex index triples. */
  indices: readonly number[];

  /** Compiled source partition, or none for a legacy surface. */
  sourcePartition?: IAutoMovieHumanBasisSourcePartition;
}
