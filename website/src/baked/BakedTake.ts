import type { SceneTrack } from "../scenes/SceneTrack";
import type { ITake } from "../takes/structures/ITake";

/**
 * The byte form of a take the build computed ahead of the visitor, so a page
 * draws it at once instead of planning it in a worker for seconds.
 *
 * The bytes begin with `AMT1` for 16-bit values or `AMT2` for 32-bit values,
 * followed by the length of a UTF-8 JSON header as a little-endian 32-bit
 * integer, the header, padding to an even offset, and the track's values. The
 * header is the take without its values. The values run as in `SceneTrack`,
 * except that each value after the first frame is stored as its difference from
 * the same value one frame before, wrapped to the stored width. A pose changes
 * little between frames, so the differences are small and the gzip the build
 * applies shrinks them several times, while the wrapped arithmetic restores
 * every value exactly.
 *
 * Compression stays with the caller: the build gzips with `node:zlib`, and the
 * page inflates with the browser's `DecompressionStream`.
 */
export namespace BakedTake {
  /** The magic for each stored value width. */
  const MAGIC: Readonly<Record<2 | 4, string>> = { 2: "AMT1", 4: "AMT2" };

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
    const stride: 2 | 4 = values instanceof Int32Array ? 4 : 2;
    const bytes: Uint8Array = new Uint8Array(start + values.length * stride);
    const view: DataView = new DataView(bytes.buffer);
    for (let i: number = 0; i < 4; i++) bytes[i] = MAGIC[stride].charCodeAt(i);
    view.setUint32(4, header.length, true);
    bytes.set(header, 8);

    // Each frame after the first as its difference from the one before.
    const width: number = values.length / Math.max(1, take.track.frames);
    const set: DataView["setInt16"] =
      stride === 2 ? view.setInt16.bind(view) : view.setInt32.bind(view);
    for (let i: number = 0; i < values.length; i++) {
      const before: number = i >= width ? values[i - width]! : 0;
      set(start + i * stride, values[i]! - before, true);
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
    if (magic !== MAGIC[2] && magic !== MAGIC[4])
      throw new Error("The bytes are not a baked take.");
    const stride: 2 | 4 = magic === MAGIC[2] ? 2 : 4;
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
    const count: number = (bytes.byteLength - start) / stride;
    const values: SceneTrack.Values =
      stride === 2 ? new Int16Array(count) : new Int32Array(count);
    const width: number = count / Math.max(1, header.track.frames);
    const get: DataView["getInt16"] =
      stride === 2 ? view.getInt16.bind(view) : view.getInt32.bind(view);
    for (let i: number = 0; i < count; i++) {
      const delta: number = get(start + i * stride, true);
      values[i] = i >= width ? values[i - width]! + delta : delta;
    }
    return { ...header, track: { ...header.track, values } };
  }

  /** The offset after the header's even padding. */
  function align(offset: number): number {
    return offset + (offset % 2);
  }
}
