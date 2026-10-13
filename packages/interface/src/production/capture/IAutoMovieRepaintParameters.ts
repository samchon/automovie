/** Stable, serializable diffusion controls stored in the receipt. */
export interface IAutoMovieRepaintParameters {
  /** Non-blank positive prompt. */
  prompt: string;

  /** Optional negative prompt. */
  negativePrompt?: string;

  /** Explicit deterministic request seed. */
  seed: number;

  /** Finite structural-preservation strength in [0, 1]. */
  strength: number;

  /** Additional adapter-defined scalar controls. */
  controls?: Record<string, string | number | boolean>;
}
