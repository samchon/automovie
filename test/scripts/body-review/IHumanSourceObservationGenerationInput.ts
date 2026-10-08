import type { IAutoMovieHumanPersonGeneration } from "@automovie/human/human/structures/IAutoMovieHumanPersonGeneration";

/** Existing joined generation and exact compressed source-file identities. */
export interface IHumanSourceObservationGenerationInput {
  /** The two views after the original generation/partition identity checks. */
  generation: IAutoMovieHumanPersonGeneration;

  /** Head/body filenames map to their actual compressed-byte SHA-256 values. */
  files: Record<string, string>;
}
