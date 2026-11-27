import type {
  IAutoMovieProductionAacDescription,
  IAutoMovieProductionAudioProbe,
  IAutoMovieProductionVideoProbe,
  IAutoMovieProductionVideoProfile,
} from "@automovie/interface";

import { AutoMovieMp4Boxes } from "./AutoMovieMp4Boxes";

/*
 * Read the picture and sound facts a delivery profile is checked against from
 * an MP4 file's own boxes, as ISO/IEC 14496-12 and 14496-14 lay them out.
 *
 * The video probe comes from the one `vide` track: `ftyp` brands; the `avc1`
 * sample entry's coded raster with its `pasp` and `colr` children; the track
 * header's 16.16 display raster and matrix; the movie, track and media clocks
 * and the edit list; and the sample timing from `stts` and `ctts`. A sample
 * table with more than one sample duration is reported with duration 0, which
 * the profile refuses as not constant. Composition times are decode times plus
 * the `ctts` offsets, and the first and last are their minimum and maximum.
 * `color.resolved` is `srgb` only when the `nclx` code points equal `srgb`, the
 * sRGB identity the caller passes from `render`, so the probe and the profile
 * read one definition.
 *
 * The audio probe comes from the one `soun` track, or is `null` when the file
 * has none: the `mp4a` sample entry's channel count and rate, the `esds`
 * AudioSpecificConfig's object type, rate and channel configuration, the clocks
 * and the edit list, with the priming samples taken as a single edit's media
 * time.
 * ://www.iso.org/standard/85596.html
 * ://www.iso.org/standard/79110.html
 *
 * It throws naming the box when the file has no movie box, no video track, a
 * second track of one kind, a video track that is not `avc1` or a malformed or
 * truncated box.
 * Parameter path: The encoded delivery file; only its headers are read.
 * Parameter srgb: The H.273 code points that spell sRGB
 * (`AutoMovieRenderMp4SrgbColour`).
 * Returns: The video facts and the audio facts or `null`.
 * @see https://www.iso.org/standard/85596.html
 * @see https://www.iso.org/standard/79110.html
 */
export async function readDeliveryProbe(
  path: string,
  srgb: Readonly<IAutoMovieProductionVideoProfile["color"]>,
): Promise<{
  video: IAutoMovieProductionVideoProbe;
  audio: IAutoMovieProductionAudioProbe | null;
}> {
  const { fileType, movie }: AutoMovieMp4Boxes.IFile =
    await AutoMovieMp4Boxes.read(path);
  if (movie === undefined) throw new Error("the file has no moov box");
  const root: AutoMovieMp4Boxes.IBox = {
    type: "moov",
    start: 0,
    end: movie.length,
  };
  const movieTimescale: number = clock(
    movie,
    only(movie, root, "mvhd"),
  ).timescale;
  const tracks: AutoMovieMp4Boxes.IBox[] = children(
    movie,
    0,
    movie.length,
  ).filter((box: AutoMovieMp4Boxes.IBox): boolean => box.type === "trak");
  const byHandler: (kind: string) => AutoMovieMp4Boxes.IBox[] = (
    kind: string,
  ): AutoMovieMp4Boxes.IBox[] =>
    tracks.filter(
      (track: AutoMovieMp4Boxes.IBox): boolean =>
        handler(movie, track) === kind,
    );
  const video: AutoMovieMp4Boxes.IBox[] = byHandler("vide");
  const audio: AutoMovieMp4Boxes.IBox[] = byHandler("soun");
  if (video.length !== 1)
    throw new Error(`the file has ${video.length} video tracks, not one`);
  if (audio.length > 1)
    throw new Error(`the file has ${audio.length} audio tracks, not one`);
  return {
    video: readVideo(movie, video[0]!, movieTimescale, fileType, srgb),
    audio:
      audio[0] === undefined
        ? null
        : readAudio(movie, audio[0], movieTimescale),
  };
}

/*
 * The box readers the probe walks the movie box with.
 */
const {
  children,
  clock,
  edits,
  field,
  handler,
  only,
}: typeof AutoMovieMp4Boxes = AutoMovieMp4Boxes;

/*
 * MPEG-4 audio sampling-frequency table, by `samplingFrequencyIndex` (ISO/IEC
 * 14496-3 Table 1.18).
 * ://www.iso.org/standard/76383.html
 * @see https://www.iso.org/standard/76383.html
 */
const AAC_SAMPLE_RATES: readonly number[] = [
  96_000, 88_200, 64_000, 48_000, 44_100, 32_000, 24_000, 22_050, 16_000,
  12_000, 11_025, 8_000, 7_350,
];

/*
 * The clocks and edit list every track shares.
 */
interface ITrackClock {
  /*
   * Track presentation duration in movie ticks (`tkhd`).
   */
  movieDuration: number;

  /*
   * Media ticks per second (`mdhd`).
   */
  mediaTimescale: number;

  /*
   * Encoded duration in media ticks (`mdhd`).
   */
  mediaDuration: number;

  /*
   * The track's edits.
   */
  edits: IAutoMovieProductionVideoProbe["presentation"]["edits"];

  /*
   * The `stbl` box.
   */
  table: AutoMovieMp4Boxes.IBox;

  /*
   * The first sample entry in `stsd`.
   */
  entry: AutoMovieMp4Boxes.IBox;
}

/*
 * Read a track's header, media header, edit list and sample description.
 */
function trackClock(movie: Buffer, track: AutoMovieMp4Boxes.IBox): ITrackClock {
  const media: AutoMovieMp4Boxes.IBox = only(movie, track, "mdia");
  const mediaHeader: { timescale: number; duration: bigint } = clock(
    movie,
    only(movie, media, "mdhd"),
  );
  const table: AutoMovieMp4Boxes.IBox = only(
    movie,
    only(movie, media, "minf"),
    "stbl",
  );
  const description: AutoMovieMp4Boxes.IBox = only(movie, table, "stsd");

  // `stsd` is a full box with an entry count before its sample entries.
  const entry: AutoMovieMp4Boxes.IBox | undefined = children(
    movie,
    field(description, 8, 0),
    description.end,
  )[0];
  if (entry === undefined) throw new Error("the stsd box has no sample entry");
  return {
    movieDuration: safe(clock(movie, only(movie, track, "tkhd")).duration),
    mediaTimescale: mediaHeader.timescale,
    mediaDuration: safe(mediaHeader.duration),
    edits: edits(movie, track).map(
      (
        edit: AutoMovieMp4Boxes.IEdit,
      ): IAutoMovieProductionVideoProbe["presentation"]["edits"][number] => ({
        segmentDuration: safe(edit.segmentDuration),
        mediaTime: safe(edit.mediaTime),
        mediaRateInteger: edit.mediaRateInteger,
        mediaRateFraction: edit.mediaRateFraction,
      }),
    ),
    table,
    entry,
  };
}

/*
 * Read the video probe from the one video track.
 */
function readVideo(
  movie: Buffer,
  track: AutoMovieMp4Boxes.IBox,
  movieTimescale: number,
  fileType: Buffer | undefined,
  srgb: Readonly<IAutoMovieProductionVideoProfile["color"]>,
): IAutoMovieProductionVideoProbe {
  const timing: ITrackClock = trackClock(movie, track);
  const entry: AutoMovieMp4Boxes.IBox = timing.entry;
  if (entry.type !== "avc1")
    throw new Error(`the video sample entry is ${entry.type}, not avc1`);

  // VisualSampleEntry: 8 bytes of SampleEntry, 16 of reserved and
  // pre-defined fields, then the 16-bit coded width and height; its child
  // boxes start after the fixed 78 bytes.
  const width: number = movie.readUInt16BE(field(entry, 24, 2));
  const height: number = movie.readUInt16BE(field(entry, 26, 2));
  const extensions: AutoMovieMp4Boxes.IBox = {
    type: entry.type,
    start: field(entry, 78, 0),
    end: entry.end,
  };
  const aspect: AutoMovieMp4Boxes.IBox | undefined = only(
    movie,
    extensions,
    "pasp",
    true,
  );
  const colour: AutoMovieMp4Boxes.IBox | undefined = children(
    movie,
    extensions.start,
    extensions.end,
  ).find(
    (box: AutoMovieMp4Boxes.IBox): boolean =>
      box.type === "colr" &&
      movie.toString("latin1", field(box, 0, 4), box.start + 4) === "nclx",
  );

  // tkhd: the matrix follows the duration, two reserved words, layer,
  // alternate group, volume and a reserved half-word; width and height follow
  // the matrix as 16.16 values.
  const header: AutoMovieMp4Boxes.IBox = only(movie, track, "tkhd");
  const matrixAt: number = movie[field(header, 0, 1)] === 1 ? 52 : 40;
  const matrix: number[] = [];
  for (let k: number = 0; k < 9; k++)
    matrix.push(movie.readInt32BE(field(header, matrixAt + k * 4, 4)));

  const samples: ISampleTiming = sampleTiming(movie, timing.table);
  const container: IAutoMovieProductionVideoProbe["color"]["container"] =
    colour === undefined
      ? { kind: "absent" }
      : {
          kind: "nclx",
          primaries: movie.readUInt16BE(field(colour, 4, 2)),
          transfer: movie.readUInt16BE(field(colour, 6, 2)),
          matrix: movie.readUInt16BE(field(colour, 8, 2)),
          fullRange: (movie[field(colour, 10, 1)]! & 0x80) !== 0,
        };
  const brands: string[] = [];
  if (fileType !== undefined)
    for (let at: number = 8; at + 4 <= fileType.length; at += 4)
      brands.push(fileType.toString("latin1", at, at + 4));
  const divisor: number = gcd(timing.mediaTimescale, samples.duration);
  return {
    kind: "video",
    container: "mp4",
    codec: "h264",
    width,
    height,
    runtimeSeconds: timing.mediaDuration / timing.mediaTimescale,
    frameCount: samples.count,
    fps: samples.duration === 0 ? 0 : timing.mediaTimescale / samples.duration,
    frameRate: {
      numerator: timing.mediaTimescale / divisor,
      denominator: samples.duration / divisor,
    },
    brands: {
      major: fileType === undefined ? "" : fileType.toString("latin1", 0, 4),
      compatible: brands,
    },
    coded: { width, height },
    trackDisplay: {
      width16_16: movie.readUInt32BE(field(header, matrixAt + 36, 4)),
      height16_16: movie.readUInt32BE(field(header, matrixAt + 40, 4)),
    },
    trackMatrix: matrix as IAutoMovieProductionVideoProbe["trackMatrix"],
    pixelAspect:
      aspect === undefined
        ? { kind: "implicit-square" }
        : {
            kind: "explicit",
            hSpacing: movie.readUInt32BE(field(aspect, 0, 4)),
            vSpacing: movie.readUInt32BE(field(aspect, 4, 4)),
          },
    presentation: {
      movieTimescale,
      mediaTimescale: timing.mediaTimescale,
      movieDuration: timing.movieDuration,
      mediaDuration: timing.mediaDuration,
      edits: timing.edits,
    },
    samples: { ...samples, timescale: timing.mediaTimescale },
    color: {
      container,
      resolved:
        container.kind === "nclx" &&
        container.primaries === srgb.primaries &&
        container.transfer === srgb.transfer &&
        container.matrix === srgb.matrix &&
        container.fullRange === srgb.fullRange
          ? { kind: "srgb", source: "container" }
          : { kind: "absent" },
    },
  };
}

/*
 * A video track's sample count, constant duration and timestamp bounds.
 */
type ISampleTiming = Omit<
  IAutoMovieProductionVideoProbe["samples"],
  "timescale"
>;

/*
 * Read the decode times from `stts` and the composition offsets from `ctts`.
 */
function sampleTiming(
  movie: Buffer,
  table: AutoMovieMp4Boxes.IBox,
): ISampleTiming {
  const decode: AutoMovieMp4Boxes.IBox = only(movie, table, "stts");
  const runs: number = movie.readUInt32BE(field(decode, 4, 4));
  const deltas: number[] = [];
  let count: number = 0;
  let lastDts: number = 0;
  let time: number = 0;
  for (let run: number = 0; run < runs; run++) {
    const at: number = field(decode, 8 + run * 8, 8);
    const samples: number = movie.readUInt32BE(at);
    const delta: number = movie.readUInt32BE(at + 4);
    if (samples === 0) continue;
    deltas.push(delta);
    count += samples;
    lastDts = time + (samples - 1) * delta;
    time += samples * delta;
  }
  const constant: boolean = deltas.every(
    (delta: number): boolean => delta === deltas[0],
  );

  // Composition time is decode time plus the sample's offset; without `ctts`
  // every offset is zero.
  let firstCts: number = 0;
  let lastCts: number = lastDts;
  const composition: AutoMovieMp4Boxes.IBox | undefined = only(
    movie,
    table,
    "ctts",
    true,
  );
  if (composition !== undefined) {
    const signed: boolean = movie[field(composition, 0, 1)] === 1;
    const entries: number = movie.readUInt32BE(field(composition, 4, 4));
    const dts: number[] = decodeTimes(movie, decode, runs);
    firstCts = Infinity;
    lastCts = -Infinity;
    let sample: number = 0;
    for (let entry: number = 0; entry < entries; entry++) {
      const at: number = field(composition, 8 + entry * 8, 8);
      const repeat: number = movie.readUInt32BE(at);
      const offset: number = signed
        ? movie.readInt32BE(at + 4)
        : movie.readUInt32BE(at + 4);
      for (
        let k: number = 0;
        k < repeat && sample < dts.length;
        k++, sample++
      ) {
        firstCts = Math.min(firstCts, dts[sample]! + offset);
        lastCts = Math.max(lastCts, dts[sample]! + offset);
      }
    }
  }
  return {
    count,
    duration: constant && deltas.length > 0 ? deltas[0]! : 0,
    firstDts: 0,
    lastDts,
    firstCts,
    lastCts,
  };
}

/*
 * Every sample's decode time, from the `stts` runs.
 */
function decodeTimes(
  movie: Buffer,
  decode: AutoMovieMp4Boxes.IBox,
  runs: number,
): number[] {
  const times: number[] = [];
  let time: number = 0;
  for (let run: number = 0; run < runs; run++) {
    const at: number = field(decode, 8 + run * 8, 8);
    const samples: number = movie.readUInt32BE(at);
    const delta: number = movie.readUInt32BE(at + 4);
    for (let k: number = 0; k < samples; k++, time += delta) times.push(time);
  }
  return times;
}

/*
 * Read the audio probe from the one audio track.
 */
function readAudio(
  movie: Buffer,
  track: AutoMovieMp4Boxes.IBox,
  movieTimescale: number,
): IAutoMovieProductionAudioProbe {
  const timing: ITrackClock = trackClock(movie, track);
  const entry: AutoMovieMp4Boxes.IBox = timing.entry;

  // AudioSampleEntry: 8 bytes of SampleEntry, 8 reserved, then the channel
  // count, sample size, two reserved half-words and the 16.16 sample rate;
  // child boxes start after the fixed 28 bytes.
  const channels: number = movie.readUInt16BE(field(entry, 16, 2));
  const sampleRate: number = movie.readUInt32BE(field(entry, 24, 4)) >>> 16;
  const description: IAutoMovieProductionAacDescription =
    entry.type === "mp4a"
      ? aacDescription(
          movie,
          only(movie, { ...entry, start: field(entry, 28, 0) }, "esds"),
        )
      : {
          codec: entry.type,
          audioObjectType: 0,
          sampleRate: 0,
          channelCount: 0,
        };
  const decode: AutoMovieMp4Boxes.IBox = only(movie, timing.table, "stts");
  const runs: number = movie.readUInt32BE(field(decode, 4, 4));
  let sampleCount: number = 0;
  for (let run: number = 0; run < runs; run++)
    sampleCount += movie.readUInt32BE(field(decode, 8 + run * 8, 4));
  const edit:
    | IAutoMovieProductionAudioProbe["timebase"]["edits"][number]
    | undefined = timing.edits.length === 1 ? timing.edits[0] : undefined;
  return {
    kind: "audio",
    container: "mp4",
    codec:
      entry.type === "mp4a"
        ? `mp4a.40.${description.audioObjectType}`
        : entry.type,
    runtimeSeconds: timing.movieDuration / movieTimescale,
    channels,
    sampleRate,
    sampleCount,
    primingSamples: edit === undefined ? 0 : Math.max(0, edit.mediaTime),
    timebase: {
      movieTimescale,
      mediaTimescale: timing.mediaTimescale,
      movieDuration: timing.movieDuration,
      mediaDuration: timing.mediaDuration,
      edits: timing.edits,
    },
    sampleEntry: description,
  };
}

/*
 * Read the AudioSpecificConfig inside an `esds` box: the ES descriptor (tag 3),
 * decoder configuration (tag 4), and decoder-specific information (tag 5).
 * The first bits of the decoder-specific information give the audio object
 * type, sampling-frequency index, and channel configuration.
 * ://www.iso.org/standard/85595.html
 * ://www.iso.org/standard/76383.html
 * @see https://www.iso.org/standard/85595.html
 * @see https://www.iso.org/standard/76383.html
 */
function aacDescription(
  movie: Buffer,
  esds: AutoMovieMp4Boxes.IBox,
): IAutoMovieProductionAacDescription {
  let at: number = field(esds, 4, 0);
  const descriptor: (tag: number) => number = (tag: number): number => {
    if (movie[at] !== tag)
      throw new Error(`the esds box lacks descriptor tag ${tag}`);
    at++;

    // The size is written in up to four bytes of seven bits each.
    let size: number = 0;
    for (let k: number = 0; k < 4; k++) {
      const byte: number = movie[at++]!;
      size = (size << 7) | (byte & 0x7f);
      if ((byte & 0x80) === 0) break;
    }
    if (at + size > esds.end) throw new Error("the esds box is short");
    return size;
  };
  descriptor(3);
  const flags: number = movie[at + 2]!;
  at += 3;
  if ((flags & 0x80) !== 0) at += 2;
  if ((flags & 0x40) !== 0) at += 1 + movie[at]!;
  if ((flags & 0x20) !== 0) at += 2;
  descriptor(4);
  at += 13;
  const size: number = descriptor(5);

  // Read the config's leading fields bit by bit, within the descriptor.
  let bit: number = at * 8;
  const end: number = (at + size) * 8;
  const read: (count: number) => number = (count: number): number => {
    if (bit + count > end) throw new Error("the AudioSpecificConfig is short");
    let value: number = 0;
    for (let k: number = 0; k < count; k++, bit++)
      value = value * 2 + ((movie[bit >>> 3]! >>> (7 - (bit & 7))) & 1);
    return value;
  };
  let audioObjectType: number = read(5);
  if (audioObjectType === 31) audioObjectType = 32 + read(6);
  const index: number = read(4);
  const sampleRate: number =
    index === 15 ? read(24) : (AAC_SAMPLE_RATES[index] ?? 0);
  const channelCount: number = read(4);
  return { codec: "mp4a", audioObjectType, sampleRate, channelCount };
}
/*
 * Euclid's greatest common divisor of two non-negative integers.
 */
function gcd(a: number, b: number): number {
  return b === 0 ? Math.max(a, 1) : gcd(b, a % b);
}

/*
 * A 64-bit box value as a number, refusing one beyond the safe integers.
 */
function safe(value: bigint): number {
  if (
    value > BigInt(Number.MAX_SAFE_INTEGER) ||
    value < BigInt(Number.MIN_SAFE_INTEGER)
  )
    throw new Error("a box value exceeds the safe integers");
  return Number(value);
}
