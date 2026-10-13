/**
 * The minimum film-layer shape needed to decide beauty composition.
 *
 * @evidence requirements/rendering/frame-schedules-and-sampling.md#rendering-state-sampling Keeps the builder-owned layer weight intact at the viewer boundary.
 * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-frame-schedule Selects composition from the already sampled frame rather than resampling an edit.
 * @author Samchon
 */
export interface IAutoMovieFilmBeautyLayer {
  /** Sampled contribution in `[0, 1]`, applied to source display bytes. */
  weight: number;
}

