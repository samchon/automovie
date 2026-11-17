import type { IAutoMovieCurve64 } from "./IAutoMovieCurve64";
import type { IAutoMovieCurveAssembly64 } from "./IAutoMovieCurveAssembly64";

/** Data and callback contracts shared by the GenerateCurveAssembly64 operations. */
export namespace IAutoMovieGenerateCurveAssembly64 {
  /**
   * Construct caller-defined regions after their incoming boundary operators are published, retaining each concrete factory result. A thrown factory/publication failure aborts without returning a partial assembly; callback side effects remain the caller's responsibility.
   */
  export type IProps<T extends IAutoMovieCurveAssembly64.Result> = {
    /** Parent-relative rigid frames, with every parent appearing before its child. */
    frames: readonly IAutoMovieCurve64.Frame[];

    /** Directed named boundaries whose owner and consumer must each have a factory. */
    edges: readonly IAutoMovieCurve64.Edge[];

    /** Region callbacks retaining their concrete generated result type. */
    factories: readonly IAutoMovieCurveAssembly64.Factory<T>[];
  };
}
