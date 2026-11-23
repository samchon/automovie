/**
 * One shot image participating in a film-global output frame.
 *
 * A layer names the compiled shot, the exact shot-local integer frame the edit
 * maps the film frame to, and its compositing weight, so one film frame
 * resolves every participating shot at one declared source instant.
 * `sampleProductionRenderFrame` produces it; `productionRenderLayersForPass`
 * composites beauty layers by weight and gives a structural guide pass only the
 * heaviest layer, the incoming one on a tie, and production checks a mask
 * chunk's semantic sidecars against that selection.
 */
export interface IAutoMovieProductionRenderLayer {
  /** Id of the compiled shot this layer renders, as the timeline names it. */
  shot: string;

  /** Zero-based integer frame on that shot's own clock. */
  sourceFrame: number;

  /**
   * Linear compositing weight in `[0, 1]`: `1` for a plain cut, the fade factor
   * during a fade, and complementary values across a dissolve.
   */
  weight: number;
}
