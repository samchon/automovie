import type { IAutoMoviePlantingCluster } from "./IAutoMoviePlantingCluster";

/** Typed seeded planting arrangement submitted for scalar admission. */
export namespace IAutoMovieValidatePlantingCluster {
  /**
   * Cluster for checking a finite world-metre region, positive scale intervals,
   * safe seed and bounded member/attempt counts. validatePlantingCluster
   * reports semantic defects without changing inputs; it does not parse unknown
   * shapes or resolve the domain id. Returned violations may retain authored
   * values, and malformed containers can throw.
   *
   * Admission does not prove all requested placements fit or every derived
   * coordinate is representable. arrangePlantingCluster returns explicit
   * rejected slots when sampling cannot satisfy spacing.
   */
  export type IProps = {
    /**
     * Structurally present cluster to inspect; its domain reference need only
     * be nonblank here, and no fields are defaulted or clamped.
     */
    cluster: IAutoMoviePlantingCluster;
  };
}
