import type { IAutoMovieHumanFaceBasis } from "@automovie/human/face/structures/IAutoMovieHumanFaceBasis";

/**
 * Inputs of the optical support: the head view's face, whose eye surface,
 * attachments, landmarks, articulation and endpoint rows the support
 * witnesses, and the provenance it records.
 *
 * @author Samchon
 */
export interface IHumanSourceOpticalInput {
  /** The head view's face, as consumers load it. */
  face: IAutoMovieHumanFaceBasis;

  /** Generation identity. */
  generation: string;

  /** SHA-256 identities of the generation inputs. */
  sourceSha256: string[];
}
