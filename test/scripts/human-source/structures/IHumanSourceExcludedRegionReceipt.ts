/**
 * The original sampled nipple product-exclusion's effect on the source neutral.
 * Genital fill or anatomy registration is outside the normal source contract.
 *
 * @author Samchon
 */
export interface IHumanSourceExcludedRegionReceipt {
  /** Which excluded region. */
  region: "nipple";

  /** Sampler files that define the region and its operator. */
  operator: string[];

  /** Canonical source vertices inside the region, ascending. */
  sourceVertices: number[];

  /** Region vertices whose neutral position the fill changed. */
  moved: number;

  /** Largest neutral displacement, in metres. */
  maximumDisplacementMetres: number;

  /** Mean neutral displacement over the region, in metres. */
  meanDisplacementMetres: number;
}
