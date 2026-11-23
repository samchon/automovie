/**
 * The bytes of a minimal MP4 file: a file-type box, then a movie box with a
 * video track and an optional audio track, each with an optional single edit
 * and a run-length sample table. It has no media data, so a test can pair it
 * with a scripted decoder log or read its boxes with the delivery probe.
 *
 * Without `video`, the video track holds only a handler and a one-sample table,
 * as the audio timing tests need. With it, the track carries what a delivery
 * probe reads: a track header with display size and matrix, a media header, an
 * `avc1` sample entry with optional `pasp` and `colr` children, decode times
 * and optional composition offsets. Without `samples`, the file has no audio
 * track. With `aac`, the audio track has an `mp4a` sample entry whose `esds`
 * AudioSpecificConfig declares the given object type, rate and channels.
 *
 * @evidence contracts/development/testing.md#behavioral-verification The delivery CLI reads these boxes from a real file exactly as it reads an encoder's output.
 * @evidence contracts/development/testing.md#independent-expectations Box layouts follow ISO/IEC 14496-12 version 0 fields and ISO/IEC 14496-1 and 14496-3 for `esds`; every value is the caller's literal.
 * @evidence contracts/development/testing.md#distinguishing-cases The caller chooses the clocks, the edits, the colour box, the matrix, the composition offsets and the audio configuration, which separate conforming files from each refused field.
 * @evidence contracts/development/testing.md#execution-ownership Pure byte construction; the caller owns the file it writes.
 */
export function writeDeliveryMp4Header(props: {
  /** Movie header clock, which the edits' segment durations use. */
  movieTimescale: number;
  /** Audio media clock, equal to its sample rate. */
  timescale?: number;
  /**
   * Audio sample table runs as [sample count, duration in media ticks]; absent,
   * no audio track.
   */
  samples?: readonly (readonly [count: number, delta: number])[];
  /**
   * The audio track's single edit, or none for a track presented from its first
   * sample.
   */
  edit?: { segment: number; mediaTime: number };
  /**
   * The audio sample entry's AAC configuration; absent, a bare entry-less
   * table.
   */
  aac?: { objectType: number; sampleRate: number; channels: number };
  /**
   * The video track's delivery facts; absent, a handler and a one-sample table
   * only.
   */
  video?: {
    /** Media clock. */
    timescale: number;
    /** Sample count. */
    frames: number;
    /** Sample duration in media ticks. */
    delta: number;
    /** Track duration in movie ticks. */
    movieDuration: number;
    /** Coded and display raster. */
    width: number;
    height: number;
    /** Track matrix; absent, the unity matrix. */
    matrix?: readonly number[];
    /** `nclx` code points; absent, no `colr` box. */
    colour?: {
      primaries: number;
      transfer: number;
      matrix: number;
      fullRange: boolean;
    };
    /** Pixel aspect spacing; absent, no `pasp` box. */
    aspect?: readonly [number, number];
    /** The single edit, or none. */
    edit?: { segment: number; mediaTime: number };
    /** One composition offset per sample; absent, no `ctts` box. */
    offsets?: readonly number[];
  };
}): Buffer {
  const edits = (edit?: { segment: number; mediaTime: number }): Buffer[] =>
    edit === undefined
      ? []
      : [
          box(
            "edts",
            box(
              "elst",
              u32(0),
              u32(1),
              u32(edit.segment),
              u32(edit.mediaTime),
              Buffer.from([0, 1, 0, 0]),
            ),
          ),
        ];
  const handler = (type: string): Buffer =>
    box("hdlr", u32(0), u32(0), Buffer.from(type, "latin1"), Buffer.alloc(13));
  const mediaHeader = (clock: number, duration: number): Buffer =>
    box("mdhd", u32(0), u32(0), u32(0), u32(clock), u32(duration), u32(0));
  const stts = (runs: readonly (readonly [number, number])[]): Buffer =>
    box(
      "stts",
      u32(0),
      u32(runs.length),
      ...runs.map(([count, delta]) => Buffer.concat([u32(count), u32(delta)])),
    );
  const trackHeader = (
    duration: number,
    matrix: readonly number[],
    width: number,
    height: number,
  ): Buffer =>
    box(
      "tkhd",
      u32(0),
      u32(0),
      u32(0),
      u32(1),
      u32(0),
      u32(duration),
      Buffer.alloc(8),
      Buffer.alloc(8),
      ...matrix.map((value) => i32(value)),
      u32(width * 65_536),
      u32(height * 65_536),
    );
  const unity: number[] = [65_536, 0, 0, 0, 65_536, 0, 0, 0, 1_073_741_824];

  const video = props.video;
  const videoTrack: Buffer =
    video === undefined
      ? box(
          "trak",
          box(
            "mdia",
            mediaHeader(1000, 0),
            handler("vide"),
            box("minf", box("stbl", stts([[1, 1]]))),
          ),
        )
      : box(
          "trak",
          trackHeader(
            video.movieDuration,
            video.matrix ?? unity,
            video.width,
            video.height,
          ),
          ...edits(video.edit),
          box(
            "mdia",
            mediaHeader(video.timescale, video.frames * video.delta),
            handler("vide"),
            box(
              "minf",
              box(
                "stbl",
                box(
                  "stsd",
                  u32(0),
                  u32(1),
                  box(
                    "avc1",
                    Buffer.alloc(24),
                    u16(video.width),
                    u16(video.height),
                    Buffer.alloc(50),
                    ...(video.aspect === undefined
                      ? []
                      : [
                          box(
                            "pasp",
                            u32(video.aspect[0]),
                            u32(video.aspect[1]),
                          ),
                        ]),
                    ...(video.colour === undefined
                      ? []
                      : [
                          box(
                            "colr",
                            Buffer.from("nclx", "latin1"),
                            u16(video.colour.primaries),
                            u16(video.colour.transfer),
                            u16(video.colour.matrix),
                            Buffer.from([video.colour.fullRange ? 0x80 : 0]),
                          ),
                        ]),
                  ),
                ),
                stts([[video.frames, video.delta]]),
                ...(video.offsets === undefined
                  ? []
                  : [
                      box(
                        "ctts",
                        u32(0),
                        u32(video.offsets.length),
                        ...video.offsets.map((offset) =>
                          Buffer.concat([u32(1), u32(offset)]),
                        ),
                      ),
                    ]),
              ),
            ),
          ),
        );

  const samples = props.samples;
  const aac = props.aac;
  const clock: number = props.timescale ?? 48_000;
  const mediaDuration: number = (samples ?? []).reduce(
    (sum, [count, delta]) => sum + count * delta,
    0,
  );
  const audioTrack: Buffer[] =
    samples === undefined
      ? []
      : [
          box(
            "trak",
            ...(aac === undefined
              ? []
              : [
                  trackHeader(
                    props.edit?.segment ??
                      Math.round(
                        (mediaDuration * props.movieTimescale) / clock,
                      ),
                    unity,
                    0,
                    0,
                  ),
                ]),
            ...edits(props.edit),
            box(
              "mdia",
              mediaHeader(clock, mediaDuration),
              handler("soun"),
              box(
                "minf",
                box(
                  "stbl",
                  ...(aac === undefined ? [] : [mp4a(aac)]),
                  stts(samples),
                ),
              ),
            ),
          ),
        ];
  return Buffer.concat([
    box(
      "ftyp",
      Buffer.from("isom", "latin1"),
      u32(512),
      Buffer.from("isomiso2avc1mp41", "latin1"),
    ),
    box(
      "moov",
      box(
        "mvhd",
        u32(0),
        u32(0),
        u32(0),
        u32(props.movieTimescale),
        Buffer.alloc(84),
      ),
      videoTrack,
      ...audioTrack,
    ),
    box("mdat"),
  ]);
}

/** An `stsd` with one `mp4a` sample entry and its `esds` AudioSpecificConfig. */
function mp4a(aac: {
  objectType: number;
  sampleRate: number;
  channels: number;
}): Buffer {
  const rates: number[] = [
    96_000, 88_200, 64_000, 48_000, 44_100, 32_000, 24_000, 22_050, 16_000,
    12_000, 11_025, 8_000, 7_350,
  ];

  // AudioSpecificConfig: 5 bits object type, 4 bits frequency index, 4 bits
  // channel configuration, padded to two bytes.
  const config: number =
    (aac.objectType << 11) |
    (rates.indexOf(aac.sampleRate) << 7) |
    (aac.channels << 3);
  const specific: Buffer = Buffer.concat([Buffer.from([5, 2]), u16(config)]);
  const decoder: Buffer = Buffer.concat([
    Buffer.from([4, 13 + specific.length, 0x40, 0x15]),
    Buffer.alloc(11),
    specific,
  ]);
  const es: Buffer = Buffer.concat([
    Buffer.from([3, 3 + decoder.length, 0, 1, 0]),
    decoder,
  ]);
  return box(
    "stsd",
    u32(0),
    u32(1),
    box(
      "mp4a",
      Buffer.alloc(8),
      Buffer.alloc(8),
      u16(aac.channels),
      u16(16),
      Buffer.alloc(4),
      u32(aac.sampleRate * 65_536),
      box("esds", u32(0), es),
    ),
  );
}

/** One box with a 32-bit size. */
function box(type: string, ...payload: Buffer[]): Buffer {
  const body: Buffer = Buffer.concat(payload);
  return Buffer.concat([
    u32(8 + body.length),
    Buffer.from(type, "latin1"),
    body,
  ]);
}

/** A big-endian unsigned 32-bit field. */
function u32(value: number): Buffer {
  const bytes: Buffer = Buffer.alloc(4);
  bytes.writeUInt32BE(value >>> 0);
  return bytes;
}

/** A big-endian signed 32-bit field. */
function i32(value: number): Buffer {
  const bytes: Buffer = Buffer.alloc(4);
  bytes.writeInt32BE(value);
  return bytes;
}

/** A big-endian unsigned 16-bit field. */
function u16(value: number): Buffer {
  const bytes: Buffer = Buffer.alloc(2);
  bytes.writeUInt16BE(value);
  return bytes;
}
