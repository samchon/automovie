/**
 * Count uncompressed two-dimensional texel storage in bytes. Each mip level
 * halves integer dimensions and retains at least one texel on either axis;
 * this is the actual chain, including non-square and non-power-of-two images.
 * The host supplies bytes per texel from its decoded upload representation.
 * Unknown formats, invalid dimensions and unsafe integer totals have no bound.
 * Driver allocation overhead is outside this texel-storage quantity.
 *
 * @evidence contracts/common.md#principled-implementation Sum width*height*bytesPerTexel over integer-halved mip levels until both axes are one, admitting positive safe dimensions/component widths and refusing unsafe accumulated bytes. Non-square/non-power-of-two chains retain their actual extents.
 * @evidence contracts/common.md#clear-and-simple-design This one 2D texel-storage owner serves raw uploads, derived atlases and target attachments; face/sample expansion remains outside it.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown component width returns null rather than a generic multiplier; no texture id or fixture changes mip arithmetic and driver overhead is not included.
 * @evidence contracts/common.md#meaningful-documentation Props document pixel dimensions, uncompressed bytes per texel and mip-chain inclusion; null identifies unknown/invalid/unrepresentable storage.
 * @evidence contracts/performance.md#efficient-algorithms At most O(log(max(width,height))) levels use constant scalar storage, without allocating texels or a mip array.
 * @evidence contracts/performance.md#reuse-equivalent-work All texture representations share this extent formula; mutable caller facts are recomputed rather than retained behind an identity key.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a number/null returns, with no pixel buffer, native texture, handle or asynchronous work owned.
 */
export function measureAutoMovieTextureStorage(props: {
  width: number;
  height: number;
  bytesPerTexel: number | null;
  mipmapped: boolean;
}): number | null {
  if (
    !Number.isSafeInteger(props.width) || props.width <= 0 ||
    !Number.isSafeInteger(props.height) || props.height <= 0 ||
    props.bytesPerTexel === null ||
    !Number.isSafeInteger(props.bytesPerTexel) || props.bytesPerTexel <= 0
  ) return null;
  let width: number = props.width;
  let height: number = props.height;
  let bytes: number = 0;
  for (;;) {
    bytes += width * height * props.bytesPerTexel;
    if (!Number.isSafeInteger(bytes)) return null;
    if (!props.mipmapped || (width === 1 && height === 1)) return bytes;
    width = Math.max(1, Math.floor(width / 2));
    height = Math.max(1, Math.floor(height / 2));
  }
}
