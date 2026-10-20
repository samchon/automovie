/**
 * Exact serializable generation controls retained by the immutable repaint request and receipt.
 *
 * @evidence contracts/common.md#principled-implementation Explicit prompt, seed and strength fields describe generation controls, with a scalar map for adapter parameters. Nonblank text, safe-integer seed and finite unit-interval strength remain documented obligations without runtime validation in this type.
 * @evidence contracts/common.md#clear-and-simple-design Core prompt, seed and preservation controls remain explicit while an optional scalar map carries adapter-defined values rather than executable configuration; string values are not credential-screened here.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Seed does not promise identical external output; the retained record performs no dispatch, retry or immutable request preservation.
 * @evidence contracts/common.md#meaningful-documentation Defines prompt presence, optional negative prompt, safe seed, strength range and adapter-defined scalar controls with reproducibility limits.
 */
export interface IAutoMovieRepaintParameters {
  /** Non-blank positive prompt. */
  prompt: string;

  /** Optional negative prompt. */
  negativePrompt?: string;

  /** Explicit safe-integer request seed; identical output across provider calls is not guaranteed. */
  seed: number;

  /** Finite structural-preservation strength in [0, 1]. */
  strength: number;

  /** Additional adapter-defined scalar controls. */
  controls?: Record<string, string | number | boolean>;
}
