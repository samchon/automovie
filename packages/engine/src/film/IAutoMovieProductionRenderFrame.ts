import { IAutoMovieProductionRenderLayer } from "./IAutoMovieProductionRenderLayer";

/**
 * One exact film-global frame with transitions already resolved.
 *
 * The frame number, the full-rate timeline frame and the derived time are
 * separate fields because a proxy tier renumbers output frames while still
 * sampling the builder-owned timeline.
 *
 * @author Samchon
 */
export interface IAutoMovieProductionRenderFrame {
  /**
   * Exact zero-based output frame in this render tier.
   */
  globalFrame: number;
  /**
   * Exact frame on the builder-owned full-rate film timeline.
   */
  timelineFrame: number;
  /**
   * Derived film time, never an accumulated clock.
   */
  timeSeconds: number;
  /**
   * One hard-cut/fade layer or two dissolve layers, back to front.
   */
  layers: IAutoMovieProductionRenderLayer[];
}
