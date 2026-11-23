import type { IAutoMovieBuiltEnvironment } from "../architecture/IAutoMovieBuiltEnvironment";
import type { IAutoMovieFluidDomain } from "../fluid/IAutoMovieFluidDomain";
import type { IAutoMoviePlantingCluster } from "./IAutoMoviePlantingCluster";
import type { IAutoMoviePlantingDomain } from "./IAutoMoviePlantingDomain";
import type { IAutoMoviePlantingInstallation } from "./IAutoMoviePlantingInstallation";

/**
 * Building, growth and arrangement catalogues joined by planting-installation
 * admission.
 */
export namespace IAutoMovieValidatePlantingInstallations {
  /**
   * Borrowed catalogues for validating installation references, unique cluster
   * use, support and irrigation rules, and initial placement containment. All
   * supplied recipes and clusters receive their own admission checks even when
   * installations is empty. Duplicate recipe/cluster ids are reported; lookup
   * maps still select the last record. Input records remain unchanged and
   * returned violations may retain offending values.
   *
   * For admitted clusters, arrangement supplies accepted placement origins. An
   * admitted recipe supplies one canopy box, whose eight corners are scaled,
   * rotated and translated per placement; origins and available corners are
   * tested only when the room declares volume. These sampled points do not
   * prove continuous containment in a nonconvex room union, and rejected
   * arrangement slots are not converted to validation findings.
   *
   * Aquatic roots are compared with authored origin.y + bed + depth at their
   * cell, not a simulated water surface; solidity and dry thresholds are not
   * checked here. Environment and fluid-domain admission are caller
   * responsibilities. Support-id existence does not prove physical support.
   * Malformed typed containers and generation failures may throw.
   */
  export type IProps = {
    /**
     * Previously admitted building supplying owning identity, room volumes and
     * support/port references; this pass does not validate the building
     * itself.
     */
    environment: IAutoMovieBuiltEnvironment;

    /**
     * Installation bindings in diagnostic order; empty skips binding/geometry
     * checks, and each cluster may be placed by only one installation in this
     * list.
     */
    installations: IAutoMoviePlantingInstallation[];

    /**
     * Seeded world-space arrangement requests; every entry is validated and its
     * recipe reference must resolve in domains.
     */
    clusters: IAutoMoviePlantingCluster[];

    /**
     * Growth recipe catalogue, fully validated including unused entries;
     * matching recipes may be derived to obtain canopy bounds.
     */
    domains: IAutoMoviePlantingDomain[];

    /**
     * Caller-admitted authored water grids for aquatic-root checks; omission
     * equals an empty catalogue. This pass neither validates fluid records nor
     * reports duplicate fluid ids, and lookup uses the last entry.
     */
    fluidDomains?: IAutoMovieFluidDomain[] | undefined;
  };
}
