import type { createFile } from "mp4box";

import type { IProductionRenditionClip } from "./IProductionRenditionClip";
import { sampleBytes } from "./sampleBytes";
import { sampleOptions } from "./sampleOptions";

/**
 * Append every sample of one validated clip to an output video track,
 * re-timed onto the output clock with its payload and flags unchanged, and
 * return the next free output frame.
 *
 * Sample `s` of the clip is written with decode time
 * `(frame + (s.dts - decodeStart) / clip.sampleDuration) * sampleDuration` and
 * presentation time
 * `(frame + (s.cts - presentationStart) / clip.sampleDuration) * sampleDuration`,
 * so the clip occupies output frames `frame` through
 * `frame + samples.length - 1` while keeping its own decode order and
 * reordering offsets. `sampleDuration` is the output track's duration in its
 * own ticks and may differ from the clip's when the two clocks differ by a
 * whole factor. The caller must have proved the clip's description equal to
 * the track's and its first sample independently decodable when it follows a
 * different source.
 *
 * @evidence contracts/common.md#principled-implementation Re-timing works in whole frames, `(time - origin) / clip.sampleDuration`, which the clip parser proved to be integers, and both clocks are re-based on the clip's own origins: a range cut from the middle of a feature carries absolute decode times, and re-basing only the presentation side would put a presentation time before its decode time.
 * @evidence contracts/common.md#clear-and-simple-design One loop writes one clip; choosing and validating clips, opening the track and checking coverage stay with the three writers that call it, so all three share one re-timing rule.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Payload bytes and the dependency and redundancy flags are copied through `sampleOptions` as the source declares them, with only duration, decode and presentation time replaced, and no clip is special-cased.
 * @evidence contracts/common.md#meaningful-documentation The doc gives the exact decode and presentation time formulas, the output frame range, the meaning and unit of `sampleDuration`, and the decodability and description obligations left to the caller.
 * @evidence contracts/performance.md#efficient-algorithms Cost is linear in the clip's sample count with constant work per sample; the payload is passed as a `sampleBytes` view of the clip bytes because mp4box's `addSample` already copies it into the output's media box, so each byte is copied once.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call writes a different clip at a different output position into one caller-owned file, so no two calls perform equivalent work.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The output file keeps a copy of every payload in its media box and, through mp4box's sample records, a view of the clip bytes; both live until the caller drops the file, so the clip's bytes stay reachable for that long and no handle or task is opened.
 */
export const appendLosslessVideoClip = (props: {
  /** Output file whose track receives the samples. */
  file: ReturnType<typeof createFile>;

  /** Output track id returned by `addTrack`. */
  track: number;

  /** Validated clip whose samples are appended. */
  clip: IProductionRenditionClip;

  /** Output frame index the clip's first presented frame lands on. */
  frame: number;

  /** Output sample duration in the output track's ticks. */
  sampleDuration: number;
}): number => {
  const clip: IProductionRenditionClip = props.clip;
  for (const sample of clip.samples) {
    const dtsFrame: number =
      (sample.dts - clip.decodeStart) / clip.sampleDuration;
    const ctsFrame: number =
      (sample.cts - clip.presentationStart) / clip.sampleDuration;
    props.file.addSample(
      props.track,
      sampleBytes(clip.bytes, sample),
      {
        ...sampleOptions(sample),
        duration: props.sampleDuration,
        cts: (props.frame + ctsFrame) * props.sampleDuration,
        dts: (props.frame + dtsFrame) * props.sampleDuration,
      },
    );
  }
  return props.frame + clip.samples.length;
};
