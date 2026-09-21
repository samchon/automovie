/**
 * One model's exact geometry cost at one level of detail.
 *
 * @evidence requirements/rendering/scope-and-artifact-identity.md#rendering-compile-render-distinction Exposes `IAutoMovieRenderModelCost` as the portable data boundary for the rendering compile render distinction requirement.
 * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-artifact-lifecycle Types `IAutoMovieRenderModelCost` for the spec render artifact lifecycle system contract.
 */
export interface IAutoMovieRenderModelCost {
  /**
   * Runtime model id.
   *
   * @evidence requirements/rendering/scope-and-artifact-identity.md#rendering-compile-render-distinction Exposes `model` as the portable data boundary for the rendering compile render distinction requirement.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-artifact-lifecycle Types `model` for the spec render artifact lifecycle system contract.
   */
  model: string;

  /**
   * Level-of-detail tier this row measures, or `null` for a model placed
   * directly by a scene node rather than selected by distance.
   *
   * @evidence requirements/rendering/scope-and-artifact-identity.md#rendering-compile-render-distinction Exposes `tier` as the portable data boundary for the rendering compile render distinction requirement.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-artifact-lifecycle Types `tier` for the spec render artifact lifecycle system contract.
   */
  tier: "hero" | "near" | "far" | null;

  /**
   * Exact drawable part count; one part is one draw submission.
   *
   * @evidence requirements/rendering/scope-and-artifact-identity.md#rendering-compile-render-distinction Exposes `parts` as the portable data boundary for the rendering compile render distinction requirement.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-artifact-lifecycle Types `parts` for the spec render artifact lifecycle system contract.
   */
  parts: number;

  /**
   * Exact vertex count over every part.
   *
   * @evidence requirements/rendering/scope-and-artifact-identity.md#rendering-compile-render-distinction Exposes `vertices` as the portable data boundary for the rendering compile render distinction requirement.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-artifact-lifecycle Types `vertices` for the spec render artifact lifecycle system contract.
   */
  vertices: number;

  /**
   * Exact triangle count over every part.
   *
   * @evidence requirements/rendering/scope-and-artifact-identity.md#rendering-compile-render-distinction Exposes `triangles` as the portable data boundary for the rendering compile render distinction requirement.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-artifact-lifecycle Types `triangles` for the spec render artifact lifecycle system contract.
   */
  triangles: number;

  /**
   * Distinct material ids cited by the parts.
   *
   * @evidence requirements/rendering/scope-and-artifact-identity.md#rendering-compile-render-distinction Exposes `materials` as the portable data boundary for the rendering compile render distinction requirement.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-artifact-lifecycle Types `materials` for the spec render artifact lifecycle system contract.
   */
  materials: string[];

  /**
   * Estimated device bytes of vertex attributes and indices.
   *
   * @evidence requirements/rendering/scope-and-artifact-identity.md#rendering-compile-render-distinction Exposes `geometryBytes` as the portable data boundary for the rendering compile render distinction requirement.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-artifact-lifecycle Types `geometryBytes` for the spec render artifact lifecycle system contract.
   */
  geometryBytes: number;
}
