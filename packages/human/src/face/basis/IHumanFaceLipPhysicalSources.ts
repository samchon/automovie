import type { IAutoMovieMeshPhysicalSource } from "@automovie/interface";

import type { IHumanFaceMaterialAttachment } from "../structures/IHumanFaceMaterialAttachment";

/**
 * Physical aliases and material interpolation from one complete lip margin.
 * The registration belongs to one figure instance. Material numeric IDs are
 * exact-key ordinals in their separate domain, never native vertex numbers.
 *
 * @evidence contracts/common.md#principled-implementation registerHumanFaceLipPhysicalSources preserves canonical native sample ids and assigns sorted exact material identities separate nonnegative ordinals with original parent/weight interpolation.
 * @evidence contracts/common.md#clear-and-simple-design Reader identity lookup and material-domain attachment lookup remain distinct from native vertex numbering for final Person placement.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Both complete lip courses are a producer premise; coordinates, integer hashes and newly inserted source vertices never establish physical identity.
 * @evidence contracts/common.md#meaningful-documentation Members state domain/id roles, instance qualification and original source interpolation.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This result implements no registration; its producer owns sorting/support scans.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type schedules no work; exact-identity deduplication belongs to its producer.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type acquires no handle; instance-owned source/attachment maps live with final placement.
 *
 * @author Samchon
 */
export interface IHumanFaceLipPhysicalSources {
  /** Reader identity to its actual domain and nonnegative numeric source ID. */
  sources: ReadonlyMap<string, IAutoMovieMeshPhysicalSource>;

  /** Material domain, then numeric ID, to original source interpolation. */
  materialAttachments: ReadonlyMap<
    string,
    ReadonlyMap<number, IHumanFaceMaterialAttachment>
  >;
}
