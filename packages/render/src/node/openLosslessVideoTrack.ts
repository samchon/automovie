import type { createFile } from "mp4box";

import { residentMp4Box } from "./residentMp4Box";
import type { sampleDescription } from "./sampleDescription";

/**
 * Open a new in-memory MP4 with one empty video track that copied H.264 samples are appended to.
 *
 * The movie and media clocks both use `timescale`, and the declared duration is `frames * sampleDuration` ticks on that clock. The track reuses the source `description` boxes by reference, retaining their decoder configuration for copied samples. Throws `<label> duration exceeds the exact MP4 clock range.` when that duration is not a safe integer, before any file is created; individual ISO field representability remains the writer's responsibility rather than a consequence of JavaScript safe-integer admission.
 *
 * @evidence contracts/common.md#principled-implementation The duration is written as exact integer ticks after a safe-integer check, because an MP4 clock is an integer count and a rounded product would declare a runtime the samples do not have; the brands are the ISO base-media set every production video already carries.
 * @evidence contracts/common.md#clear-and-simple-design Chunk assembly, repaint conform, visual-lane conform and H.264 normalization open their output through this helper, so the container shape and safe-integer duration refusal live here once and each writer supplies its track name and source facts.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The function copies the caller's description, raster and language without substitution and refuses an unrepresentable duration instead of clamping it.
 * @evidence contracts/common.md#meaningful-documentation The doc states the clock both boxes use, how the duration is formed and in what unit, why the description is reused, and the refusal with its message.
 * @evidence contracts/performance.md#efficient-algorithms Cost is constant in the frame count: one multiplication, one box tree of fixed shape, and the description boxes attached by reference, since mp4box's `addTrack` adds them to the sample entry without copying.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call opens a distinct output file for one writer invocation, so no two calls produce interchangeable results.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned file object is the caller's and holds the track, the referenced source description boxes and every sample later appended to it until the caller drops it; it opens no OS handle or task.
 */
export const openLosslessVideoTrack: (props: { label: string; name: string; timescale: number; sampleDuration: number; frames: number; description: ReturnType<typeof sampleDescription>; width: number; height: number; language: string; }) => { file: ReturnType<typeof createFile>; track: number } = (props: {
  /** Subject of the clock-range refusal, such as `Assembled chunk video`. */
  label: string;

  /** Human-readable track name written into the handler box. */
  name: string;

  /** Media and movie timescale, in ticks per second. */
  timescale: number;

  /** Duration of every sample to be appended, in ticks. */
  sampleDuration: number;

  /** Number of samples the track will hold. */
  frames: number;

  /** Sample entry the appended samples were encoded under. */
  description: ReturnType<typeof sampleDescription>;

  /** Coded raster width in pixels. */
  width: number;

  /** Coded raster height in pixels. */
  height: number;

  /** ISO 639-2/T track language copied from the source track. */
  language: string;
}): { file: ReturnType<typeof createFile>; track: number } => {
  const duration: number = props.frames * props.sampleDuration;
  if (Number.isSafeInteger(duration) === false)
    throw new Error(
      `${props.label} duration exceeds the exact MP4 clock range.`,
    );
  const file: ReturnType<typeof createFile> = residentMp4Box().createFile();
  file.init({
    brands: ["isom", "iso2", "mp41"],
    timescale: props.timescale,
    duration,
  });
  const track: number = file.addTrack({
    type: props.description.type,
    hdlr: "vide",
    name: props.name,
    timescale: props.timescale,
    media_duration: duration,
    duration,
    width: props.width,
    height: props.height,
    language: props.language,
    description_boxes: props.description.boxes,
  });
  return { file, track };
};
