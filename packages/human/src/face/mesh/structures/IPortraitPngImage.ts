/**
 * One decoded facial texture: its size and row-major RGBA bytes.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-connected-basis Carries the shared basis texture between decoding and the numerical recolouring rule.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-connected-iris Holds the exact decoded eye texture the iris rule rewrites and re-encodes.
 * @author Samchon
 */
export interface IPortraitPngImage {
  /** Width in pixels, a positive integer. */
  width: number;

  /** Height in pixels, a positive integer. */
  height: number;

  /** Row-major RGBA bytes, four per pixel. */
  rgba: Uint8Array;
}
