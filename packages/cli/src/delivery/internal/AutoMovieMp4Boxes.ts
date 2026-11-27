import type { Stats } from "node:fs";
import * as fs from "node:fs/promises";

/**
 * Reading ISO/IEC 14496-12 (ISO base media) boxes from an MP4 file: the
 * top-level file-type and movie boxes, then child boxes and their fields inside
 * the movie box's bytes.
 * @see https://www.iso.org/standard/85596.html
 *
 * Every reader refuses, by throwing an `Error` that names the box, a header
 * that overruns its parent, a field past its box's end and, where one box is
 * required, its absence or repetition. Offsets are bytes within the buffer the
 * caller holds; nothing reads the media data.
 */
export namespace AutoMovieMp4Boxes {
  /** One box's type and payload range in its buffer. */
  export interface IBox {
    /** The four-character box type. */
    type: string;

    /** First payload byte, after the header. */
    start: number;

    /** One past the last payload byte. */
    end: number;
  }

  /** The two top-level boxes a delivery probe reads, as their payload bytes. */
  export interface IFile {
    /** The `ftyp` payload, or `undefined` when the file has none. */
    fileType: Buffer | undefined;

    /** The `moov` payload, or `undefined` when the file has none. */
    movie: Buffer | undefined;
  }

  /**
   * One `elst` entry: a presentation segment in movie ticks from a media time
   * in media ticks, at a 16.16 rate.
   */
  export interface IEdit {
    /** Segment length in movie ticks. */
    segmentDuration: bigint;

    /** Media start in media ticks; minus one is an empty edit. */
    mediaTime: bigint;

    /** Integer part of the rate. */
    mediaRateInteger: number;

    /** Fractional part of the rate. */
    mediaRateFraction: number;
  }

  /**
   * Largest top-level box read into memory; a sample table beyond it is
   * refused.
   */
  const MAXIMUM_BOX: number = 64 * 1024 * 1024;

  /**
   * Read the payloads of the top-level `ftyp` and `moov` boxes by walking the
   * box headers, never the media data.
   *
   * @param path The MP4 file.
   * @returns Each payload, or `undefined` when that box is absent.
   */
  export async function read(path: string): Promise<IFile> {
    const handle: fs.FileHandle = await fs.open(path, "r");
    try {
      const { size }: Stats = await handle.stat();
      const header: Buffer = Buffer.alloc(16);
      const found: IFile = { fileType: undefined, movie: undefined };
      for (let offset: number = 0; offset + 8 <= size; ) {
        const available: number = Math.min(16, size - offset);
        await readExactly(handle, header, available, offset);
        const box: IBox = boxHeader(
          header.subarray(0, available),
          size - offset,
        );
        if (box.type === "ftyp" || box.type === "moov") {
          const length: number = box.end - box.start;
          if (length > MAXIMUM_BOX)
            throw new Error("the " + box.type + " box exceeds 64 MiB");
          const payload: Buffer = Buffer.alloc(length);
          await readExactly(handle, payload, length, offset + box.start);
          if (box.type === "ftyp") found.fileType = payload;
          else found.movie = payload;
        }
        offset += box.end;
      }
      return found;
    } finally {
      await handle.close();
    }
  }

  /**
   * Decode one box header given the bytes available after its first byte: a
   * 32-bit size, a 64-bit size when the 32-bit one is 1, or the rest of the
   * parent when it is 0.
   */
  function boxHeader(bytes: Buffer, available: number): IBox {
    if (bytes.length < 8) throw new Error("a box header is truncated");
    const type: string = bytes.toString("latin1", 4, 8);
    let length: number = bytes.readUInt32BE(0);
    let start: number = 8;
    if (length === 1) {
      if (bytes.length < 16) throw new Error("a large box header is truncated");
      const large: bigint = bytes.readBigUInt64BE(8);
      if (large > BigInt(Number.MAX_SAFE_INTEGER))
        throw new Error("a box is too large");
      length = Number(large);
      start = 16;
    } else if (length === 0) length = available;
    if (length < start || length > available)
      throw new Error("the " + type + " box overruns its parent");
    return { type, start, end: length };
  }

  /** List the child boxes inside a payload range. */
  export function children(buffer: Buffer, start: number, end: number): IBox[] {
    const boxes: IBox[] = [];
    for (let offset: number = start; offset < end; ) {
      const box: IBox = boxHeader(
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

  /**
   * Select the one optional child of a type, refusing repetition; `undefined`
   * when it is absent.
   */
  export function only(
    buffer: Buffer,
    parent: IBox,
    type: string,
    optional: true,
  ): IBox | undefined;

  /** Select the one required child of a type, refusing absence and repetition. */
  export function only(buffer: Buffer, parent: IBox, type: string): IBox;

  /**
   * Select the one child of a type, refusing repetition, and absence unless
   * optional.
   */
  export function only(
    buffer: Buffer,
    parent: IBox,
    type: string,
    optional?: true,
  ): IBox | undefined {
    const found: IBox[] = children(buffer, parent.start, parent.end).filter(
      (box: IBox): boolean => box.type === type,
    );
    if (found.length > 1) throw new Error("repeated " + type + " box");
    if (found[0] === undefined && optional !== true)
      throw new Error("missing " + type + " box");
    return found[0];
  }

  /** The absolute offset of a field, refusing one past the end of its box. */
  export function field(box: IBox, offset: number, bytes: number): number {
    const at: number = box.start + offset;
    if (at + bytes > box.end)
      throw new Error("the " + box.type + " box is short");
    return at;
  }

  /**
   * The timescale and duration of a movie, track or media header, version 0
   * (32-bit times) or 1 (64-bit times). `mvhd` and `mdhd` store the timescale
   * before the duration; `tkhd` stores a track id and a reserved word there and
   * no timescale, so its timescale is reported as 0.
   */
  export function clock(
    buffer: Buffer,
    box: IBox,
  ): { timescale: number; duration: bigint } {
    const version: number = buffer[field(box, 0, 1)]!;
    const wide: boolean = version === 1;
    if (box.type === "tkhd")
      return {
        timescale: 0,
        duration: wide
          ? buffer.readBigUInt64BE(field(box, 28, 8))
          : BigInt(buffer.readUInt32BE(field(box, 20, 4))),
      };
    const timescale: number = buffer.readUInt32BE(
      field(box, wide ? 20 : 12, 4),
    );
    if (timescale === 0) throw new Error("a zero " + box.type + " timescale");
    return {
      timescale,
      duration: wide
        ? buffer.readBigUInt64BE(field(box, 24, 8))
        : BigInt(buffer.readUInt32BE(field(box, 16, 4))),
    };
  }

  /**
   * A track's edit list in resident order, empty when the track has no `edts`
   * box.
   */
  export function edits(buffer: Buffer, track: IBox): IEdit[] {
    const container: IBox | undefined = only(buffer, track, "edts", true);
    if (container === undefined) return [];
    const list: IBox = only(buffer, container, "elst");
    const wide: boolean = buffer[field(list, 0, 1)] === 1;
    const count: number = buffer.readUInt32BE(field(list, 4, 4));
    const size: number = wide ? 20 : 12;
    const entries: IEdit[] = [];
    for (let entry: number = 0; entry < count; ++entry) {
      const at: number = field(list, 8 + entry * size, size);
      const rate: number = at + (wide ? 16 : 8);
      entries.push({
        segmentDuration: wide
          ? buffer.readBigUInt64BE(at)
          : BigInt(buffer.readUInt32BE(at)),
        mediaTime: wide
          ? buffer.readBigInt64BE(at + 8)
          : BigInt(buffer.readInt32BE(at + 4)),
        mediaRateInteger: buffer.readInt16BE(rate),
        mediaRateFraction: buffer.readInt16BE(rate + 2),
      });
    }
    return entries;
  }

  /** The handler type of a track (`vide`, `soun`, ...). */
  export function handler(buffer: Buffer, track: IBox): string {
    const box: IBox = only(buffer, only(buffer, track, "mdia"), "hdlr");
    return buffer.toString("latin1", field(box, 8, 4), box.start + 12);
  }

  /** Fill the buffer from a file position, refusing a short file. */
  async function readExactly(
    handle: fs.FileHandle,
    buffer: Buffer,
    length: number,
    position: number,
  ): Promise<void> {
    for (let filled: number = 0; filled < length; ) {
      const { bytesRead }: fs.FileReadResult<Buffer> = await handle.read(
        buffer,
        filled,
        length - filled,
        position + filled,
      );
      if (bytesRead === 0) throw new Error("the file ended inside a box");
      filled += bytesRead;
    }
  }
}
