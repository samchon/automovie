import type { IAutoMovieRenderSpec } from "@automovie/interface";

import { planAutoMovieVideoEncoding } from "../delivery/planAutoMovieVideoEncoding.js";
import { frameName } from "../frameName.js";
import { frameTimes } from "../frameTimes.js";
import { encodeAutoMovieRasterPng } from "../picture/encodeAutoMovieRasterPng.js";
import { hashAutoMovieRasterImage } from "../picture/hashAutoMovieRasterImage.js";
import type { IAutoMovieRasterImage } from "../picture/IAutoMovieRasterImage.js";
import type { AutoMovieDrawSession } from "./AutoMovieDrawSession.js";

/**
 * Render a drawn subject into one video: draw every frame of its clock through the draw page's function, write each as a PNG, then encode them once.
 *
 * The clock and raster are the subject's, read from the session, so the spec takes no frame format. The encoding is admitted and planned by `planAutoMovieVideoEncoding` before the first frame is drawn, so a clock that is not a whole number of frames or an odd raster costs no drawing. Frame `i` is drawn at `frameTimes`' second `i / fps` in the `beauty` pass through the subject's own camera, and written as `<frameDir>/frame_<i>.png`; frames are drawn and written one at a time, in order. The encoder then runs once with the planned arguments.
 *
 * Files and processes are the host's: `write` stores a file and `encode` runs FFmpeg, so the order of every step runs under a unit test. A draw, write or encode failure rejects at once and leaves the files written so far to the host.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States where the clock and raster come from, when the plan is admitted, how each frame is drawn, named and written, what the host supplies and what a failure leaves.
 * @evidence contracts/development/implementation.md#principled-implementation Every delivered frame comes from the same draw function inspection stills use, at the exact schedule `frameTimes` gives, and the encoder runs on the vector `planAutoMovieVideoEncoding` admits, so a delivered video and a still at the same second are drawn by the same code.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Plan, then one loop of draw, encode as PNG, hash and write, then one encode.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No frame is skipped or reused and no failure is retried.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in frames times pixels: one draw, one PNG encoding and one hash per frame.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each frame is drawn once; nothing is shared between renders.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One frame's picture and bytes are held at a time, plus one record per frame; the session stays the caller's.
 */
export async function renderAutoMovieDrawnVideo(props: {
  /** The opened draw session of the subject. */
  session: Pick<AutoMovieDrawSession, "subject" | "frame">;

  /** Encoding controls; the frame format is the subject's clock and raster. */
  spec: Omit<IAutoMovieRenderSpec, "frameFormat">;

  /** Folder the frame files are written into. */
  frameDir: string;

  /** The video file the encoder writes. */
  outputPath: string;

  /** A complete soundtrack to mux, or null for none. */
  audio: string | null;

  /** Store one file whole. */
  write: (path: string, data: Uint8Array) => Promise<void>;

  /** Run FFmpeg with the arguments, resolving once it succeeded. */
  encode: (args: readonly string[]) => Promise<void>;
}): Promise<{
  /** The subject's frames, in order, each with its second, file and pixel hash. */
  frames: { index: number; seconds: number; file: string; hash: string }[];

  /** The arguments the encoder ran with. */
  args: string[];
}> {
  const { subject } = props.session;
  const spec: IAutoMovieRenderSpec = {
    ...props.spec,
    frameFormat: { width: subject.width, height: subject.height, fps: subject.fps },
  };
  const plan: ReturnType<typeof planAutoMovieVideoEncoding> = planAutoMovieVideoEncoding({
    spec,
    durationSeconds: subject.durationSeconds,
    frameDir: props.frameDir,
    outputPath: props.outputPath,
    audio: props.audio,
  });

  // Every frame of the clock, drawn and written in order.
  const frames: { index: number; seconds: number; file: string; hash: string }[] = [];
  const times: number[] = frameTimes(subject.fps, subject.durationSeconds);
  for (const [index, seconds] of times.entries()) {
    const picture: IAutoMovieRasterImage = (await props.session.frame(seconds, ["beauty"]))[0]!.picture;
    const file: string = `${props.frameDir}/${frameName(index)}`;
    await props.write(file, await encodeAutoMovieRasterPng(picture));
    frames.push({ index, seconds, file, hash: hashAutoMovieRasterImage(picture) });
  }

  await props.encode(plan.args);
  return { frames, args: plan.args };
}
