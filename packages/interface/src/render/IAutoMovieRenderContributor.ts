/**
 * One owner's share of one metric, as the report states it.
 *
 * @evidence requirements/rendering/scope-and-artifact-identity.md#rendering-compile-render-distinction Exposes `IAutoMovieRenderContributor` as the portable data boundary for the rendering compile render distinction requirement.
 * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-artifact-lifecycle Types `IAutoMovieRenderContributor` for the spec render artifact lifecycle system contract.
 */
export interface IAutoMovieRenderContributor {
  /**
   * Stable owner id.
   *
   * For a cost that paints pixels this is a semantic-mask id, so the report and
   * the mask name the same thing. Shared resources that draw nothing of their
   * own carry a `model:`, `material:`, `texture:` or `light:` identity instead:
   * attributing one shared texture to every node that binds it would count its
   * bytes once per node and describe a memory cost nobody pays.
   *
   * @evidence requirements/rendering/scope-and-artifact-identity.md#rendering-compile-render-distinction Exposes `owner` as the portable data boundary for the rendering compile render distinction requirement.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-artifact-lifecycle Types `owner` for the spec render artifact lifecycle system contract.
   */
  owner: string;

  /**
   * Editable source location the author changes to lower this cost.
   *
   * @evidence requirements/rendering/scope-and-artifact-identity.md#rendering-compile-render-distinction Exposes `source` as the portable data boundary for the rendering compile render distinction requirement.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-artifact-lifecycle Types `source` for the spec render artifact lifecycle system contract.
   */
  source: string;

  /**
   * Exact contribution in the metric's unit.
   *
   * @evidence requirements/rendering/scope-and-artifact-identity.md#rendering-compile-render-distinction Exposes `cost` as the portable data boundary for the rendering compile render distinction requirement.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-artifact-lifecycle Types `cost` for the spec render artifact lifecycle system contract.
   */
  cost: number;
}
