/**
 * Exact serializable generation controls retained by the immutable repaint
 * request and receipt.
 */
export interface IAutoMovieRepaintParameters {
  /** Non-blank positive prompt. */
  prompt: string;

  /** Optional negative prompt. */
  negativePrompt?: string;

  /**
   * Explicit safe-integer request seed; identical output across provider calls
   * is not guaranteed.
   */
  seed: number;

  /** Finite structural-preservation strength in [0, 1]. */
  strength: number;

  /** Additional adapter-defined scalar controls. */
  controls?: Record<string, string | number | boolean>;
}
