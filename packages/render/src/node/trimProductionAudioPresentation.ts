import type { BoxParser, createFile } from "mp4box";

import { residentMp4Box } from "./residentMp4Box";

/**
 * Give one audio track of an in-memory MP4 a single edit that skips the Opus
 * encoder priming and stops after `presentationSamples`, leaving every coded
 * packet and its duration in place.
 *
 * The edit starts at media time `primingSamples` and lasts
 * `presentationSamples` media samples, converted exactly to movie ticks as
 * `presentationSamples * movieTimescale / mediaTimescale`. The track header
 * and the movie header both take that duration, so the caller must hold every
 * other track to the same runtime, as the feature mux does. Whether the edit
 * lies inside the coded samples is not checked here; the delivered-media probe
 * judges it.
 *
 * Throws `Audio presentation trim requires finite sample counts.` unless the
 * track id, both timescales and the presentation length are positive safe
 * integers and the priming is a non-negative safe integer, `Audio
 * presentation duration does not land on the movie timescale.` when the exact
 * movie duration is not an integer or not a safe one, `Audio presentation
 * trim requires an existing track.`, `Audio track already has an edit list.`,
 * and `Audio presentation trim requires a movie header.`, each before the file
 * is changed.
 *
 * @evidence contracts/common.md#principled-implementation An ISO edit list maps a movie-time segment onto media time, so one rate-1 edit at the priming offset is exactly RFC 7845's presentation of an Opus stream; the movie duration is computed as an exact BigInt product and remainder, because the floating-point product of two safe integers can round past 2^53 into an integer the exact value is not.
 * @evidence contracts/common.md#clear-and-simple-design The feature mux and the Opus test fixture both trim through this one function, which owns the edit and the two header durations it implies, while the mux owns the runtime proof.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The edit and its two boxes are mp4box's own `edts` and `elst` classes added through `addBox`, and a duration that does not land exactly is refused rather than rounded.
 * @evidence contracts/common.md#meaningful-documentation The doc states the edit's start, length and unit conversion, the header durations it sets and the obligation that puts on the caller, what is left unchecked, and every refusal with its message.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The function performs a fixed number of field checks, one BigInt division and two box insertions, choosing no algorithm or data structure.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The call mutates the caller's file once, and a second call is refused, so there is nothing to share.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The two new boxes and their one edit entry become part of the caller's file and live as long as it; nothing else is retained or opened.
 */
export const trimProductionAudioPresentation = (props: {
  /** In-memory MP4 under construction; it is changed in place. */
  file: ReturnType<typeof createFile>;

  /** Id of the audio track to edit. */
  track: number;

  /** Audio media timescale, in ticks per second. */
  mediaTimescale: number;

  /** Movie timescale, in ticks per second. */
  movieTimescale: number;

  /** Encoder priming to skip, in media samples. */
  primingSamples: number;

  /** Samples to present after the priming, in media samples. */
  presentationSamples: number;
}): void => {
  const positives: number[] = [
    props.track,
    props.mediaTimescale,
    props.movieTimescale,
    props.presentationSamples,
  ];
  if (
    positives.some(
      (value: number): boolean =>
        Number.isSafeInteger(value) === false || value <= 0,
    ) ||
    Number.isSafeInteger(props.primingSamples) === false ||
    props.primingSamples < 0
  )
    throw new Error("Audio presentation trim requires finite sample counts.");
  const movieTicks: bigint =
    BigInt(props.presentationSamples) * BigInt(props.movieTimescale);
  const segmentDuration: number = Number(
    movieTicks / BigInt(props.mediaTimescale),
  );
  if (
    movieTicks % BigInt(props.mediaTimescale) !== 0n ||
    Number.isSafeInteger(segmentDuration) === false
  )
    throw new Error(
      "Audio presentation duration does not land on the movie timescale.",
    );
  const track: InstanceType<typeof BoxParser.box.trak> | undefined =
    props.file.getTrackById(props.track);
  if (track === undefined)
    throw new Error("Audio presentation trim requires an existing track.");
  if (track.edts !== undefined)
    throw new Error("Audio track already has an edit list.");
  const movieHeader: InstanceType<typeof BoxParser.box.mvhd> | undefined =
    props.file.getBox("mvhd");
  if (movieHeader === undefined)
    throw new Error("Audio presentation trim requires a movie header.");
  const boxes: typeof BoxParser = residentMp4Box().BoxParser;
  const edit: InstanceType<typeof BoxParser.box.edts> = track.addBox(
    new boxes.box.edts(),
  );
  const list: InstanceType<typeof BoxParser.box.elst> = edit.addBox(
    new boxes.box.elst(),
  );
  list.entries = [
    {
      segment_duration: segmentDuration,
      media_time: props.primingSamples,
      media_rate_integer: 1,
      media_rate_fraction: 0,
    },
  ];
  track.tkhd.duration = segmentDuration;
  movieHeader.duration = segmentDuration;
};
