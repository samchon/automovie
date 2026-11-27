import type { AutoMovieGuidePass } from "../cinematics/AutoMovieGuidePass";

/**
 * Where one guide pass writes its frames inside a frame directory, as
 * `planGuidePassOutputs` plans it.
 *
 * Paths join the frame directory and the default `png` five-digit frame name
 * with `/`.
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
