import { AutoMovieGuidePass, IAutoMovieRenderSpec } from "@automovie/interface";
import { guidePassFramePattern, normalizeGuidePasses, planGuidePassOutputs } from "./guidePasses";
import { ffmpegArgs } from "./ffmpegArgs";
import { frameName } from "./frameName";
import { framePattern } from "./framePattern";
import { IAutoMovieSequenceRenderFrame, IAutoMovieSequenceRenderPlan } from "./sequenceRenderPlan";
import type { IAutoMovieRenderChunkPlan } from "./IAutoMovieRenderChunkPlan";
import type { IAutoMovieRenderChunk } from "./IAutoMovieRenderChunk";
import type { IAutoMovieRenderPassManifest } from "./IAutoMovieRenderPassManifest";


/**
 * Split a `planSequenceRender` manifest into `chunkFrames`-sized, independently renderable chunks and the plan to concatenate them.
 *
 * Chunks are frame-atomic: chunk `i` holds the whole plan's frames `[i * chunkFrames, (i + 1) * chunkFrames)`, the last one clipped to the total. A transition's blend is already baked into each frame's `blend`, so a transition that straddles a boundary is split between frames with each frame keeping its blend, and concatenating the chunks reproduces the whole render frame for frame. Running chunks in parallel or on a farm is a host concern. The plan holds every frame of the render; only capture and encoding are bounded per chunk.
 *
 * When `passes` is given, every chunk also plans its per-pass frame paths through `planGuidePassOutputs`, with chunk-local indices, and the plan gains one {@link IAutoMovieRenderPassManifest} per pass. Omitting `passes` omits every pass field; an empty list plans empty pass sets; an unknown pass name throws before any chunk is built. Throws when `chunkFrames` is not a positive integer.
 *
 * `planProductionRenderJob` partitions frames with the same arithmetic but a different contract, restarting its index per deliverable and admitting only safe integers, so the two do not share a helper.
 *
 * @evidence contracts/common.md#principled-implementation Chunks are contiguous slices of the supplied binary64 frame schedule, so the method only re-labels frames and paths and never resamples time; the concat entries are basenames with each apostrophe written as `'\''`, the quoting `av_get_token` parses, because the demuxer resolves entries against the list file's directory and ends a quoted string at an apostrophe.
 * @evidence contracts/common.md#clear-and-simple-design The frameName, framePattern and ffmpegArgs helpers supply the same naming and encoding arguments as whole-render planning; guidePasses supplies pass normalization and naming. The production planner keeps separate partition arithmetic because its index restarts per deliverable and pass and its admission rule differs.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The label pad width comes from the chunk count so labels sort in play order, the concat arguments are ffmpeg's documented lossless form, and no chunk, pass or path is special-cased.
 * @evidence contracts/common.md#meaningful-documentation The doc states the boundary rule and why transitions survive it, that the plan holds all frames, the pass behavior for absent, empty and unknown lists, every refusal, and why production partitioning stays separate.
 * @evidence contracts/performance.md#efficient-algorithms For F frames, C chunks and P requested passes the metadata work is O(F + C * (P + 1)): each frame is sliced and re-labelled once, while each chunk builds paths and arguments and repeats bounded distinct-pass planning. Path string lengths additionally drive formatting and concat escaping.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The planner builds one chunk plan from one whole plan per call and coordinates no phases or consumers whose results it could share.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller-owned plan holds F relabelled frame records plus O(C * (P + 1)) pass/chunk path records and strings, whose byte lengths depend on supplied paths. Frame spreads share original non-path fields; per-chunk slice arrays become collectable after mapping, and this planner opens no handle or task.
 * @author Samchon
 */
export const planChunkedSequenceRender: (props: {
    plan: IAutoMovieSequenceRenderPlan;
    spec: IAutoMovieRenderSpec;
    chunkFrames: number;
    passes?: readonly string[];
}) => IAutoMovieRenderChunkPlan = (props: {
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
const baseName: (path: string) => string = (path: string): string =>
  path.slice(Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\")) + 1);


/**
 * Escape one concat-demuxer entry for its single-quoted file line. A quoted string cannot contain `'`, so each apostrophe closes the quote, emits an escaped quote, and reopens it (`'` becomes `'\''`), the grammar ffmpeg's `av_get_token` parses.
 */
const escapeConcatEntry: (name: string) => string = (name: string): string => name.replace(/'/g, "'\\''");


/**
 * Insert a `.<label>` tag before the output's extension, or append it when the basename has none. The extension dot is searched only within the basename, so a dotted directory such as `out.v2/render` tags the file, not the directory.
 */
const taggedOutput: (output: string, label: string) => string = (output: string, label: string): string => {
  const dot: number = output.lastIndexOf(".");
  const separator: number = Math.max(
    output.lastIndexOf("/"),
    output.lastIndexOf("\\"),
  );
  return dot <= separator
    ? `${output}.${label}`
    : `${output.slice(0, dot)}.${label}${output.slice(dot)}`;
};
