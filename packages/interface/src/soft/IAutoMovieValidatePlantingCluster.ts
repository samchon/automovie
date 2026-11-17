import type { IAutoMoviePlantingCluster } from "./IAutoMoviePlantingCluster";

/**
 * Typed seeded planting arrangement submitted for scalar admission.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the checked fields, unchanged input, retained finding values, unresolved identity and placement-feasibility limit.
 * @evidence contracts/development/design.md#principled-representation The canonical cluster distinguishes world-metre region/spacing from dimensionless scales and jitter; numeric range and safe-count admission belongs to validatePlantingCluster.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Lowering and installation validation submit the same cluster contract directly to its single scalar admission owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No geometry or recipe catalogue is included because this check neither arranges members nor resolves domain identity.
 */
export namespace IAutoMovieValidatePlantingCluster {
  /**
   * Cluster for checking a finite world-metre region, positive scale intervals, safe seed and bounded member/attempt counts. validatePlantingCluster reports semantic defects without changing inputs; it does not parse unknown shapes or resolve the domain id. Returned violations may retain authored values, and malformed containers can throw.
   *
   * Admission does not prove all requested placements fit or every derived coordinate is representable. arrangePlantingCluster returns explicit rejected slots when sampling cannot satisfy spacing.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the checked fields, unchanged input, retained finding values, unresolved identity and placement-feasibility limit.
   * @evidence contracts/development/design.md#principled-representation The canonical cluster distinguishes world-metre region/spacing from dimensionless scales and jitter; numeric range and safe-count admission belongs to validatePlantingCluster.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Lowering and installation validation submit the same cluster contract directly to its single scalar admission owner.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No geometry or recipe catalogue is included because this check neither arranges members nor resolves domain identity.
   */
  export type IProps = {
    /** Structurally present cluster to inspect; its domain reference need only be nonblank here, and no fields are defaulted or clamped. */
    cluster: IAutoMoviePlantingCluster;
  };
}
