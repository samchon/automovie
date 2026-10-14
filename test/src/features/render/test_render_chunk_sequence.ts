import {
  IAutoMovieRenderSpec,
  IAutoMovieSequence,
  IAutoMovieShot,
} from "@automovie/interface";
import {
  IAutoMovieSequenceRenderFrame,
  planChunkedSequenceRender,
  planSequenceRender,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

import { namedFacts, nclose, throwsError } from "../internal/predicates";
import { filmEffectValuesClose } from "../internal/filmEffectValuesClose";

const shot: (id: string, duration: number) => IAutoMovieShot = (id: string, duration: number): IAutoMovieShot => ({
  id,
  name: null,
  scene: "scene-duel",
  camera: "cam-main",
  cameraMotion: null,
  performances: [],
  objectMotions: [],
  duration,
});

const SHOTS: IAutoMovieShot[] = [shot("shot:a", 2), shot("shot:b", 3)];

const SEQUENCE: IAutoMovieSequence = {
  id: "seq:duel",
  name: "duel",
  fps: 24,
  shots: [
    { shot: "shot:a", trim: { start: 0.5, duration: 1 }, transition: null },
    {
      shot: "shot:b",
      trim: { start: 1, duration: 2 },
      transition: { kind: "crossDissolve", duration: 0.5 },
    },
  ],
};

const SPEC: IAutoMovieRenderSpec = {
  target: SEQUENCE.id,
  frameFormat: { fps: 4, width: 640, height: 360 },
  toneMapping: "none",
  codec: "h264",
  pixelFormat: "yuv420p",
  crf: 20,
};

/** The whole plan is 10 frames (2.5 s @ fps 4), with a dissolve on frames 2-3. */
const sample: (frame: IAutoMovieSequenceRenderFrame) => Pick<IAutoMovieSequenceRenderFrame, "timeSeconds" | "shot" | "shotTimeSeconds" | "blend"> = (frame: IAutoMovieSequenceRenderFrame): Pick<IAutoMovieSequenceRenderFrame, "timeSeconds" | "shot" | "shotTimeSeconds" | "blend"> => ({
  timeSeconds: frame.timeSeconds,
  shot: frame.shot,
  shotTimeSeconds: frame.shotTimeSeconds,
  blend: frame.blend,
});

/**
 * A long sequence render is split into `chunkFrames`-sized, independently
 * renderable chunks so a host can capture each window separately. The planner
 * itself still retains every frame of the whole timeline.
 * The boundary is frame-atomic: each frame belongs to exactly one chunk, and
 * concatenating the chunks reproduces the whole render frame-for-frame.
 *
 * Scenarios:
 *
 * 1. A 10-frame plan at chunkFrames 3 splits into 4 contiguous chunks (3/3/3/1);
 *    frameEnd of each chunk equals the next chunk's frameStart (no
 *    gap/overlap).
 * 2. The chunks' frames, concatenated in order, reproduce the whole plan's frame
 *    samples exactly (count + per-frame time/shot/shotTimeSeconds/blend); only
 *    the chunk-local index/path differ.
 * 3. The dissolve straddles the chunk-1 boundary (frame 2 in chunk 0, frame 3 in
 *    chunk 1); each keeps its exact blend, and no frame is duplicated or
 *    dropped.
 * 4. Chunk frames are re-indexed 0-based with chunk-scoped paths; startSeconds /
 *    endSeconds are the chunk's global first/last frame times.
 * 5. A single chunk (chunkFrames >= frameCount) reproduces the whole plan's frame
 *    samples 1:1.
 * 6. The reassembly manifest lists the chunk outputs in order with concat args; an
 *    extension-less output path still gets a chunk tag. A directory-qualified
 *    output (the resident default) keeps the concat list beside the output and
 *    its lines as basenames (ffmpeg resolves list entries against the list
 *    file's directory), and a dotted directory never captures the chunk tag.
 * 7. A non-positive or non-integer chunkFrames rejects.
 *
 * @evidence contracts/testing.md#behavioral-verification Plans whole and chunked sequence schedules, asserting exact 3/3/3/1 partition/contiguity/counts, preserved time/shot/blend samples, local indices/paths, span times, ordered concat manifest and malformed chunk-size refusals. It observes capture/encoder instructions, not actual media reassembly or bounded host memory.
 * @evidence contracts/testing.md#independent-expectations Two trimmed seconds plus one second minus a half-second dissolve give 2.5 seconds at four fps, hence ten frames and literal index ranges. Path/concat/argument expectations are hand-authored; whole-versus-chunk sample/blend comparisons are preservation oracles whose independent timing arithmetic belongs to sequence planner tests.
 * @evidence contracts/testing.md#distinguishing-cases Retains all seven groups, including a dissolve crossing the chunk boundary, a single large chunk, one-frame tail, extensionless/nested/dotted-directory outputs and zero/fractional sizes. Guide-pass requests and concat escaping edge cases have separate tests.
 * @evidence contracts/testing.md#execution-ownership The named test_render_chunk_sequence owns all portable synchronous planning cases. Shared typed sample projection registers no hidden tests, writes no output files and starts no capture browser, native encoder or consumer.
 */
export function test_render_chunk_sequence(): void {
  const whole: ReturnType<typeof planSequenceRender> = planSequenceRender({
    sequence: SEQUENCE,
    shots: SHOTS,
    spec: SPEC,
  });
  TestValidator.equals("whole frame count", whole.frameCount, 10);

  const chunked: ReturnType<typeof planChunkedSequenceRender> = planChunkedSequenceRender({
    plan: whole,
    spec: SPEC,
    chunkFrames: 3,
  });

  // 1. contiguity
  TestValidator.equals("chunk count", chunked.chunkCount, 4);
  TestValidator.equals("frame count preserved", chunked.frameCount, 10);
  TestValidator.equals(
    "chunk frame ranges",
    chunked.chunks.map((c: typeof chunked.chunks[number]): [number, number, number] => [c.frameStart, c.frameEnd, c.frameCount]),
    [
      [0, 3, 3],
      [3, 6, 3],
      [6, 9, 3],
      [9, 10, 1],
    ],
  );
  chunked.chunks.forEach((chunk: typeof chunked.chunks[number], i: number): void => {
    if (i > 0)
      TestValidator.equals(
        `chunk ${i} is contiguous`,
        chunk.frameStart,
        chunked.chunks[i - 1]!.frameEnd,
      );
  });

  // 2. union == whole (sample identity)
  const union: IAutoMovieSequenceRenderFrame[] = chunked.chunks.flatMap((c: typeof chunked.chunks[number]): IAutoMovieSequenceRenderFrame[] => c.frames);
  TestValidator.equals("union frame count == whole", union.length, 10);
  TestValidator.predicate(
    "union samples == whole samples",
    (): boolean => filmEffectValuesClose(union.map(sample), whole.frames.map(sample)),
  );

  // 3. straddling dissolve keeps blends, no dup/drop
  TestValidator.predicate(
    "dissolve start (frame 2) in chunk 0",
    (): boolean => filmEffectValuesClose(chunked.chunks[0]!.frames[2]!.blend, whole.frames[2]!.blend),
  );
  TestValidator.predicate(
    "mid dissolve (frame 3) in chunk 1",
    (): boolean => filmEffectValuesClose(chunked.chunks[1]!.frames[0]!.blend, whole.frames[3]!.blend),
  );

  // 4. re-index + chunk-scoped paths + span times
  TestValidator.equals(
    "chunk 1 local indices",
    chunked.chunks[1]!.frames.map((f: IAutoMovieSequenceRenderFrame): number => f.index),
    [0, 1, 2],
  );
  TestValidator.equals(
    "chunk 1 first path",
    chunked.chunks[1]!.frames[0]!.path,
    "frames/seq_duel/chunk_1/frame_00000.png",
  );
  TestValidator.equals(
    "chunk 1 output",
    chunked.chunks[1]!.outputPath,
    "seq_duel.chunk_1.mp4",
  );
  TestValidator.predicate(
    "chunk 1 span",
    (): boolean => nclose(chunked.chunks[1]!.startSeconds, whole.frames[3]!.timeSeconds, 1e-12) &&
      nclose(chunked.chunks[1]!.endSeconds, whole.frames[5]!.timeSeconds, 1e-12),
  );
  TestValidator.equals(
    "chunk ffmpeg args reference chunk paths",
    namedFacts([
      [
        "chunkedChunks1",
        (): boolean =>
          chunked.chunks[1]!.ffmpegArgs.includes(
            "frames/seq_duel/chunk_1/frame_%05d.png",
          ),
      ],
      [
        "chunkedChunks12",
        (): boolean => chunked.chunks[1]!.ffmpegArgs.includes("seq_duel.chunk_1.mp4"),
      ],
    ]),
    { chunkedChunks1: true, chunkedChunks12: true },
  );

  // 5. single chunk == whole samples
  const single: ReturnType<typeof planChunkedSequenceRender> = planChunkedSequenceRender({
    plan: whole,
    spec: SPEC,
    chunkFrames: 100,
  });
  TestValidator.equals("single chunk count", single.chunkCount, 1);
  TestValidator.predicate(
    "single chunk reproduces whole samples",
    (): boolean => filmEffectValuesClose(single.chunks[0]!.frames.map(sample), whole.frames.map(sample)),
  );

  // 6. reassembly order + extensionless output
  TestValidator.equals(
    "reassembly output",
    chunked.reassembly.outputPath,
    "seq_duel.mp4",
  );
  TestValidator.equals(
    "reassembly chunk outputs in order",
    chunked.reassembly.chunkOutputs,
    [
      "seq_duel.chunk_0.mp4",
      "seq_duel.chunk_1.mp4",
      "seq_duel.chunk_2.mp4",
      "seq_duel.chunk_3.mp4",
    ],
  );
  TestValidator.equals(
    "reassembly concat lines",
    chunked.reassembly.concatListLines[0],
    "file 'seq_duel.chunk_0.mp4'",
  );
  TestValidator.equals(
    "reassembly concat args are lossless",
    namedFacts([
      [
        "chunkedReassemblyFfmpegArgs",
        (): boolean => chunked.reassembly.ffmpegArgs.includes("concat"),
      ],
      [
        "chunkedReassemblyFfmpegArgs2",
        (): boolean => chunked.reassembly.ffmpegArgs.includes("copy"),
      ],
      [
        "chunkedReassemblyFfmpegArgs3",
        (): boolean => chunked.reassembly.ffmpegArgs.includes("seq_duel.mp4"),
      ],
    ]),
    {
      chunkedReassemblyFfmpegArgs: true,
      chunkedReassemblyFfmpegArgs2: true,
      chunkedReassemblyFfmpegArgs3: true,
    },
  );

  const noExt: ReturnType<typeof planChunkedSequenceRender> = planChunkedSequenceRender({
    plan: planSequenceRender({
      sequence: SEQUENCE,
      shots: SHOTS,
      spec: SPEC,
      outputPath: "out/render",
    }),
    spec: SPEC,
    chunkFrames: 6,
  });
  TestValidator.equals(
    "extensionless chunk output",
    noExt.chunks[0]!.outputPath,
    "out/render.chunk_0",
  );

  // 6b. a directory-qualified output (the resident default) keeps chunk videos
  // beside the list file and the concat lines relative to it: ffmpeg resolves
  // list entries against the list file's directory, so a path-qualified line
  // ("renders/seq.chunk_0.mp4") would double the directory.
  const nested: ReturnType<typeof planChunkedSequenceRender> = planChunkedSequenceRender({
    plan: planSequenceRender({
      sequence: SEQUENCE,
      shots: SHOTS,
      spec: SPEC,
      outputPath: "renders/seq_duel.mp4",
    }),
    spec: SPEC,
    chunkFrames: 6,
  });
  TestValidator.equals(
    "nested chunk outputs keep the directory",
    nested.reassembly.chunkOutputs,
    ["renders/seq_duel.chunk_0.mp4", "renders/seq_duel.chunk_1.mp4"],
  );
  TestValidator.equals(
    "nested concat list sits beside the output",
    nested.reassembly.concatListPath,
    "renders/seq_duel.mp4.concat.txt",
  );
  TestValidator.equals(
    "nested concat lines are basenames relative to the list",
    nested.reassembly.concatListLines,
    ["file 'seq_duel.chunk_0.mp4'", "file 'seq_duel.chunk_1.mp4'"],
  );

  // 6c. a dotted directory never captures the chunk tag
  const dottedDir: ReturnType<typeof planChunkedSequenceRender> = planChunkedSequenceRender({
    plan: planSequenceRender({
      sequence: SEQUENCE,
      shots: SHOTS,
      spec: SPEC,
      outputPath: "out.v2/render",
    }),
    spec: SPEC,
    chunkFrames: 6,
  });
  TestValidator.equals(
    "dotted directory keeps the tag on the file",
    dottedDir.chunks[0]!.outputPath,
    "out.v2/render.chunk_0",
  );

  // 7. guards
  TestValidator.predicate(
    "zero chunkFrames rejects",
    throwsError(
      (): ReturnType<typeof planChunkedSequenceRender> =>
        planChunkedSequenceRender({ plan: whole, spec: SPEC, chunkFrames: 0 }),
      ["chunkFrames", "positive integer"],
    ),
  );
  TestValidator.predicate(
    "fractional chunkFrames rejects",
    throwsError(
      (): ReturnType<typeof planChunkedSequenceRender> =>
        planChunkedSequenceRender({
          plan: whole,
          spec: SPEC,
          chunkFrames: 1.5,
        }),
      ["chunkFrames", "positive integer"],
    ),
  );
}
