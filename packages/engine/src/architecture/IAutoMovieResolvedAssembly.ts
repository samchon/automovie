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
