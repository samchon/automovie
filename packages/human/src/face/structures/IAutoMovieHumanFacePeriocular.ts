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
