import type { IAutoMovieHumanFacePeriocularSide } from "./IAutoMovieHumanFacePeriocularSide";

/**
 * Producer-qualified registration of the periocular parts of a connected face
 * basis: which surfaces, regions, vertex rows and definitions are the brows,
 * lashes, globes, lid margins and canthi of each eye.
 *
 * Every eye-region consumer reads roles from this record instead of matching
 * asset names. The source producer publishes it with the basis, from CC0 data
 * files or from a manifest that reads the CC0 base mesh with a stated frame.
 * Vertex rows index the named surfaces of the same basis; positions are read
 * on the final shaped and posed Float32 surfaces. A basis without this record
 * has no periocular registration, and features that need it refuse by name.
 *
 * @evidence contracts/common.md#principled-implementation One registration names every periocular role, so consumers share one definition.
 * @evidence contracts/common.md#clear-and-simple-design Two named sides plus provenance.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Roles come from the source producer's registration, never from asset names.
 * @evidence contracts/common.md#meaningful-documentation States what each member identifies and who supplies it.
 * @evidence contracts/modeling.md#spatial-conventions Vertex rows index basis surfaces; positions are read in the head frame, +X anatomical left.
 * @evidenceExclude contracts/modeling.md#parameter-channels Registers identity; defines no channel.
 * @evidence contracts/modeling.md#part-identity-and-grouping Names the parts of each eye region and which surface carries them.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no geometry.
 * @evidence contracts/modeling.md#shared-boundaries Margins and canthi are the shared boundary the lid, lash and globe consumers meet on.
 * @evidenceExclude contracts/modeling.md#rendered-observation The face builder's consumers own observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The source manifest records the CC0 data or mesh reading each entry comes from.
 * @evidenceExclude contracts/anatomy.md#permitted-range Registers identity; bounds no value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Producer registration, not an authored control.
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
