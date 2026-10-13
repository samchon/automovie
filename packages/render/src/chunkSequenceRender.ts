import { AutoMovieGuidePass, IAutoMovieRenderSpec } from "@automovie/interface";

import {
  IAutoMovieGuidePassOutput,
  guidePassFramePattern,
  normalizeGuidePasses,
  planGuidePassOutputs,
} from "./guidePasses";
import { ffmpegArgs, frameName, framePattern } from "./plan";
import {
  IAutoMovieSequenceRenderFrame,
  IAutoMovieSequenceRenderPlan,
} from "./sequenceRenderPlan";

/**
 * One independently renderable slice of a sequence render: a contiguous range
 * of the whole plan's output frames with its own frame directory, paths and
 * encoder invocation.
 *
 * A host captures and encodes one chunk at a time, so a long film is rendered,
 * and re-rendered after a change, in bounded windows of frame files.
 *
 * @evidence contracts/common.md#principled-implementation A chunk is a half-open range `[frameStart, frameEnd)` of global output indices with chunk-local file indices, so concatenating chunks in `index` order reproduces the whole schedule and every chunk's frame files start at `frame_00000`.
 * @evidence contracts/common.md#clear-and-simple-design The chunk repeats the whole plan's per-render fields (frame directory, first and last frame, input pattern, output path, ffmpeg arguments) so a host renders it with the same code path as an unchunked plan.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every sample field of a chunk frame is copied from the whole plan rather than recomputed, so a chunk cannot render differently from the same frames of the unchunked plan, and no chunk position is special-cased.
 * @evidence contracts/common.md#meaningful-documentation The prose states what a chunk is for; members give the inclusive and exclusive bounds, the global and chunk-local frames of reference, and when the guide-pass field is present.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This interface only types one chunk's manifest and executes nothing; the slicing cost is answered on `planChunkedSequenceRender`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A chunk manifest is inert data and coordinates no work between phases or consumers.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A chunk names files a host writes but owns no handle or task; its frame list grows with `chunkFrames` and lives inside the chunk plan.
 * @author Samchon
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
   * The chunk's frames. Each carries a chunk-local
   * {@link IAutoMovieSequenceRenderFrame.index} and `path`, so the chunk writes
   * its own files, while every sample field (`timeSeconds`, `shot`,
   * `shotTimeSeconds`, `blend`) is copied from the whole plan, so a chunk
   * renders identically to the same frames of the unchunked render.
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
   * This chunk's encoded video path: the whole plan's output path tagged with
   * the chunk label before its extension.
   */
  outputPath: string;

  /** Exact ffmpeg argument vector that encodes this chunk's frames. */
  ffmpegArgs: string[];

  /**
   * Per-pass output locations inside this chunk's frame directory, with
   * chunk-local indices; present only when the plan requested guide passes.
   * The `beauty` pass's untagged paths coincide with {@link frames}' paths,
   * because it is the base capture, and tagged passes sit beside them, such as
   * `frame_00000.depth.png`.
   */
  passOutputs?: IAutoMovieGuidePassOutput[];
}

/**
 * One guide pass's whole-timeline walk order across the chunks: how a host
 * visits every frame of the pass without a video concatenation.
 *
 * Tagged passes end as frame sequences, so this manifest is their reassembly;
 * the per-chunk input patterns let a host that wants a video encode one per
 * chunk.
 *
 * @evidence contracts/common.md#principled-implementation Two arrays parallel to the chunk list describe the walk, because the chunk directories already order the frames and the pass tag only changes the file pattern inside each directory.
 * @evidence contracts/common.md#clear-and-simple-design The manifest carries only directories, patterns and the total, and leaves frame-level paths to each chunk's `passOutputs`.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The beauty pass gets a manifest like every other pass, and no pass name is treated specially here; the beauty pass additionally reassembles as video through the concat plan.
 * @evidence contracts/common.md#meaningful-documentation The prose states that this is how a tagged pass is reassembled and why patterns are included; members state order, parallelism and the frame total.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The manifest is a data shape with no logic; building it is linear in chunks and is answered on the planner.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This type shares no work across phases; a host reads it once to walk a pass.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The manifest holds two string arrays of chunk-count length and owns no handle or task.
 * @author Samchon
 */
export interface IAutoMovieRenderPassManifest {
  /** The guide pass this manifest walks. */
  pass: AutoMovieGuidePass;

  /** Chunk frame directories in play order. */
  chunkFrameDirs: string[];

  /** Per-chunk ffmpeg input patterns for this pass, parallel to {@link chunkFrameDirs}. */
  inputPatterns: string[];

  /** Total frames of the pass across all chunks, equal to the plan's frame count. */
  frameCount: number;
}

/**
 * The plan that stitches the encoded chunk videos back into one video with
 * ffmpeg's concat demuxer and stream copy.
 *
 * The host writes `concatListLines` to `concatListPath` and runs ffmpeg with
 * `ffmpegArgs`. The list holds chunk basenames because the demuxer resolves a
 * relative entry against the list file's directory, which is also the chunk
 * outputs' directory.
 *
 * @evidence contracts/common.md#principled-implementation Stream copy through the concat demuxer joins chunks without re-encoding, which the demuxer supports because every chunk is encoded with the same spec and so carries identical stream parameters, and basename entries resolve correctly because the demuxer resolves relative entries against the list file's directory.
 * @evidence contracts/common.md#clear-and-simple-design The plan gives the list path, its exact lines and the argument vector, so the host only writes one file and spawns one process with no path logic of its own.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts `-safe 0` is ffmpeg's documented switch for accepting arbitrary entry names, needed because chunk basenames may contain characters the safe mode rejects, and no output name is special-cased.
 * @evidence contracts/common.md#meaningful-documentation The prose states the host's two steps and why entries are basenames; members state order, the line format and that the arguments copy streams.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This interface is a data shape whose construction cost belongs to the chunk planner.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The reassembly plan coordinates no repeated work; the host runs it once after every chunk is encoded.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type names a list file and a process the host owns; it holds only chunk-count strings itself.
 * @author Samchon
 */
export interface IAutoMovieRenderReassembly {
  /** Final video path, the whole plan's `outputPath`. */
  outputPath: string;

  /** Chunk output video paths, in play order. */
  chunkOutputs: string[];

  /** Path of the concat-demuxer list file the host writes, beside the output. */
  concatListPath: string;

  /**
   * Lines of that list, `file '<basename>'` with each apostrophe escaped, in
   * play order.
   */
  concatListLines: string[];

  /** Ffmpeg argument vector that concatenates the chunk videos with stream copy. */
  ffmpegArgs: string[];
}

/**
 * A long sequence render split into independently renderable chunks plus the
 * plan to reassemble them.
 *
 * @evidence contracts/common.md#principled-implementation The plan keeps the whole render's identity, rate and frame total beside the chunks, so a host can check that the chunks cover the render before reassembling it.
 * @evidence contracts/common.md#clear-and-simple-design Chunks, the video reassembly and the optional pass manifests are separate fields because the beauty video and tagged frame sequences finish differently.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Absent `passManifests` means no passes were requested, and the plan carries no host-specific field.
 * @evidence contracts/common.md#meaningful-documentation The prose states what the plan holds; members state what is copied from the whole plan, the shorter last chunk, and when pass manifests are present and how beauty and tagged passes finish.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The chunk plan type runs no code; producing it is answered on `planChunkedSequenceRender`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A chunk plan is a value handed to a host and coordinates no shared work itself.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The plan holds a copy of every output frame across its chunks, owned by whoever holds the value, and no handle or task.
 * @author Samchon
 */
export interface IAutoMovieRenderChunkPlan {
  /** Render target identity, copied from the whole plan. */
  target: IAutoMovieSequenceRenderPlan["target"];

  /** Output frames per second, copied from the whole plan. */
  renderFps: number;

  /** Total output frames across all chunks, equal to the whole plan's. */
  frameCount: number;

  /** Frames per chunk; the last chunk may be shorter. */
  chunkFrames: number;

  /** Number of chunks, `ceil(frameCount / chunkFrames)`. */
  chunkCount: number;

  /** The chunks, in capture order. */
  chunks: IAutoMovieRenderChunk[];

  /** How to stitch the chunk videos into the final video. */
  reassembly: IAutoMovieRenderReassembly;

  /**
   * Per-pass whole-timeline walk orders, present only when guide passes were
   * requested. The `beauty` pass reassembles as video through
   * {@link reassembly}; tagged passes end as frame sequences, because diffusion
   * guidance consumes frames, so their walk order is their reassembly.
   */
  passManifests?: IAutoMovieRenderPassManifest[];
}

/**
 * Split a `planSequenceRender` manifest into `chunkFrames`-sized,
 * independently renderable chunks and the plan to concatenate them.
 *
 * Chunks are frame-atomic: chunk `i` holds the whole plan's frames
 * `[i × chunkFrames, (i + 1) × chunkFrames)`, the last one clipped to the
 * total. A transition's blend is already baked into each frame's `blend`, so a
 * transition that straddles a boundary is split between frames with each frame
 * keeping its blend, and concatenating the chunks reproduces the whole render
 * frame for frame. Running chunks in parallel or on a farm is a host concern.
 * The plan holds every frame of the render; only capture and encoding are
 * bounded per chunk.
 *
 * When `passes` is given, every chunk also plans its per-pass frame paths
 * through `planGuidePassOutputs`, with chunk-local indices, and the plan gains
 * one {@link IAutoMovieRenderPassManifest} per pass. Omitting `passes` omits
 * every pass field; an empty list plans empty pass sets; an unknown pass name
 * throws before any chunk is built. Throws when `chunkFrames` is not a positive
 * integer.
 *
 * `planProductionRenderJob` partitions frames with the same arithmetic but a
 * different contract, restarting its index per deliverable and admitting only
 * safe integers, so the two do not share a helper.
 *
 * @evidence contracts/common.md#principled-implementation Chunks are contiguous slices of the already rational frame schedule, so the method only re-labels frames and paths and never resamples time; the concat entries are basenames with each apostrophe written as `'\''`, the quoting `av_get_token` parses, because the demuxer resolves entries against the list file's directory and ends a quoted string at an apostrophe.
 * @evidence contracts/common.md#clear-and-simple-design Frame naming, patterns and encoder arguments come from `plan.ts`, and pass normalization and naming from `guidePasses.ts`, so a chunk is named like a whole render; the production planner keeps its own three lines of partition arithmetic because its index restarts per deliverable and pass and its admission rule differs.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The label pad width comes from the chunk count so labels sort in play order, the concat arguments are ffmpeg's documented lossless form, and no chunk, pass or path is special-cased.
 * @evidence contracts/common.md#meaningful-documentation The doc states the boundary rule and why transitions survive it, that the plan holds all frames, the pass behavior for absent, empty and unknown lists, every refusal, and why production partitioning stays separate.
 * @evidence contracts/performance.md#efficient-algorithms For F frames, C chunks and P passes the cost is O(F + C × P): each frame is sliced and re-labelled once, and per-chunk work is constant apart from pass outputs and the argument vector.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The planner builds one chunk plan from one whole plan per call and coordinates no phases or consumers whose results it could share.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned plan, owned by the caller, holds a relabelled copy of all F frames plus O(C × P) strings; the per-chunk slices are released as each chunk's frames are built, and no handle or task is opened.
 * @author Samchon
 */
export const planChunkedSequenceRender = (props: {
  /** The whole-sequence render manifest to split. */
  plan: IAutoMovieSequenceRenderPlan;

  /** Render spec for each chunk's encoder arguments; its target matches the plan. */
  spec: IAutoMovieRenderSpec;

  /** Output frames per chunk, a positive integer. */
  chunkFrames: number;

  /** Guide passes to plan per chunk; omit for a beauty-only render. */
  passes?: readonly string[];
}): IAutoMovieRenderChunkPlan => {
  const plan: IAutoMovieSequenceRenderPlan = props.plan;
  const spec: IAutoMovieRenderSpec = props.spec;
  const chunkFrames: number = props.chunkFrames;
  if (!Number.isInteger(chunkFrames) || chunkFrames <= 0)
    throw new Error(
      `chunkFrames must be a positive integer, but was ${chunkFrames}`,
    );
  const passes: AutoMovieGuidePass[] | undefined =
    props.passes === undefined ? undefined : normalizeGuidePasses(props.passes);

  const chunkCount: number = Math.ceil(plan.frames.length / chunkFrames);
  const pad: number = String(Math.max(chunkCount - 1, 0)).length;

  const chunks: IAutoMovieRenderChunk[] = Array.from(
    { length: chunkCount },
    (_: unknown, index: number): IAutoMovieRenderChunk => {
      const frameStart: number = index * chunkFrames;
      const frameEnd: number = Math.min(
        frameStart + chunkFrames,
        plan.frames.length,
      );
      const slice: IAutoMovieSequenceRenderFrame[] = plan.frames.slice(
        frameStart,
        frameEnd,
      );
      const label: string = `chunk_${String(index).padStart(pad, "0")}`;
      const frameDir: string = `${plan.frameDir}/${label}`;
      const frames: IAutoMovieSequenceRenderFrame[] = slice.map(
        (
          frame: IAutoMovieSequenceRenderFrame,
          local: number,
        ): IAutoMovieSequenceRenderFrame => ({
          ...frame,
          index: local,
          path: `${frameDir}/${frameName(local)}`,
        }),
      );
      const inputPattern: string = `${frameDir}/${framePattern()}`;
      const outputPath: string = taggedOutput(plan.outputPath, label);
      return {
        index,
        frameStart,
        frameEnd,
        frameCount: frames.length,
        startSeconds: slice[0]!.timeSeconds,
        endSeconds: slice[slice.length - 1]!.timeSeconds,
        frames,
        frameDir,
        firstFrame: `${frameDir}/${frameName(0)}`,
        lastFrame: `${frameDir}/${frameName(frames.length - 1)}`,
        inputPattern,
        outputPath,
        ffmpegArgs: ffmpegArgs(spec, inputPattern, outputPath),
        ...(passes === undefined
          ? {}
          : {
              passOutputs: planGuidePassOutputs({
                frameDir,
                frameCount: frames.length,
                passes,
              }),
            }),
      };
    },
  );

  const chunkOutputs: string[] = chunks.map(
    (chunk: IAutoMovieRenderChunk): string => chunk.outputPath,
  );
  const concatListPath: string = `${plan.outputPath}.concat.txt`;
  // The concat demuxer resolves a relative entry against the list file's
  // directory, and `taggedOutput` keeps every chunk beside the list, so entries
  // are basenames; a directory-qualified entry would resolve twice.
  const concatListLines: string[] = chunkOutputs.map(
    (output: string): string => `file '${escapeConcatEntry(baseName(output))}'`,
  );
  return {
    target: plan.target,
    renderFps: plan.renderFps,
    frameCount: plan.frames.length,
    chunkFrames,
    chunkCount,
    chunks,
    ...(passes === undefined
      ? {}
      : {
          passManifests: passes.map(
            (pass: AutoMovieGuidePass): IAutoMovieRenderPassManifest => ({
              pass,
              chunkFrameDirs: chunks.map(
                (chunk: IAutoMovieRenderChunk): string => chunk.frameDir,
              ),
              inputPatterns: chunks.map(
                (chunk: IAutoMovieRenderChunk): string =>
                  `${chunk.frameDir}/${guidePassFramePattern(pass)}`,
              ),
              frameCount: plan.frames.length,
            }),
          ),
        }),
    reassembly: {
      outputPath: plan.outputPath,
      chunkOutputs,
      concatListPath,
      concatListLines,
      ffmpegArgs: [
        "-y",
        "-f",
        "concat",
        "-safe",
        "0",
        "-i",
        concatListPath,
        "-c",
        "copy",
        plan.outputPath,
      ],
    },
  };
};

/** The path's last segment, after the final `/` or `\`. */
const baseName = (path: string): string =>
  path.slice(Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\")) + 1);

/**
 * Escape one concat-demuxer entry for its single-quoted `file '…'` line. A
 * quoted string cannot contain `'`, so each apostrophe closes the quote, emits
 * an escaped quote, and reopens it (`'` becomes `'\''`), the grammar ffmpeg's
 * `av_get_token` parses.
 */
const escapeConcatEntry = (name: string): string => name.replace(/'/g, "'\\''");

/**
 * Insert a `.<label>` tag before the output's extension, or append it when the
 * basename has none. The extension dot is searched only within the basename,
 * so a dotted directory such as `out.v2/render` tags the file, not the
 * directory.
 */
const taggedOutput = (output: string, label: string): string => {
  const dot: number = output.lastIndexOf(".");
  const separator: number = Math.max(
    output.lastIndexOf("/"),
    output.lastIndexOf("\\"),
  );
  return dot <= separator
    ? `${output}.${label}`
    : `${output.slice(0, dot)}.${label}${output.slice(dot)}`;
};
