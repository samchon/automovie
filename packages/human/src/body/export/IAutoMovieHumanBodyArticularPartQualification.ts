import type { IAutoMovieHumanBodyArticularCandidate } from "../anatomy/generated/IAutoMovieHumanBodyArticularCandidate";
import type { IAutoMovieHumanBodyUnvalidatedGeometry } from "../anatomy/generated/IAutoMovieHumanBodyUnvalidatedGeometry";

/**
 * Exported qualification of one articular head candidate source member.
 *
 * The ID is the candidate's whole-bone name with a /head-candidate suffix, matching one source part of the carrying primitive. Target provenance and reference-rig placement remain distinct from a complete anatomical part, which this candidate does not resolve.
 *
 * @evidence contracts/common.md#principled-implementation The candidate member ID, target provenance, reference-only registration and unresolved part result preserve the numerical inspector's actual qualification.
 * @evidence contracts/common.md#clear-and-simple-design One small member record joins the generic source partition without carrying a second geometry or interval representation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The closed target/reference literals cannot be upgraded into imaging acquisition, personal registration or complete bone resolution.
 * @evidence contracts/common.md#meaningful-documentation The ID suffix and member comments distinguish candidate geometry from its anatomical whole-bone identity and unresolved qualification.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Candidate member qualification typing constructs no sphere or accessor partition.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The member schema implements no cache of candidate geometry or inspection results.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This qualification type acquires no mesh buffers, source handles or task.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyArticularPartQualification {
  /** Exact source candidate ID, distinct from its complete bone. */
  id: `${IAutoMovieHumanBodyArticularCandidate["part"]}/head-candidate`;

  /** A fictional target rather than an imaging acquisition. */
  source: "target";

  /** Placement uses the reference rig and certifies no personal registration. */
  registration: "reference-rig-only";

  /** The sphere does not resolve a complete anatomical part. */
  partResolution: IAutoMovieHumanBodyUnvalidatedGeometry;
}
