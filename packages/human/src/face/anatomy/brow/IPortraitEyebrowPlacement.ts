import type { IPortraitEyebrowFlowDirection } from "./IPortraitEyebrowFlowDirection";

/**
 * A brow profile's root extent, end thinning and grain after its spelling has
 * been resolved: what the shaft builder and the admission both read.
 *
 *
 * @evidence contracts/common.md#principled-implementation Resolved root bounds, endpoint fade lengths and an optional flow sampler give admission and both shaft builders one spelling-independent placement.
 * @evidence contracts/common.md#clear-and-simple-design Tuple bounds and fade values are resolved once while the optional callback owns direction sampling.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Undefined flow retains the original span/bend law rather than inventing a complete profile or silently resolving contradictory spellings.
 * @evidence contracts/common.md#meaningful-documentation Members state lower-to-upper root fractions, medial/lateral fade fractions and callback omission meaning.
 * @evidenceExclude contracts/performance.md#efficient-algorithms IPortraitEyebrowPlacement is a TypeScript-only schema and executes no guide, surface or field algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work IPortraitEyebrowPlacement declares inputs or results; copying and equivalence belong to its concrete producer/consumer.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources IPortraitEyebrowPlacement acquires no runtime state or handle; array, map and callback lifetimes remain with their owning operations.
 *
 * @author Samchon
 */
export interface IPortraitEyebrowPlacement {
  /** Lowest and highest root position across the band, lower boundary zero to upper one. */
  rootBand: readonly [number, number];

  /** Medial and lateral thinning extents in the boundary's longitudinal parameter, not physical arc-length fractions. */
  endFade: readonly [number, number];

  /**
   * Sample dimensionless longitudinal and within-root-band fractions in [0,1].
   * The placement owner supplies an admitted owned flow; undefined retains
   * the basic span/bend law in the shaft builder.
   *
   * @evidence contracts/common.md#principled-implementation The supplied sampler applies convex smoothstep/linear interpolation to admitted complete flow witnesses, returning a bounded tip and finite authored bend.
   * @evidence contracts/common.md#clear-and-simple-design Direction sampling stays with createPortraitEyebrowFlow while placement exposes only the normalized callback.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Query fractions outside [0,1] refuse; sampling does not add fibres or replace actual reference/host geometry.
   * @evidence contracts/common.md#meaningful-documentation The member states both fraction domains, the admitted-copy owner and undefined basic-law meaning.
   * @evidence contracts/performance.md#efficient-algorithms The actual sampler searches at most 32 complete sections and performs constant scalar interpolation after locating the interval.
   * @evidence contracts/performance.md#reuse-equivalent-work All shaft queries reuse the same admitted copied witness list, whose value is independent of later caller profile changes.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The placement's caller owns the callback lifetime; it retains only the copied witness population and acquires no task or handle.
   */
  flow?: (at: number, root: number) => IPortraitEyebrowFlowDirection;
}
