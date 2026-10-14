/**
 * One shaft's derived finite guide on the shape-only source reference.
 * Stations are head-frame metres before native seating, not personal curve
 * inputs. The original population ordinal survives thinning and registration.
 *
 *
 * @evidence contracts/common.md#principled-implementation An original population ordinal identifies ordered head-frame stations derived on the shape-only reference before native seating.
 * @evidence contracts/common.md#clear-and-simple-design The guide stores only ordinal and reference points while chart seating and shaft lifting remain downstream geometry owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Thinning does not renumber the original population and these derived stations are not per-person authored curve inputs.
 * @evidence contracts/common.md#meaningful-documentation The description states reference frame, seating stage, resolution and ordinal survival through thinning and registration.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Shape-reference brow guide schema is erased by TypeScript; its runtime consumer owns the actual geometry or measurement traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Shape-reference brow guide schema specifies caller data and performs no runtime recomputation or cache lookup.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Shape-reference brow guide schema acquires no runtime handle or retained cache; concrete array and map ownership belongs to its producing and consuming functions.
 *
 * @author Samchon
 */
export interface IHumanFaceBrowReferenceGuide {
  /** Original population ordinal, independent of surviving guide count. */
  index: number;

  /** Ordered reference 3D stations at the requested shaft resolution. */
  points: readonly (readonly number[])[];
}
