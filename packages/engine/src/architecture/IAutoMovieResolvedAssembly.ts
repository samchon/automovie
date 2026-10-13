import { IAutoMovieResolvedLayer } from "./IAutoMovieResolvedLayer";

/** A build-up placed on a signed measuring line, ready to be dimensioned. */
export interface IAutoMovieResolvedAssembly {
  /** The contributing {@link IAutoMovieMaterialAssembly.id}. */
  id: string;
  /** Host-local axis the layers stack along. */
  axis: "x" | "y" | "z";
  /** Summed layer thickness in metres: the build-up's overall dimension. */
  total: number;
  /** Signed coordinate of the first layer's outer face. */
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
