/**
 * The bytes of a minimal MP4 movie box: a video track, then an audio track with
 * an optional single edit and a run-length sample table. It has no media data,
 * so a test can pair it with a scripted decoder log.
 *
 * @evidence contracts/development/testing.md#behavioral-verification The delivery CLI reads these boxes from a real file exactly as it reads an encoder's output.
 * @evidence contracts/development/testing.md#independent-expectations Box layouts follow ISO/IEC 14496-12 version 0 fields, and every duration is the caller's literal.
 * @evidence contracts/development/testing.md#distinguishing-cases The caller chooses the clocks, the priming edit and a shortened final sample, which separate codec padding from a real duration error.
 * @evidence contracts/development/testing.md#execution-ownership Pure byte construction; the caller owns the file it writes.
 */
export function writeDeliveryMp4Header(props: {
  /** Movie header clock, which the edit's segment duration uses. */
  movieTimescale: number;
  /** Audio media clock, equal to its sample rate. */
  timescale: number;
  /** Sample table runs as [sample count, duration in media ticks]. */
  samples: readonly (readonly [count: number, delta: number])[];
  /** The single edit, or none for a track presented from its first sample. */
  edit?: { segment: number; mediaTime: number };
}): Buffer {
  const track = (handler: string, clock: number, edits: Buffer[]): Buffer =>
    box(
      "trak",
      ...edits,
      box(
        "mdia",
        box("mdhd", u32(0), u32(0), u32(0), u32(clock), u32(0), u32(0)),
        box(
          "hdlr",
          u32(0),
          u32(0),
          Buffer.from(handler, "latin1"),
          Buffer.alloc(13),
        ),
        box(
          "minf",
          box(
            "stbl",
            box(
              "stts",
              u32(0),
              u32(handler === "soun" ? props.samples.length : 1),
              ...(handler === "soun" ? props.samples : [[1, 1] as const]).map(
                ([count, delta]) => Buffer.concat([u32(count), u32(delta)]),
              ),
            ),
          ),
        ),
      ),
    );
  const edit = props.edit;
  return Buffer.concat([
    box("ftyp", Buffer.from("isom", "latin1"), u32(512)),
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
      track("vide", 1000, []),
      track(
        "soun",
        props.timescale,
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
            ],
      ),
    ),
    box("mdat"),
  ]);
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
  bytes.writeUInt32BE(value);
  return bytes;
}
