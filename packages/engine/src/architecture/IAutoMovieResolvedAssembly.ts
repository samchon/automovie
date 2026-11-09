import { IAutoMovieResolvedLayer } from "./IAutoMovieResolvedLayer";

/**
 * A build-up placed on a signed measuring line, ready to be dimensioned.
 *
 * Produced by `resolveAutoMovieMaterialAssembly` only after validation passes.
 * Coordinates are metres along `axis` in the host's frame: `start` is the
 * assembly's `offset`, each layer advances by its thickness in the declared
 * sense, and `extent` orders `start` and `end`. `end` is computed from the
 * summed `total`, while the last layer's own `end` is accumulated layer by
 * layer, so the two can differ by floating-point rounding.
 *
 * @evidence contracts/development/design.md#principled-representation Accumulates binary64 signed endpoints and unsigned thickness after the producer's validation refuses non-finite derived sums/endpoints. Ordered extent supports either sense; rounding can collapse a sufficiently small layer at a large offset, so this is numerical placement rather than exact-real interval arithmetic.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Keeps the overall dimension, both signed ends, the ordered extent and the placed layers, which is what dimensioning, reveal and junction queries read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts An invalid build-up is refused before resolution rather than resolved into usable-looking numbers, and the rounding difference between `end` and the last layer's end is stated rather than patched.
 * @evidence contracts/development/common.md#meaningful-documentation States the producer and its precondition, the coordinate convention, how `start`, `end` and `extent` relate, and the rounding difference between `end` and the last layer.
 */
export interface IAutoMovieResolvedAssembly {
  /** The contributing {@link IAutoMovieMaterialAssembly.id}. */
  id: string;

  /** Host-local axis the layers stack along. */
  axis: "x" | "y" | "z";

  /** Summed layer thickness in metres: the build-up's overall dimension. */
  total: number;

  /** Signed coordinate of the first layer's outer face: the assembly offset. */
  start: number;

  /** Signed coordinate of the last layer's outer face. */
  end: number;

  /** Ordered signed span of the whole build-up, lowest coordinate first. */
  extent: {
    /** Lowest signed coordinate the build-up occupies. */
    min: number;

    /** Highest signed coordinate the build-up occupies. */
    max: number;
  };

  /** Layers in authored order, each placed on the measuring line. */
  layers: IAutoMovieResolvedLayer[];
}
