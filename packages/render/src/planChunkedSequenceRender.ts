import type {
  AutoMovieGuidePass,
  IAutoMoviePlanChunkedSequenceRenderProps,
  IAutoMovieRenderChunk,
  IAutoMovieRenderChunkPlan,
  IAutoMovieRenderPassManifest,
  IAutoMovieRenderSpec,
  IAutoMovieSequenceRenderFrame,
  IAutoMovieSequenceRenderPlan,
} from "@automovie/interface";

import { ffmpegArgs } from "./ffmpegArgs.js";
import { frameName } from "./frameName.js";
import { framePattern } from "./framePattern.js";
import {
  guidePassFramePattern,
  normalizeGuidePasses,
  planGuidePassOutputs,
} from "./guidePasses.js";

/**
 * Split a `planSequenceRender` manifest into `chunkFrames`-sized, independently
 * renderable chunks and the plan to concatenate them.
 *
 * Chunks are frame-atomic: chunk `i` holds the whole plan's frames `[i *
 * chunkFrames, (i + 1) * chunkFrames)`, the last one clipped to the total. A
 * transition's blend is already baked into each frame's `blend`, so a
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
 */
export const planChunkedSequenceRender: (
  props: IAutoMoviePlanChunkedSequenceRenderProps,
) => IAutoMovieRenderChunkPlan = (
  props: IAutoMoviePlanChunkedSequenceRenderProps,
): IAutoMovieRenderChunkPlan => {
  const plan: IAutoMovieSequenceRenderPlan = props.plan;
  const spec: IAutoMovieRenderSpec = props.spec;
  const chunkFrames: number = props.chunkFrames;
  if (chunkFrames <= 0)
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
 * Escape one concat-demuxer entry for its single-quoted file line. A quoted
 * string cannot contain `'`, so each apostrophe closes the quote, emits an
 * escaped quote, and reopens it (`'` becomes `'\''`), the grammar ffmpeg's
 * `av_get_token` parses.
 */
const escapeConcatEntry: (name: string) => string = (name: string): string =>
  name.replace(/'/g, "'\\''");

/**
 * Insert a `.<label>` tag before the output's extension, or append it when the
 * basename has none. The extension dot is searched only within the basename, so
 * a dotted directory such as `out.v2/render` tags the file, not the directory.
 */
const taggedOutput: (output: string, label: string) => string = (
  output: string,
  label: string,
): string => {
  const dot: number = output.lastIndexOf(".");
  const separator: number = Math.max(
    output.lastIndexOf("/"),
    output.lastIndexOf("\\"),
  );
  return dot <= separator
    ? `${output}.${label}`
    : `${output.slice(0, dot)}.${label}${output.slice(dot)}`;
};
