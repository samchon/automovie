import type { IAutoMovieGeneratedMeasurementProxy } from "./IAutoMovieGeneratedMeasurementProxy";

/**
 * An explicitly selected projection envelope from registered JSON bytes or a
 * closed generated recipe.
 */
export type IAutoMovieMeasurementProxyReference =
  | {
      /** Manifest-owned proxy bytes. */
      kind: "asset";

      /** Exact path of a typed JSON proxy asset in this manifest. */
      asset: string;
    }
  | ({
      /** Compiler-owned deterministic proxy recipe. */
      kind: "generated";
    } & IAutoMovieGeneratedMeasurementProxy);
