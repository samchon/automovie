import type { IAutoMovieHumanBodyArticularCandidate } from "../anatomy/generated/IAutoMovieHumanBodyArticularCandidate";
import type { IAutoMovieHumanBodyUnvalidatedGeometry } from "../anatomy/generated/IAutoMovieHumanBodyUnvalidatedGeometry";

/**
 * Exported qualification of one articular head candidate source member.
 *
 * The ID is the candidate's whole-bone name with a `/head-candidate` suffix,
 * matching exactly one source part of the carrying primitive. The record
 * repeats the candidate's target source and reference-rig registration and
 * states that no complete anatomical part was resolved.
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
