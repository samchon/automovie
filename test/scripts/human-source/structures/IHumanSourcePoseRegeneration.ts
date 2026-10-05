import type { IAutoMovieHumanBodyBasis } from "@automovie/human/body/structures/IAutoMovieHumanBodyBasis";

import type { IHumanSourceGeneration } from "./IHumanSourceGeneration.ts";

/**
 * The body view and generation after the pose correctives were re-solved, with
 * the producer's receipt.
 *
 * @author Samchon
 */
export interface IHumanSourcePoseRegeneration {
  /** The P1 body basis with the re-solved correctives in place of the dropped ones. */
  body: IAutoMovieHumanBodyBasis;

  /** The generation with the same correctives and their rows on its samples. */
  generation: IHumanSourceGeneration;

  /** The producer's receipt. */
  receipt: Record<string, unknown>;
}
