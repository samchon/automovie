import type {
  IAutoMovieProductionAudioProbe,
  IAutoMovieProductionDeliverable,
  IAutoMovieProductionMediaProbe,
  IAutoMovieProductionOpusDescription,
  IAutoMovieProductionPngPicture,
  IAutoMovieProductionVideoProbe,
  IAutoMovieProductionWebVttCue,
} from "@automovie/interface";
import type { Entry, Movie, Sample, Track, createFile } from "mp4box";
import { TextDecoder } from "node:util";

import { assertProductionOpusProfile } from "../delivery/assertProductionOpusProfile";
import { productionOpusDescription } from "../delivery/productionOpusDescription";
import { exactProductionClockProduct } from "./exactProductionClockProduct";
import { parseProductionMp4Output } from "./parseProductionMp4Output";
import { probeParsedProductionVideoMp4 } from "./probeParsedProductionVideoMp4";
import { probeProductionPngPicture } from "./probeProductionPngPicture";
import { probeVideoTrack } from "./probeVideoTrack";
import { sampleDescription } from "./sampleDescription";
import { verifySampleStorage } from "./verifySampleStorage";

/**
 * Parse one renderer-encoded deliverable's bytes by its declared kind and media type and report what they contain, instead of trusting manifest claims.
 *
 * A preview, and a guide pass or audio mix declared `image/png`, must be a PNG and reports `png` with the picture facts. Captions must be `text/vtt`, valid UTF-8 with a WebVTT header, and report `webvtt` with every timed cue in file order, skipping NOTE, STYLE and REGION blocks; `text` is the decoded text as delivered.
 *
 * A feature or another guide pass must be `video/mp4`: a guide pass reports `video` from a file whose only track is H.264, and a feature reports `feature` from exactly one H.264 track and one Opus track of exactly equal runtime whose audio passes the Opus delivery profile. Any other audio mix must be `audio/mp4` with exactly one track, an Opus track that passes the profile, and reports `audio`. The semantic-mask and sound-evidence sidecars are JSON and are probed by the production package.
 *
 * Every refusal is an `Error` naming the kind, the media type, the track counts, the WebVTT defect with its cue number, or the probe or profile field that failed; an audio profile refusal is prefixed with `Feature MP4` or `Audio-mix MP4`.
 *
 * @evidence contracts/common.md#principled-implementation Each format is read by its own grammar: PNG through the chunk walk and decoder, WebVTT through a strict UTF-8 decode, the header line, blank-line-separated blocks and the `HH:MM:SS.mmm --> HH:MM:SS.mmm` cue timing, and MP4 through the strict ISO gate and the parser's track tables; equal feature runtimes are proven by exact cross products of duration and timescale, and an audio runtime is the movie duration over the movie timescale, which the Opus profile also requires.
 * @evidence contracts/common.md#clear-and-simple-design This function owns the dispatch from deliverable kind to format and the WebVTT reading, while PNG facts, the video track reading, the strict parse, sample residency and the Opus profile are the shared helpers every other media path uses.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No kind is admitted under another media type, a cue is never reordered or repaired, the audio profile's message is only prefixed, and no file is special-cased.
 * @evidence contracts/common.md#meaningful-documentation The doc states what each kind and media type must contain and reports, how WebVTT blocks are read, what `text` holds, where the JSON sidecars are probed, and the form of every refusal.
 * @evidence contracts/performance.md#efficient-algorithms A PNG costs the chunk inspection and decode answered on `probeProductionPngPicture`; captions require O(L + C) work over L text characters and C cues. An MP4 is parsed once and shared by its track readings, which add O(M + S log(M + 1)) residency work per admitted track with S samples and M file-wide media boxes, plus box inspection and copying the returned lists. The MP4 arm therefore does not have a strict linear-time bound in its input bytes.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each deliverable is probed once from the bytes the caller read, and the result is the caller's to keep.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Parsed MP4 bytes and tables, decoded PNG pixels or decoded caption text coexist with their format-specific work until invocation-local references become collectable. Caption results retain their text and cue strings; media records copy track and description facts whose input-dependent lists are uncapped here. No file handle or task is opened, and return does not assert immediate garbage collection.
 */
export const probeProductionRenderedMedia: (props: {
    kind: IAutoMovieProductionDeliverable["kind"];
    mediaType: string;
    bytes: Uint8Array;
}) => Exclude<IAutoMovieProductionMediaProbe, {
    kind: "semantic-mask" | "sound-evidence";
}> = (props: {
  /** Deliverable kind the bytes were published as. */
  kind: IAutoMovieProductionDeliverable["kind"];

  /** Declared media type of the bytes. */
  mediaType: string;

  /** Complete deliverable bytes. */
  bytes: Uint8Array;
}): Exclude<
  IAutoMovieProductionMediaProbe,
  { kind: "semantic-mask" | "sound-evidence" }
> => {
  if (
    props.kind === "preview" ||
    ((props.kind === "guide-pass" || props.kind === "audio-mix") &&
      props.mediaType === "image/png")
  ) {
    if (props.mediaType !== "image/png")
      throw new Error(
        `${props.kind} output declares "${props.mediaType}", but this image requires image/png bytes.`,
      );
    const picture: IAutoMovieProductionPngPicture = probeProductionPngPicture(
      props.bytes,
    );
    return {
      kind: "png",
      width: picture.width,
      height: picture.height,
      picture,
    };
  }
  if (props.kind === "captions") {
    if (props.mediaType !== "text/vtt")
      throw new Error(
        `Caption output declares "${props.mediaType}", but caption deliverables require text/vtt bytes.`,
      );
    return probeWebVtt(props.bytes);
  }
  const parsed: { file: ReturnType<typeof createFile>; movie: Movie } =
    parseProductionMp4Output(props.bytes);
  const movie: Movie = parsed.movie;
  if (props.kind === "feature" || props.kind === "guide-pass") {
    if (props.mediaType !== "video/mp4")
      throw new Error(
        `${props.kind} output declares "${props.mediaType}", but encoded video deliverables require video/mp4 bytes.`,
      );
    if (props.kind === "guide-pass")
      return probeParsedProductionVideoMp4(props.bytes, parsed);
    if (movie.videoTracks.length !== 1)
      throw new Error(
        `MP4 contains ${movie.videoTracks.length} video tracks; exactly one is required.`,
      );
    if (movie.tracks.length !== 2)
      throw new Error(
        `feature MP4 contains ${movie.tracks.length} total tracks; exactly 2 are required.`,
      );
    if (movie.audioTracks.length !== 1)
      throw new Error(
        `Feature MP4 contains ${movie.audioTracks.length} audio tracks; exactly one is required.`,
      );
    const video: IAutoMovieProductionVideoProbe = probeVideoTrack(
      props.bytes,
      parsed.file,
      movie.videoTracks[0]!,
    );
    const audio: IAutoMovieProductionAudioProbe = probeAudioTrack(
      props.bytes,
      parsed.file,
      movie.audioTracks[0]!,
    );
    if (
      exactProductionClockProduct(
        video.presentation.movieDuration,
        audio.timebase.movieTimescale,
      ) !==
      exactProductionClockProduct(
        audio.timebase.movieDuration,
        video.presentation.movieTimescale,
      )
    )
      throw new Error(
        "Feature MP4 video and audio tracks do not have exactly equal runtimes.",
      );
    assertProductionAudioProfile(audio, "Feature MP4");
    return { kind: "feature", video, audio };
  }
  if (props.mediaType !== "audio/mp4")
    throw new Error(
      `Audio-mix output declares "${props.mediaType}", but the current deterministic probe requires audio/mp4 bytes.`,
    );
  if (movie.videoTracks.length !== 0)
    throw new Error(
      `Audio-mix MP4 contains ${movie.videoTracks.length} video tracks; none are allowed.`,
    );
  if (movie.audioTracks.length !== 1)
    throw new Error(
      `MP4 contains ${movie.audioTracks.length} audio tracks; exactly one is required.`,
    );
  if (movie.tracks.length !== 1)
    throw new Error(
      `Audio-mix MP4 contains ${movie.tracks.length} total tracks; exactly one is required.`,
    );
  const audio: IAutoMovieProductionAudioProbe = probeAudioTrack(
    props.bytes,
    parsed.file,
    movie.audioTracks[0]!,
  );
  assertProductionAudioProfile(audio, "Audio-mix MP4");
  return audio;
};

/** Read caption bytes as WebVTT, refusing every defect with the cue it names. */
const probeWebVtt: (bytes: Uint8Array) => Extract<IAutoMovieProductionMediaProbe, {
    kind: "webvtt";
}> = (
  bytes: Uint8Array,
): Extract<IAutoMovieProductionMediaProbe, { kind: "webvtt" }> => {
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new Error("Caption bytes are not valid UTF-8.");
  }
  if (/^\uFEFF?WEBVTT(?:[ \t][^\r\n]*)?(?:\r\n?|\n|$)/.test(text) === false)
    throw new Error("Caption bytes do not contain a valid WebVTT header.");
  const blocks: string[] = text
    .replace(/^\uFEFF/, "")
    .replace(/\r\n?|\n/g, "\n")
    .replace(/^([^\n]*\n)[ \t]+\n/u, "$1\n")
    .split(/\n{2,}/u)
    .slice(1);
  const cues: IAutoMovieProductionWebVttCue[] = [];
  for (const block of blocks) {
    if (block.trim().length === 0) continue;
    const lines: string[] = block.split("\n");
    const firstLine: string = lines[0]!;
    const timingIndex: number = firstLine.includes("-->")
      ? 0
      : lines[1]?.includes("-->")
        ? 1
        : -1;
    if (timingIndex < 0 && /^(?:NOTE|STYLE|REGION)(?:[ \t]|$)/.test(firstLine))
      continue;
    if (timingIndex < 0)
      throw new Error(
        `WebVTT block "${firstLine.trim()}" is neither a timed cue nor NOTE, STYLE, or REGION metadata. Remove the stray block or add its cue timing.`,
      );
    const timing: { start: number; end: number } = parseWebVttCue(
      lines[timingIndex]!,
    );
    const payload: string[] = lines.slice(timingIndex + 1);
    if (payload.some((line: string): boolean => line.includes("-->")))
      throw new Error(
        `WebVTT cue ${cues.length + 1} contains another timing line without a blank separator. Separate every cue block.`,
      );
    if (payload.some((line: string): boolean => line.trim().length > 0) === false)
      throw new Error(
        `WebVTT cue ${cues.length + 1} has no non-empty payload. Add observable caption text after its timing line.`,
      );
    cues.push({
      id: timingIndex === 1 ? firstLine : null,
      text: payload.join("\n"),
      startMilliseconds: timing.start,
      endMilliseconds: timing.end,
    });
  }
  if (cues.length === 0)
    throw new Error(
      "WebVTT captions contain no timed cue. Add at least one observable cue or do not declare this deliverable required.",
    );
  let lastEnd: number = 0;
  cues.forEach((cue: IAutoMovieProductionWebVttCue, index: number): void => {
    if (cue.startMilliseconds >= cue.endMilliseconds)
      throw new Error(
        `WebVTT cue ${index + 1} must end after it starts. Correct the cue timing.`,
      );
    if (index > 0 && cue.startMilliseconds < cues[index - 1]!.startMilliseconds)
      throw new Error(
        `WebVTT cue ${index + 1} starts before the preceding cue. Keep deterministic cue order.`,
      );
    lastEnd = Math.max(lastEnd, cue.endMilliseconds);
  });
  return {
    kind: "webvtt",
    cueCount: cues.length,
    firstCueSeconds: cues[0]!.startMilliseconds / 1_000,
    lastCueSeconds: lastEnd / 1_000,
    cues,
    text,
  };
};

/** Read one parsed Opus track into the audio probe record. */
const probeAudioTrack: (bytes: Uint8Array, file: ReturnType<typeof createFile>, track: Track) => IAutoMovieProductionAudioProbe = (
  bytes: Uint8Array,
  file: ReturnType<typeof createFile>,
  track: Track,
): IAutoMovieProductionAudioProbe => {
  const audio: Track["audio"] = track.audio;
  if (
    audio === undefined ||
    track.timescale <= 0 ||
    track.duration <= 0 ||
    track.codec.trim().length === 0
  )
    throw new Error(
      "MP4 audio track lacks codec, duration, or channel metadata.",
    );
  const samples: Sample[] = verifySampleStorage(bytes, file, track);
  const sampleEntry: IAutoMovieProductionOpusDescription =
    productionOpusDescription({
      boxes: sampleDescription(samples[0]!).boxes,
      codec: track.codec,
      trackChannels: audio.channel_count,
    });
  return {
    kind: "audio",
    container: "mp4",
    // mp4box reports the sample entry's four-character code as spelled in the
    // file ("Opus"); the probe reports codec identity case-insensitively, the
    // way the video probe reports "h264".
    codec: track.codec.toLowerCase(),
    runtimeSeconds: track.movie_duration / track.movie_timescale,
    channels: audio.channel_count,
    sampleRate: audio.sample_rate,
    sampleCount: samples.length,
    primingSamples: sampleEntry.preSkip,
    timebase: {
      movieTimescale: track.movie_timescale,
      mediaTimescale: track.timescale,
      movieDuration: track.movie_duration,
      mediaDuration: track.duration,
      edits: (track.edits ?? []).map((edit: Entry): IAutoMovieProductionAudioProbe["timebase"]["edits"][number] => ({
        segmentDuration: edit.segment_duration,
        mediaTime: edit.media_time,
        mediaRateInteger: edit.media_rate_integer,
        mediaRateFraction: edit.media_rate_fraction,
      })),
    },
    sampleEntry,
  };
};

/** Run the Opus profile, prefixing its refusal with the container's label. */
const assertProductionAudioProfile: (audio: IAutoMovieProductionAudioProbe, label: string) => void = (
  audio: IAutoMovieProductionAudioProbe,
  label: string,
): void => {
  try {
    assertProductionOpusProfile(audio);
  } catch (error) {
    throw new Error(
      `${label} ${error instanceof Error ? error.message : String(error)}`,
    );
  }
};

/** The start and end, in milliseconds, of one `start --> end [settings]` cue timing line. */
const parseWebVttCue: (line: string) => {
    start: number;
    end: number;
} = (line: string): { start: number; end: number } => {
  const delimiterCount: number = line.split("-->").length - 1;
  const match: RegExpExecArray | null =
    delimiterCount === 1
      ? /^[ \t]*((?:\d{2,}:)?[0-5]\d:[0-5]\d\.\d{3})[ \t]+-->[ \t]+((?:\d{2,}:)?[0-5]\d:[0-5]\d\.\d{3})(?:[ \t]+[^\r\n]*)?$/.exec(
          line,
        )
      : null;
  if (match === null)
    throw new Error(
      `WebVTT cue timing "${line.trim()}" is malformed. Use HH:MM:SS.mmm --> HH:MM:SS.mmm.`,
    );
  return {
    start: webVttTimestampMilliseconds(match[1]!),
    end: webVttTimestampMilliseconds(match[2]!),
  };
};

/** Milliseconds of a WebVTT timestamp the cue-timing pattern already admitted. */
const webVttTimestampMilliseconds: (value: string) => number = (value: string): number => {
  const match: RegExpExecArray = /^(?:(\d{2,}):)?([0-5]\d):([0-5]\d)\.(\d{3})$/u.exec(
    value,
  )!;
  const hours: number = match[1] === undefined ? 0 : Number(match[1]);
  return (
    ((hours * 60 + Number(match[2])) * 60 + Number(match[3])) * 1_000 +
    Number(match[4])
  );
};
