/**
 * The conchal bowl's two extents read against the auricle's attachment line
 * (`readHumanConchaExtent`), metres.
 *
 *
 * @evidence contracts/common.md#principled-implementation Conchal source extents use the auricle attachment direction and perpendicular anterior direction in metres; readHumanConchaExtent owns sampled registration, not clinical boundary accuracy or depth.
 * @evidence contracts/common.md#clear-and-simple-design The two-field result separates extent reporting from source registration and projection rules in the reader.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No population value or specimen identity substitutes either mesh-derived extent in this result.
 * @evidence contracts/common.md#meaningful-documentation The prose and member comments give attachment-relative directions, bowl meaning and metre units.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased conchal extent shape selects no region-projection algorithm; its producing reader owns that work.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The scalar pair coordinates no repeated head-region operation or cached concha registration.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The extent declaration acquires no buffer, handle or task; concrete lengths belong to the result holder.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanConchaExtent {
  /** Superior-to-inferior extent along the attachment line, metres. */
  length: number;

  /** Anterior-to-posterior extent perpendicular to the attachment line, metres. */
  breadth: number;
}
