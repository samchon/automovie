import type { IAutoMovieAssemblyHost } from "../architecture/IAutoMovieAssemblyHost";
import type { IAutoMovieMaterialAssembly } from "./IAutoMovieMaterialAssembly";
import type { IAutoMovieMaterialSubstance } from "./IAutoMovieMaterialSubstance";

/** Data and callback contracts shared by the ResolveMaterialAssembly operations. */
export namespace IAutoMovieResolveMaterialAssembly {
  /**
   * Place a validated build-up on the host's own signed measuring line.
   * 
   * This is the step that makes a build-up a dimension rather than a list. The
   * first layer's outer face starts at {@link IAutoMovieMaterialAssembly.offset},
   * each layer advances along the stacking axis in the declared sense, and the
   * summed thickness is the overall dimension the host must be drawn at. A caller
   * that sizes a wall from `total` and cuts an opening through it can then ask
   * {@link autoMovieAssemblyOpeningReveal} what the opening finishes at.
   * 
   * An invalid build-up is refused here rather than resolved into numbers that
   * look usable, the same way a built environment refuses to lower.
   * 
   * Positions are signed metres along the host axis. Negative sense makes a positive-thickness layer advance downward; zero-thickness membranes or rounded increments can have equal endpoints. `extent` orders the assembly ends. `total` sums thicknesses and the overall `end` is offset plus signed total, which can differ from the final accumulated layer end by rounding. Failed validation throws an `Error` naming its first finding.
   */
  export type IProps = {
    /** Layered build-up to place; validated before any position is computed. */
    assembly: IAutoMovieMaterialAssembly;
  
    /** Substances the layers may cite; omitted skips reference resolution. */
    substances?: readonly IAutoMovieMaterialSubstance[];
  
    /** Host dimension the layers must sum to; omitted skips the comparison. */
    host?: IAutoMovieAssemblyHost;
  };
}
