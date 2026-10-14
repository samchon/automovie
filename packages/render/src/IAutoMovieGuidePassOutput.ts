import type { AutoMovieGuidePass } from "@automovie/interface";

/**
 * Where one guide pass writes its frames inside a frame directory, as
 * `planGuidePassOutputs` plans it.
 *
 * Paths join the frame directory and the default `png` five-digit frame name
 * with `/`.
 *
 * @evidence contracts/common.md#principled-implementation The record stores the first and last frame paths and the ffmpeg pattern, which are the three facts a capture writer and an encoder need to address one pass's sequence.
 * @evidence contracts/common.md#clear-and-simple-design Four plain fields per pass, with no frame list, because the pattern already addresses every frame between the first and last.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every field is derived from the shared naming rule; nothing is special-cased per pass beyond the untagged beauty name.
 * @evidence contracts/common.md#meaningful-documentation The doc names the producer and the path spelling, and each member states which frame or input it addresses.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The output record is produced, not computed over; the six-pass bound on how many exist per directory is answered on `planGuidePassOutputs`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each output record is four strings for one pass in one directory, and planning a new directory rebuilds them because their paths differ.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This erased output type opens no frame; planGuidePassOutputs produces first/last/pattern strings for the directory's selected passes, and its caller retains them independently of later host capture resources.
 * @author Samchon
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
