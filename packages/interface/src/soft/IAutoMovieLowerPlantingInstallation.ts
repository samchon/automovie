import type { IAutoMoviePlantingCluster } from "./IAutoMoviePlantingCluster";
import type { IAutoMoviePlantingDomain } from "./IAutoMoviePlantingDomain";
import type { IAutoMoviePlantingInstallation } from "./IAutoMoviePlantingInstallation";

/** Installation, arrangement and growth recipe joined for one planting frame. */
export namespace IAutoMovieLowerPlantingInstallation {
  /**
   * Borrowed records for deriving one plant shared by a cluster's placements.
   * The lowerer validates the recipe and cluster, then checks cluster.domain
   * and installation.cluster against their supplied records. Failure returns
   * not-run with null plant and arrangement; grow/arrange failures may throw.
   * Installation architecture, support and irrigation are not validated here.
   *
   * Inputs are unchanged and unretained. Returned plant geometry is
   * recipe-local in metres; arrangement transforms place its instances in world
   * space. Arrangement may report rejected member slots while analysis still
   * says derived. No production/viewer currently calls this lowerer.
   */
  export type IProps = {
    /**
     * Supplies output installation identity and cluster reference; other
     * installation properties are not consumed by this lowerer.
     */
    installation: IAutoMoviePlantingInstallation;

    /**
     * Seeded world-space member arrangement request; validated before arranging
     * and required to reference domain.id.
     */
    cluster: IAutoMoviePlantingCluster;

    /**
     * Recipe-local growth definition admitted before deriving the shared plant;
     * must match cluster.domain.
     */
    domain: IAutoMoviePlantingDomain;
  };
}
