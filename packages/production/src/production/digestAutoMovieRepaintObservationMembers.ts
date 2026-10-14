import { IAutoMovieRepaintObservationMember } from "@automovie/interface";
import { canonicalAutoMovieJsonBytes, digestAutoMovieBytes } from "./contentIdentity";
import { productionRepaintObservationAssertMembers } from "./productionRepaintObservationAssertMembers";

/**
 * Admit and digest an ordered declared active visual set. Nonempty members need exact unique occurrence IDs and supported lane-specific identities; the complete array is canonicalized without reordering members. This computes metadata identity and watches no playback or resident media.
 *
 * @evidence contracts/common.md#principled-implementation Runtime member admission precedes canonical array encoding and SHA-256, retaining occurrence order and all supplied serializable member fields.
 * @evidence contracts/common.md#clear-and-simple-design Member identity composition is separate from sequence verdicts, current artifact reads and actual playback observation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Repeated occurrence IDs or missing selected-lane identity refuse; digest equality itself certifies no visual quality or current resident selection.
 * @evidence contracts/common.md#meaningful-documentation Prose gives ordered metadata admission, unchanged inputs and the absent playback/byte observation.
 * @evidence contracts/performance.md#efficient-algorithms One N-member validation plus canonical tree/key sorting, UTF-8 encoding and hashing scales with the complete supplied record/text population.
 * @evidence contracts/performance.md#reuse-equivalent-work Shared admission and canonical/hash primitives serve persisted and current sets; no cached digest assumes later mutable member equivalence.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Validation sets and encoded text/bytes expire at return or throw; only the digest string escapes without media, browser or file resources.
 */
export const digestAutoMovieRepaintObservationMembers: (members: readonly IAutoMovieRepaintObservationMember[]) => string = (
  members: readonly IAutoMovieRepaintObservationMember[],
): string => {
  productionRepaintObservationAssertMembers(members);
  return digestAutoMovieBytes(canonicalAutoMovieJsonBytes(members));
};
