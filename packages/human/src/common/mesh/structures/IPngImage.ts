/**
 * One decoded texture: its size and row-major RGBA bytes.
 *
 *
 * @evidence contracts/common.md#principled-implementation Width, height and row-major RGBA bytes describe the same decoded pixel population; the PNG decoder owns format admission.
 * @evidence contracts/common.md#clear-and-simple-design One image record carries pixel dimensions and bytes without importing material or face anatomy.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The type does not imply CRC verification, accept malformed chunks or synthesize missing pixels; decodePng owns the current supported PNG boundary.
 * @evidence contracts/common.md#meaningful-documentation Members state positive pixel dimensions and four ordered RGBA components per pixel rather than a geometric metre unit.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Decoded PNG image layout is erased by TypeScript; its runtime consumer owns the actual geometry or measurement traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Decoded PNG image layout specifies caller data and performs no runtime recomputation or cache lookup.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Decoded PNG image layout acquires no runtime handle or retained cache; concrete array and map ownership belongs to its producing and consuming functions.
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
