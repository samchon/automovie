import type { IAutoMovieProductionSoundPlan } from "./IAutoMovieProductionSoundPlan";
import type { IAutoMovieRenderedProductionSound } from "./IAutoMovieRenderedProductionSound";

/** Inputs of mastering a mixed production soundtrack to its loudness targets. */
export namespace IAutoMovieMasterProductionSound {
  /**
   * A mix from engine's `renderProductionSound` and the plan it was mixed from.
   *
   * Engine's `masterProductionSound` reads the mix's samples without changing
   * them and returns a fresh master: one static gain brings it to the mix's
   * integrated target, a look-ahead limiter holds its true peak under the mix's
   * ceiling, and the result is refused when its integrated loudness misses the
   * target by more than the tolerance.
   */
  export interface IProps {
    /** The plan the mix was rendered from, for the master's event analysis. */
    plan: IAutoMovieProductionSoundPlan;

    /** The unmastered mix, with the targets it was levelled to. */
    rendered: IAutoMovieRenderedProductionSound;
  }
}
