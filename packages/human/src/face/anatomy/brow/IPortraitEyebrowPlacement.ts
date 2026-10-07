import type { IPortraitEyebrowFlowDirection } from "./IPortraitEyebrowFlowDirection";

/**
 * A brow profile's root extent, end thinning and grain after its spelling has
 * been resolved: what the shaft builder and the admission both read.
 *
 * @evidence contracts/common.md#principled-implementation One resolved record is the single reading of three quantities a profile can spell two ways.
 * @evidence contracts/common.md#clear-and-simple-design Three members; the grain arrives as the compiled sampler so no consumer compiles it again.
 * @evidence contracts/common.md#meaningful-documentation Each member states its range and meaning.
 * @evidence contracts/modeling.md#spatial-conventions Fractions across the registered band and along the brow, dimensionless.
 *
 * @author Samchon
 */
export interface IPortraitEyebrowPlacement {
  /** Lowest and highest root position across the band, lower boundary zero to upper one. */
  rootBand: readonly [number, number];

  /** Medial and lateral thinning lengths as fractions of the brow's length. */
  endFade: readonly [number, number];

  /** Direction sampler by position along the brow and within the root band, or undefined for the basic upward sweep. */
  flow?: (at: number, root: number) => IPortraitEyebrowFlowDirection;
}
