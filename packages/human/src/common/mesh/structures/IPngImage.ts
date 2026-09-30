/**
 * One decoded texture: its size and row-major RGBA bytes.
 *
 * @author Samchon
 */
export interface IPngImage {
  /** Width in pixels, a positive integer. */
  width: number;

  /** Height in pixels, a positive integer. */
  height: number;

  /** Row-major RGBA bytes, four per pixel. */
  rgba: Uint8Array;
}
