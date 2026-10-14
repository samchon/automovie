/**
 * One face articulation owner's field continued onto body-partition neck-band source vertices. Packed [bodyVertex,weight] rows ascend by body skin vertex with dimensionless weights in (0,1]. The band face view readdresses those rows for the existing face articulation owner, such as jaw. The schema alone validates neither residency nor numerical/anatomical continuity.
 *
 * @evidence contracts/common.md#principled-implementation Explicit owner identity and original body-vertex rows carry the same face attachment field across the source partition.
 * @evidence contracts/common.md#clear-and-simple-design A canonical owner/packed-row carrier leaves remapping, articulation and final body skin transport to existing producers/consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Partition labels or proximity do not invent attachments, and typed weights alone do not prove resident registration or measured tissue mechanics.
 * @evidence contracts/common.md#meaningful-documentation Prose states packed stride, ascending body index, (0,1] dimensionless gains and transient remapping owner.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This attachment record runs no row remapping or articulation evaluation; the band producer and face evaluator own those traversals.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Continued field identity implements no evaluated-band cache or request coordinator.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type acquires no posed geometry, worker or handle; its actual containing generation owns row storage.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonBandAttachment {
  /** The face articulation owner, such as `jaw`. */
  owner: string;

  /** `[bodyVertex, weight]` pairs ascending by body vertex. */
  rows: number[];
}
