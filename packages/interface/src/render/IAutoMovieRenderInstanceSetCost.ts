/**
 * One instance set's batching cost.
 *
 * @evidence requirements/rendering/scope-and-artifact-identity.md#rendering-compile-render-distinction Exposes `IAutoMovieRenderInstanceSetCost` as the portable data boundary for the rendering compile render distinction requirement.
 * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-artifact-lifecycle Types `IAutoMovieRenderInstanceSetCost` for the spec render artifact lifecycle system contract.
 */
export interface IAutoMovieRenderInstanceSetCost {
  /**
   * Compiled instance-set id.
   *
   * @evidence requirements/rendering/scope-and-artifact-identity.md#rendering-compile-render-distinction Exposes `instanceSet` as the portable data boundary for the rendering compile render distinction requirement.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-artifact-lifecycle Types `instanceSet` for the spec render artifact lifecycle system contract.
   */
  instanceSet: string;

  /**
   * Exact designed slot count.
   *
   * @evidence requirements/rendering/scope-and-artifact-identity.md#rendering-compile-render-distinction Exposes `slots` as the portable data boundary for the rendering compile render distinction requirement.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-artifact-lifecycle Types `slots` for the spec render artifact lifecycle system contract.
   */
  slots: number;

  /**
   * Exact independently regenerable chunk count.
   *
   * @evidence requirements/rendering/scope-and-artifact-identity.md#rendering-compile-render-distinction Exposes `chunks` as the portable data boundary for the rendering compile render distinction requirement.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-artifact-lifecycle Types `chunks` for the spec render artifact lifecycle system contract.
   */
  chunks: number;

  /**
   * Exact prototype count; a legacy single-prototype set reports one.
   *
   * @evidence requirements/rendering/scope-and-artifact-identity.md#rendering-compile-render-distinction Exposes `prototypes` as the portable data boundary for the rendering compile render distinction requirement.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-artifact-lifecycle Types `prototypes` for the spec render artifact lifecycle system contract.
   */
  prototypes: number;

  /**
   * Upper bound on draw submissions: one per chunk, per prototype, per drawn
   * part of the prototype's most expensive level of detail. Frustum and LOD
   * selection only ever lower it.
   *
   * @evidence requirements/rendering/scope-and-artifact-identity.md#rendering-compile-render-distinction Exposes `drawCallUpperBound` as the portable data boundary for the rendering compile render distinction requirement.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-artifact-lifecycle Types `drawCallUpperBound` for the spec render artifact lifecycle system contract.
   */
  drawCallUpperBound: number;
}
