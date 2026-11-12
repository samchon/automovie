import { IAutoMovieGuidePassOutput } from "./guidePasses.js";
import { IAutoMovieSequenceRenderFrame } from "./sequenceRenderPlan.js";

/**
 * One independently renderable slice of a sequence render: a contiguous range of the whole plan's output frames with its own frame directory, paths and encoder invocation.
 *
 * A host can capture and encode one chunk at a time to limit each window's frame files; this declaration and the planner do not execute or bound that host's processes.
 *
 * @evidence contracts/development/design.md#principled-representation A chunk is a half-open range `[frameStart, frameEnd)` of global output indices with chunk-local file indices, so concatenating chunks in `index` order reproduces the whole schedule and every chunk's frame files start at `frame_00000`.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The chunk repeats the whole plan's per-render fields (frame directory, first and last frame, input pattern, output path, ffmpeg arguments) so a host renders it with the same code path as an unchunked plan.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every sample field of a chunk frame is copied from the whole plan rather than recomputed, so a chunk cannot render differently from the same frames of the unchunked plan, and no chunk position is special-cased.
 * @evidence contracts/development/common.md#meaningful-documentation The prose states what a chunk is for; members give the inclusive and exclusive bounds, the global and chunk-local frames of reference, and when the guide-pass field is present.
 */
export interface IAutoMovieRenderChunk {
  /** Zero-based chunk ordinal in capture and concatenation order. */
  index: number;

  /** First global output frame index in this chunk, inclusive. */
  frameStart: number;

  /** One past the last global output frame index in this chunk, exclusive. */
  frameEnd: number;

  /** Number of frames in this chunk, `frameEnd - frameStart`. */
  frameCount: number;

  /** Global output time of this chunk's first frame, in seconds. */
  startSeconds: number;

  /** Global output time of this chunk's last frame, in seconds. */
  endSeconds: number;

  /**
   * The chunk's frames. Each carries a chunk-local {@link IAutoMovieSequenceRenderFrame.index} and `path`, while every sample field (`timeSeconds`, `shot`, `shotTimeSeconds`, `blend`) is copied from the whole plan, preserving the same sampling inputs as those unchunked frames.
   */
  frames: IAutoMovieSequenceRenderFrame[];

  /** Directory this chunk's frame files are written to. */
  frameDir: string;

  /** Path of the chunk's first frame file. */
  firstFrame: string;

  /** Path of the chunk's last frame file. */
  lastFrame: string;

  /** Ffmpeg input pattern matching this chunk's frame files. */
  inputPattern: string;

  /**
   * This chunk's encoded video path: the whole plan's output path tagged with the chunk label before its extension.
   */
  outputPath: string;

  /** Exact ffmpeg argument vector that encodes this chunk's frames. */
  ffmpegArgs: string[];

  /**
   * Per-pass output locations inside this chunk's frame directory, with chunk-local indices; present only when the plan requested guide passes. The `beauty` pass's untagged paths coincide with {@link frames}' paths, because it is the base capture, and tagged passes sit beside them, such as `frame_00000.depth.png`.
   */
  passOutputs?: IAutoMovieGuidePassOutput[];
}
