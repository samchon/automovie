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
 * @evidence contracts/common.md#principled-implementation A running cursor from the offset along the declared sense gives each layer its `[start, end]`, so layer spans tile the build-up without gaps and `total` is the plain thickness sum.
 * @evidence contracts/common.md#clear-and-simple-design Keeps both the signed `start` and `end` and the ordered `extent`, so callers that care about stacking sense and callers that need an interval each read their own field.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An invalid build-up throws before any coordinate exists, and no layer role or substance changes how a layer is placed.
 * @evidence contracts/common.md#meaningful-documentation States the producer and its precondition, the frame and unit, how start, end and extent relate, layer order, and the rounding difference between the two end values.
 * @evidenceExclude contracts/performance.md#cost-and-resources A record from one linear pass over the layers after validation, owning fresh layer copies; junction and reveal queries take it as input instead of resolving again.
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
