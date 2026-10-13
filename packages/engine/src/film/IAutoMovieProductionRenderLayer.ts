/**
 * One source image participating in a film-global output frame.
 *
 * A layer names the compiled shot, the exact shot-local integer frame the edit
 * maps the film frame to, and its compositing weight. The browser film viewer
 * and the headless capture both draw from this record, so one film frame
 * resolves every shot's state at one declared source instant.
 *
 * @author Samchon
 */
export interface IAutoMovieProductionRenderLayer {
  /**
   * Compiler-owned shot id.
   */
  shot: string;
  /**
   * Exact shot-local integer source frame.
   */
  sourceFrame: number;
  /**
   * Linear compositing weight in `[0, 1]`.
   */
  weight: number;
}
