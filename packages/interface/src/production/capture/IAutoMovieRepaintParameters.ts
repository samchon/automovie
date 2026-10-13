/**
 * Exact serializable generation controls retained by the immutable repaint request and receipt.
 *
 * @evidence contracts/common.md#principled-implementation Admission validates trimmed nonblank positive prompt, safe-integer seed, finite strength in the closed unit interval and scalar adapter controls, then includes their canonical values in request identity.
 * @evidence contracts/common.md#clear-and-simple-design Core prompt, seed and preservation controls remain explicit while an optional scalar map serves adapter-owned controls without embedding credentials or executable configuration.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Seed is a retained request control, not a promise that arbitrary external generators reproduce identical bytes; retry preserves the exact immutable request rather than silently changing parameters.
 * @evidence contracts/common.md#meaningful-documentation Defines prompt presence, optional negative prompt, safe seed, strength range and adapter-defined scalar controls with reproducibility limits.
 * @author Samchon
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
