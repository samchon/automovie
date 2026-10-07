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
 * @evidence contracts/common.md#principled-implementation Each exported member carries its candidate qualification under an exact source ID, separate from geometry identity.
 * @evidence contracts/common.md#clear-and-simple-design One named record replaces the qualification's anonymous part element.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No tissue, held-out error or clinical certification is inferred from the target sphere.
 * @evidence contracts/common.md#meaningful-documentation States the ID form, its match to a source part and the unavailable whole anatomy.
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
