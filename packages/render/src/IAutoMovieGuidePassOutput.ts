import type { AutoMovieGuidePass } from "@automovie/interface";

/**
 * Where one guide pass writes its frames inside a frame directory, as
 * `planGuidePassOutputs` plans it.
 *
 * Paths join the frame directory and the default `png` five-digit frame name
 * with `/`.
 *
 * @evidence contracts/development/design.md#principled-representation The record stores the first and last frame paths and the ffmpeg pattern, which are the three facts a capture writer and an encoder need to address one pass's sequence.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Four plain fields per pass, with no frame list, because the pattern already addresses every frame between the first and last.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every field is derived from the shared naming rule; nothing is special-cased per pass beyond the untagged beauty name.
 * @evidence contracts/development/common.md#meaningful-documentation The doc names the producer and the path spelling, and each member states which frame or input it addresses.
 */
export interface IAutoMovieGuidePassOutput {
  /** The guide pass these paths belong to. */
  pass: AutoMovieGuidePass;

  /** Path of the pass's frame 0. */
  firstFrame: string;

  /** Path of the pass's last frame, numbered `frameCount - 1`. */
  lastFrame: string;

  /** Ffmpeg `-i` pattern matching every frame of the pass. */
  inputPattern: string;
}
