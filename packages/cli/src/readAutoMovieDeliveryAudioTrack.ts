import * as fs from "node:fs/promises";

import type { IAutoMovieDeliveryAudioTrack } from "./IAutoMovieDeliveryAudioTrack";

/** Largest movie header read into memory; a sample table beyond it is refused. */
const MAXIMUM_MOVIE_BOX = 64 * 1024 * 1024;

/**
 * Reads how much of an audio track an MP4 file presents, from the container's
 * own sample table and edit list.
 *
 * An AAC decoder returns whole 1024-sample frames, so the final decoded frame
 * can run past the soundtrack. The container records where presentation ends:
 * the sample table gives the exact media end, with a shortened last sample, and
 * the edit list gives the encoder priming skipped at the start. The edit's
 * duration is stored in the coarser movie clock, so an edit ending within one
 * movie tick of the media end is that end rounded (2133.33 ms is written as
 * 2133 ms). Only an edit ending a whole movie tick or more earlier trims the
 * track. The presented duration is that end less the skipped priming.
 *
 * @param path The delivery file whose bytes are audited.
 * @param streamIndex FFmpeg's input stream index, which counts the file's
 *   tracks in order.
 * @returns The presented duration in the track's media clock, or why it is
 *   unknown.
 */
export async function readAutoMovieDeliveryAudioTrack(
  path: string,
  streamIndex: number,
): Promise<IAutoMovieDeliveryAudioTrack> {
  try {
    const movie = await readMovieBox(path);
    return movie === undefined
      ? { status: "uncovered", reason: "The delivery has no MP4 movie box" }
      : presentation(movie, streamIndex);
  } catch (error) {
    return {
      status: "uncovered",
      reason:
        "The delivery's MP4 audio timing could not be read: " +
        (error instanceof Error ? error.message : String(error)),
    };
  }
}

/** Finds the top-level movie box by its headers and reads its payload. */
async function readMovieBox(path: string): Promise<Buffer | undefined> {
  const handle = await fs.open(path, "r");
  try {
    const { size } = await handle.stat();
    const header = Buffer.alloc(16);
    for (let offset = 0; offset + 8 <= size; ) {
      const read = Math.min(16, size - offset);
      await readExactly(handle, header, read, offset);
      const box = boxHeader(header.subarray(0, read), size - offset);
      if (box.type === "moov") {
        const length = box.end - box.start;
        if (length > MAXIMUM_MOVIE_BOX)
          throw new Error("the movie box exceeds 64 MiB");
        const payload = Buffer.alloc(length);
        await readExactly(handle, payload, length, offset + box.start);
        return payload;
      }
      offset += box.end;
    }
    return undefined;
  } finally {
    await handle.close();
  }
}

/** Fills the buffer from a position, refusing a short file. */
async function readExactly(
  handle: fs.FileHandle,
  buffer: Buffer,
  length: number,
  position: number,
): Promise<void> {
  for (let filled = 0; filled < length; ) {
    const { bytesRead } = await handle.read(
      buffer,
      filled,
      length - filled,
      position + filled,
    );
    if (bytesRead === 0) throw new Error("the file ended inside a box");
    filled += bytesRead;
  }
}

/** One box's type and payload range, relative to its own first byte. */
interface IBox {
  type: string;
  start: number;
  end: number;
}

/** Decodes a box header given the bytes available after its first byte. */
function boxHeader(bytes: Buffer, available: number): IBox {
  if (bytes.length < 8) throw new Error("a box header is truncated");
  const type = bytes.toString("latin1", 4, 8);
  let length = bytes.readUInt32BE(0);
  let start = 8;
  if (length === 1) {
    if (bytes.length < 16) throw new Error("a large box header is truncated");
    const large = bytes.readBigUInt64BE(8);
    if (large > BigInt(Number.MAX_SAFE_INTEGER))
      throw new Error("a box is too large");
    length = Number(large);
    start = 16;
  } else if (length === 0) length = available;
  if (length < start || length > available)
    throw new Error("the " + type + " box overruns its parent");
  return { type, start, end: length };
}

/** Lists the child boxes inside a payload range. */
function children(buffer: Buffer, start: number, end: number): IBox[] {
  const boxes: IBox[] = [];
  for (let offset = start; offset < end; ) {
    const box = boxHeader(
      buffer.subarray(offset, Math.min(end, offset + 16)),
      end - offset,
    );
    boxes.push({
      type: box.type,
      start: offset + box.start,
      end: offset + box.end,
    });
    offset += box.end;
  }
  return boxes;
}

/** Selects the one child of a type, refusing absence or repetition. */
function only(
  buffer: Buffer,
  parent: IBox,
  type: string,
  optional: true,
): IBox | undefined;
function only(buffer: Buffer, parent: IBox, type: string): IBox;
function only(
  buffer: Buffer,
  parent: IBox,
  type: string,
  optional?: true,
): IBox | undefined {
  const found = children(buffer, parent.start, parent.end).filter(
    (box) => box.type === type,
  );
  if (found.length > 1) throw new Error("repeated " + type + " box");
  if (found[0] === undefined && optional !== true)
    throw new Error("missing " + type + " box");
  return found[0];
}

/** Reads a field, refusing one past the end of its box. */
function field(box: IBox, offset: number, bytes: number): number {
  const at = box.start + offset;
  if (at + bytes > box.end)
    throw new Error("the " + box.type + " box is short");
  return at;
}

/** Reads the clock of a movie or media header, version zero or one. */
function timescale(buffer: Buffer, box: IBox): bigint {
  const version = buffer[field(box, 0, 1)];
  const value = BigInt(
    buffer.readUInt32BE(field(box, version === 1 ? 20 : 12, 4)),
  );
  if (value === 0n) throw new Error("a zero " + box.type + " timescale");
  return value;
}

/** Combines the selected track's edit list and sample table. */
function presentation(
  movie: Buffer,
  streamIndex: number,
): IAutoMovieDeliveryAudioTrack {
  const root: IBox = { type: "moov", start: 0, end: movie.length };
  const movieClock = timescale(movie, only(movie, root, "mvhd"));
  const track = children(movie, root.start, root.end).filter(
    (box) => box.type === "trak",
  )[streamIndex];
  if (track === undefined)
    return { status: "uncovered", reason: "The audio track is not listed" };
  const media = only(movie, track, "mdia");
  const handler = only(movie, media, "hdlr");
  if (
    movie.toString("latin1", field(handler, 8, 4), handler.start + 12) !==
    "soun"
  )
    return { status: "uncovered", reason: "The selected track is not audio" };
  const mediaClock = timescale(movie, only(movie, media, "mdhd"));

  const table = only(
    movie,
    only(movie, only(movie, media, "minf"), "stbl"),
    "stts",
  );
  const entries = movie.readUInt32BE(field(table, 4, 4));
  let mediaEnd = 0n;
  for (let entry = 0; entry < entries; ++entry) {
    const at = field(table, 8 + entry * 8, 8);
    mediaEnd +=
      BigInt(movie.readUInt32BE(at)) * BigInt(movie.readUInt32BE(at + 4));
  }

  let skipped = 0n;
  let end = mediaEnd;
  const edits = only(movie, track, "edts", true);
  if (edits !== undefined) {
    const list = only(movie, edits, "elst");
    const version = movie[field(list, 0, 1)];
    const count = movie.readUInt32BE(field(list, 4, 4));
    const size = version === 1 ? 20 : 12;
    if (count !== 1)
      return {
        status: "uncovered",
        reason: "The audio track has other than one edit",
      };
    const at = field(list, 8, size);
    const segment =
      version === 1
        ? movie.readBigUInt64BE(at)
        : BigInt(movie.readUInt32BE(at));
    skipped =
      version === 1
        ? movie.readBigInt64BE(at + 8)
        : BigInt(movie.readInt32BE(at + 4));
    const rate = at + (version === 1 ? 16 : 8);
    if (
      skipped < 0n ||
      segment === 0n ||
      movie.readInt16BE(rate) !== 1 ||
      movie.readInt16BE(rate + 2) !== 0
    )
      return {
        status: "uncovered",
        reason: "The audio edit is empty, unbounded or not at unit rate",
      };
    // The segment is quantized to the movie clock. Within one movie tick of
    // the media end it is that end rounded; only a shorter edit trims.
    if ((mediaEnd - skipped) * movieClock - segment * mediaClock >= mediaClock)
      end =
        skipped + (segment * mediaClock * 2n + movieClock) / (movieClock * 2n);
  }
  const duration = end - skipped;
  if (
    duration <= 0n ||
    duration > BigInt(Number.MAX_SAFE_INTEGER) ||
    mediaClock > BigInt(Number.MAX_SAFE_INTEGER)
  )
    return {
      status: "uncovered",
      reason: "The audio track presents no safe positive duration",
    };
  return {
    status: "read",
    timescale: Number(mediaClock),
    duration: Number(duration),
  };
}
