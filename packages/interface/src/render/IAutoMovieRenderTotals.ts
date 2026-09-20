import { AutoMovieRenderMetric } from "./AutoMovieRenderMetric";

/**
 * Every metric's measured value, or `null` when it was not measured.
 *
 * @evidence requirements/rendering/scope-and-artifact-identity.md#rendering-compile-render-distinction Exposes `IAutoMovieRenderTotals` as the portable data boundary for the rendering compile render distinction requirement.
 * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-artifact-lifecycle Types `IAutoMovieRenderTotals` for the spec render artifact lifecycle system contract.
 */
export type IAutoMovieRenderTotals = {
  [metric in AutoMovieRenderMetric]: number | null;
};
