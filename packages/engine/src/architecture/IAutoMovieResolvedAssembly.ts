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
 * @evidence contracts/common.md#principled-implementation Places layers on a signed line by accumulating thickness from the offset in the declared sense, and orders `start` and `end` into `extent` so interval arithmetic works for either sense.
 * @evidence contracts/common.md#clear-and-simple-design Keeps the overall dimension, both signed ends, the ordered extent and the placed layers, which is what dimensioning, reveal and junction queries read.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An invalid build-up is refused before resolution rather than resolved into usable-looking numbers, and the rounding difference between `end` and the last layer's end is stated rather than patched.
 * @evidence contracts/common.md#meaningful-documentation States the producer and its precondition, the coordinate convention, how `start`, `end` and `extent` relate, and the rounding difference between `end` and the last layer.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A data shape; resolution is linear in the layer count, answered on `resolveAutoMovieMaterialAssembly`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Resolved per call; the reveal and junction functions read the same resolved record rather than resolving again.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Holds numbers and a fresh layer array owned by the caller.
 * @author Samchon
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
