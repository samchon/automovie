import { AutoMovieRenderAnalysisStatus } from "./AutoMovieRenderAnalysisStatus";
import { AutoMovieRenderMetric } from "./AutoMovieRenderMetric";

/**
 * One analysis that produced no number, and the exact reason.
 *
 * @evidence requirements/rendering/scope-and-artifact-identity.md#rendering-compile-render-distinction Exposes `IAutoMovieRenderAnalysisGap` as the portable data boundary for the rendering compile render distinction requirement.
 * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-artifact-lifecycle Types `IAutoMovieRenderAnalysisGap` for the spec render artifact lifecycle system contract.
 */
export interface IAutoMovieRenderAnalysisGap {
  /**
   * Metric left without a measurement.
   *
   * @evidence requirements/rendering/scope-and-artifact-identity.md#rendering-compile-render-distinction Exposes `metric` as the portable data boundary for the rendering compile render distinction requirement.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-artifact-lifecycle Types `metric` for the spec render artifact lifecycle system contract.
   */
  metric: AutoMovieRenderMetric;

  /**
   * Whether the analysis is missing entirely or merely did not execute.
   *
   * @evidence requirements/rendering/scope-and-artifact-identity.md#rendering-compile-render-distinction Exposes `status` as the portable data boundary for the rendering compile render distinction requirement.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-artifact-lifecycle Types `status` for the spec render artifact lifecycle system contract.
   */
  status: AutoMovieRenderAnalysisStatus;

  /**
   * Exactly what is absent, naming the declaration that needed it.
   *
   * @evidence requirements/rendering/scope-and-artifact-identity.md#rendering-compile-render-distinction Exposes `reason` as the portable data boundary for the rendering compile render distinction requirement.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-artifact-lifecycle Types `reason` for the spec render artifact lifecycle system contract.
   */
  reason: string;

  /**
   * Exactly what would make the analysis produce a number.
   *
   * @evidence requirements/rendering/scope-and-artifact-identity.md#rendering-compile-render-distinction Exposes `remedy` as the portable data boundary for the rendering compile render distinction requirement.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-artifact-lifecycle Types `remedy` for the spec render artifact lifecycle system contract.
   */
  remedy: string;
}
