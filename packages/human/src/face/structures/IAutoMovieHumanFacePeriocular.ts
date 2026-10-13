import type { IAutoMovieHumanFacePeriocularSide } from "./IAutoMovieHumanFacePeriocularSide";

/**
 * Producer-qualified registration of the periocular parts of a connected face
 * basis: which surfaces, regions, vertex rows and definitions are the brows,
 * lashes, globes, lid margins and canthi of each eye.
 *
 * Every eye-region consumer reads roles from this record instead of matching
 * asset names. The source producer publishes it with the basis, from data
 * files or from a manifest that reads the base mesh with a stated frame.
 * Vertex rows index the named surfaces of the same basis; positions are read
 * on the final shaped and posed Float32 surfaces. A basis without this record
 * has no periocular registration, and features that need it refuse by name.
 *
 * @evidence contracts/common.md#principled-implementation Explicit bilateral source roles route canthus, lid, brow, lash and globe consumers to registered resident surfaces/rows rather than locating anatomy from render names.
 * @evidence contracts/common.md#clear-and-simple-design Shared producer generation/provenance encloses independent left/right canonical side records; each specialized consumer owns its geometry admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing required fields refuse by registration name, and generation/hash metadata alone establishes neither measured anatomy nor a healthy rendered eye; consumers check their actual resident correspondence separately.
 * @evidence contracts/common.md#meaningful-documentation Anatomical signs, resident index domains, Float32 observation scope and producer authority identify what registration supplies and what remains unverified.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This source schema performs no role lookup or geometry generation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Shared source identity is a correspondence premise, not an evaluated-pose cache here.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Producer-owned registration arrays acquire no asset stream, query or renderer resource.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFacePeriocular {
  /** Producer/source generation identity the registration was read from. */
  generation: string;

  /** SHA-256 identities of the source inputs and the producer manifest. */
  sourceSha256: string[];

  /** Registration of the anatomical left eye (+X). */
  left: IAutoMovieHumanFacePeriocularSide;

  /** Registration of the anatomical right eye (-X). */
  right: IAutoMovieHumanFacePeriocularSide;
}
