import type { IPortraitEyebrowBinding } from "./IPortraitEyebrowBinding";
import type { IPortraitEyebrowProfile } from "./IPortraitEyebrowProfile";

/**
 * Native reference band and numerical shaft traits shared by source preparation
 * and runtime. These source positions are not a person's sculpting resource.
 *
 *
 * @evidence contracts/common.md#principled-implementation Complete shape-only skin coordinates and native band identities define the same reference guide for source preparation and runtime.
 * @evidence contracts/common.md#clear-and-simple-design Reference geometry, boundary binding, requested population and shaft profile are separate inputs to the shared guide owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Reference positions are source assets, not a person's sculpting controls, and requested count remains distinct from end-fade survivors.
 * @evidence contracts/common.md#meaningful-documentation Members distinguish head-frame metres from profile millimetres and document the pre-thinning count.
 * @evidenceExclude contracts/performance.md#efficient-algorithms IHumanFaceBrowReferenceGuidesInput is a TypeScript-only schema and executes no guide, surface or field algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work IHumanFaceBrowReferenceGuidesInput declares inputs or results; copying and equivalence belong to its concrete producer/consumer.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources IHumanFaceBrowReferenceGuidesInput acquires no runtime state or handle; array, map and callback lifetimes remain with their owning operations.
 *
 * @author Samchon
 */
export interface IHumanFaceBrowReferenceGuidesInput {
  /** Complete shape-only reference skin positions in head-frame metres. */
  positions: readonly number[];

  /** Source-native upper and lower implantation boundaries and side. */
  binding: IPortraitEyebrowBinding;

  /** Requested count before end-fade thinning. */
  count: number;

  /** Shaft traits with their existing millimetre and fraction meanings. */
  profile: IPortraitEyebrowProfile;
}
