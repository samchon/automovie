/**
 * What filling one product-excluded skin region did to the source neutral.
 *
 * @author Samchon
 */
export interface IHumanSourceExcludedRegionReceipt {
  /** Which excluded region. */
  region: "nipple" | "genital";

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
