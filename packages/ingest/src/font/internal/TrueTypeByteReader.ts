/**
 * Bounds-checked big-endian reads over one font's bytes, as the Open Font
 * Format stores every field (ISO/IEC 14496-22, section 4.2).
 *
 * Every read names the table it serves, so an offset or a length that leaves
 * the bytes refuses with that table's name instead of reading past the buffer
 * or returning `undefined`. The reader borrows the bytes and copies nothing.
 */
export class TrueTypeByteReader {
  /** The borrowed font bytes. */
  private readonly bytes: Uint8Array;

  /** Big-endian view over the borrowed bytes. */
  private readonly view: DataView;

  /** Borrow the font bytes for the life of one decode. */
  public constructor(bytes: Uint8Array) {
    this.bytes = bytes;
    this.view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  }

  /**
   * Refuse unless `[offset, offset + size)` lies inside the bytes.
   *
   * @throws {Error} The span leaves the bytes; the message names `what`.
   */
  public require(offset: number, size: number, what: string): void {
    if (
      !Number.isSafeInteger(offset) ||
      !Number.isSafeInteger(size) ||
      offset < 0 ||
      size < 0 ||
      offset + size > this.bytes.byteLength
    )
      throw new Error(
        `TrueType ${what} at byte ${offset} with length ${size} lies outside the ${this.bytes.byteLength} font bytes`,
      );
  }

  /** Unsigned 8-bit integer. */
  public u8(offset: number, what: string): number {
    this.require(offset, 1, what);
    return this.view.getUint8(offset);
  }

  /** Signed 8-bit integer. */
  public i8(offset: number, what: string): number {
    this.require(offset, 1, what);
    return this.view.getInt8(offset);
  }

  /** Unsigned 16-bit big-endian integer. */
  public u16(offset: number, what: string): number {
    this.require(offset, 2, what);
    return this.view.getUint16(offset, false);
  }

  /** Signed 16-bit big-endian integer. */
  public i16(offset: number, what: string): number {
    this.require(offset, 2, what);
    return this.view.getInt16(offset, false);
  }

  /** Unsigned 32-bit big-endian integer. */
  public u32(offset: number, what: string): number {
    this.require(offset, 4, what);
    return this.view.getUint32(offset, false);
  }

  /** Four-byte tag read as ASCII, such as a table name or an `sfnt` version tag. */
  public tag(offset: number, what: string): string {
    this.require(offset, 4, what);
    return String.fromCharCode(
      this.view.getUint8(offset),
      this.view.getUint8(offset + 1),
      this.view.getUint8(offset + 2),
      this.view.getUint8(offset + 3),
    );
  }
}
