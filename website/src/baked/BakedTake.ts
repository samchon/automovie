import type { ITake } from "../takes/structures/ITake";

/**
 * The byte form of a take the build computed ahead of the visitor, so a page
 * draws it at once instead of planning it in a worker for seconds.
 *
 * The bytes are the magic `AMT1`, the length of a UTF-8 JSON header as a
 * little-endian 32-bit integer, the header, padding to an even offset, and
 * the track's values. The header is the take without its values. The values
 * run as in `SceneTrack`, except that each value after the first frame is
 * stored as its difference from the same value one frame before, wrapped to
 * 16 bits. A pose changes little between frames, so the differences are
 * small and the gzip the build applies shrinks them several times, while
 * the wrapped arithmetic restores every value exactly.
 *
 * Compression stays with the caller: the build gzips with `node:zlib`, and
 * the page inflates with the browser's `DecompressionStream`.
 */
export namespace BakedTake {
  /** The four bytes every baked take starts with. */
  const MAGIC: string = "AMT1";

  /**
   * Write a take as bytes.
   *
   * @param take The take.
   * @returns Its bytes, uncompressed.
   */
  export function encode(take: ITake): Uint8Array {
    const { values, ...track }: ITake["track"] = take.track;
    const header: Uint8Array = new TextEncoder().encode(
      JSON.stringify({ ...take, track }),
    );
    const start: number = align(8 + header.length);
    const bytes: Uint8Array = new Uint8Array(start + values.length * 2);
    const view: DataView = new DataView(bytes.buffer);
    for (let i: number = 0; i < 4; i++) bytes[i] = MAGIC.charCodeAt(i);
    view.setUint32(4, header.length, true);
    bytes.set(header, 8);

    // Each frame after the first as its difference from the one before.
    const width: number = values.length / Math.max(1, take.track.frames);
    for (let i: number = 0; i < values.length; i++) {
      const before: number = i >= width ? values[i - width]! : 0;
      view.setInt16(start + i * 2, ((values[i]! - before) << 16) >> 16, true);
    }
    return bytes;
  }

  /**
   * Read a take from its bytes.
   *
   * @param bytes The bytes, uncompressed.
   * @returns The take.
   * @throws {Error} When the bytes are not a baked take.
   */
  export function decode(bytes: Uint8Array): ITake {
    const magic: string = String.fromCharCode(...bytes.subarray(0, 4));
    if (magic !== MAGIC) throw new Error("The bytes are not a baked take.");
    const view: DataView = new DataView(
      bytes.buffer,
      bytes.byteOffset,
      bytes.byteLength,
    );
    const length: number = view.getUint32(4, true);
    const header: Omit<ITake, "track"> & {
      track: Omit<ITake["track"], "values">;
    } = JSON.parse(new TextDecoder().decode(bytes.subarray(8, 8 + length)));
    const start: number = align(8 + length);
    const count: number = (bytes.byteLength - start) / 2;
    const values: Int16Array = new Int16Array(count);
    const width: number = count / Math.max(1, header.track.frames);
    for (let i: number = 0; i < count; i++) {
      const delta: number = view.getInt16(start + i * 2, true);
      values[i] =
        i >= width ? ((values[i - width]! + delta) << 16) >> 16 : delta;
    }
    return { ...header, track: { ...header.track, values } };
  }

  /** The next even offset, where 16-bit values may start. */
  function align(offset: number): number {
    return offset + (offset % 2);
  }
}
