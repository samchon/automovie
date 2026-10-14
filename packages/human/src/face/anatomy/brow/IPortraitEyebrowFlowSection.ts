import type { IPortraitEyebrowFlowDirection } from "./IPortraitEyebrowFlowDirection";

/** One longitudinal flow witness across the root band, independent of population.
 *
 *
 * @evidence contracts/common.md#principled-implementation A longitudinal fraction pairs the lower and upper root-band endpoint directions of one flow witness.
 * @evidence contracts/common.md#clear-and-simple-design The section separates longitudinal station from cross-root interpolation inputs.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A witness is independent of fibre count and cannot stand in for an omitted complete flow profile.
 * @evidence contracts/common.md#meaningful-documentation Members state zero/one longitudinal endpoints and the distinct lower/upper root directions.
 * @evidenceExclude contracts/performance.md#efficient-algorithms IPortraitEyebrowFlowSection is a TypeScript-only schema and executes no guide, surface or field algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work IPortraitEyebrowFlowSection declares inputs or results; copying and equivalence belong to its concrete producer/consumer.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources IPortraitEyebrowFlowSection acquires no runtime state or handle; array, map and callback lifetimes remain with their owning operations.
 *
 * @author Samchon
 */
export interface IPortraitEyebrowFlowSection {
  /** Medial-to-lateral fraction, with complete endpoint witnesses at zero and one. */
  at: number;

  /** Direction for a shaft rooted at the lower band endpoint. */
  lower: IPortraitEyebrowFlowDirection;

  /** Direction for a shaft rooted at the upper band endpoint. */
  upper: IPortraitEyebrowFlowDirection;
}
