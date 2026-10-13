import type { IAutoMovieProductionVideoProbe } from "@automovie/interface";
import type { Movie, Sample, Track, createFile } from "mp4box";

import type { IProductionRenditionClip } from "./IProductionRenditionClip";
import { neutralTrackPresentation } from "./neutralTrackPresentation";
import { parseProductionMp4Output } from "./parseProductionMp4Output";
import { probeParsedProductionVideoMp4 } from "./probeParsedProductionVideoMp4";
import { sameSampleDescription } from "./sameSampleDescription";
import { sampleDescription } from "./sampleDescription";

/**
 * Parse one H.264 MP4 clip that is to be spliced without decoding it: a
 * repaint shot, one range of a chunked render, or a visual-lane source.
 *
 * The bytes must pass the strict output gate and the single-video probe,
 * whose refusals propagate unlabelled. The clip must then start with a sync
 * sample, declare a track header raster equal to the probed raster, keep every
 * clock term a safe integer, give every sample one positive duration with
 * decode times `0, d, 2d, ...` and a media duration of exactly `count * d`,
 * code every sample under one sample entry, present the samples as a
 * permutation of whole frames from its earliest composition time, and present
 * that media untransformed (`neutralTrackPresentation`). Any of these failing
 * throws `<label> must start independently, use one decoder configuration,
 * and expose one complete untransformed rational-clock presentation.`, where
 * `label` names the clip so a multi-clip splice says which one failed.
 *
 * @evidence contracts/common.md#principled-implementation A lossless splice re-times samples by whole frames and copies their payloads, which is valid only when every sample is one frame on one clock, the first sample decodes alone, one decoder configuration covers the clip, and the presentation shows the media unedited; each condition is checked on the parser's own sample table, and the composition times must cover exactly the frame indices `0` to `count - 1` once each.
 * @evidence contracts/common.md#clear-and-simple-design Chunk assembly, rendition conform, visual-lane conform, the rendition plan and the clip delivery assertion all splice through this one admission, and the record it returns carries every fact they read.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No clip, timescale or frame rate is special-cased and no failing clip is repaired; the conditions are the ones lossless re-timing needs.
 * @evidence contracts/common.md#meaningful-documentation The doc names the clip kinds, the delegated refusals, every admission condition, the one labelled refusal and what `label` is for.
 * @evidence contracts/performance.md#efficient-algorithms For S samples the bytes are parsed once and that parse is shared with the probe, and one O(S) pass checks every per-sample condition, marking each presented frame index in a boolean array instead of sorting the composition times; comparing each sample's entry with the first one costs a pointer check because samples of one entry share its boxes.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call admits one clip handed to it, and the returned record is itself what the splice paths share.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned record keeps the caller's bytes, the probe, the parser's track and sample table, and through them the parse with its copy of the bytes, until the caller drops it; the frame-index array is released on return.
 */
export const parseProductionRenditionClip = (
  bytes: Uint8Array,
  label: string,
): IProductionRenditionClip => {
  const parsed: { file: ReturnType<typeof createFile>; movie: Movie } =
    parseProductionMp4Output(bytes);
  const probe: IAutoMovieProductionVideoProbe = probeParsedProductionVideoMp4(
    bytes,
    parsed,
  );
  // The probe proved exactly one video track with a resident, non-empty
  // sample table.
  const track: Track = parsed.movie.videoTracks[0]!;
  const samples: Sample[] = parsed.file.getTrackSamplesInfo(track.id) ?? [];
  const first: Sample = samples[0]!;
  const sampleDuration: number = first.duration;
  const description: ReturnType<typeof sampleDescription> =
    sampleDescription(first);
  const presentationStart: number = samples.reduce(
    (minimum: number, sample: Sample): number => Math.min(minimum, sample.cts),
    first.cts,
  );
  const presented: boolean[] = new Array<boolean>(samples.length).fill(false);
  const admissible: (sample: Sample, index: number) => boolean = (
    sample: Sample,
    index: number,
  ): boolean => {
    const frame: number = (sample.cts - presentationStart) / sampleDuration;
    if (
      Number.isSafeInteger(sample.dts) === false ||
      Number.isSafeInteger(sample.cts) === false ||
      sample.dts !== index * sampleDuration ||
      Number.isSafeInteger(frame) === false ||
      frame >= samples.length ||
      presented[frame] === true ||
      sameSampleDescription(description, sampleDescription(sample)) === false
    )
      return false;
    presented[frame] = true;
    return true;
  };
  if (
    first.is_sync !== true ||
    track.track_width !== probe.width ||
    track.track_height !== probe.height ||
    Number.isSafeInteger(track.timescale) === false ||
    Number.isSafeInteger(track.duration) === false ||
    Number.isSafeInteger(sampleDuration) === false ||
    sampleDuration <= 0 ||
    track.duration !== samples.length * sampleDuration ||
    samples.every(admissible) === false ||
    neutralTrackPresentation(track, presentationStart) === false
  )
    throw new Error(
      `${label} must start independently, use one decoder configuration, and expose one complete untransformed rational-clock presentation.`,
    );
  return {
    bytes,
    probe,
    track,
    samples,
    sampleDuration,
    decodeStart: first.dts,
    presentationStart,
  };
};
