/**
 * Count uncompressed two-dimensional texel storage in bytes. Each mip level
 * halves integer dimensions and retains at least one texel on either axis;
 * this is the actual chain, including non-square and non-power-of-two images.
 * The host supplies bytes per texel from its decoded upload representation.
 * Unknown formats, invalid dimensions and unsafe integer totals have no bound.
 * Driver allocation overhead is outside this texel-storage quantity.
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
  let width = props.width;
  let height = props.height;
  let bytes = 0;
  for (;;) {
    bytes += width * height * props.bytesPerTexel;
    if (!Number.isSafeInteger(bytes)) return null;
    if (!props.mipmapped || (width === 1 && height === 1)) return bytes;
    width = Math.max(1, Math.floor(width / 2));
    height = Math.max(1, Math.floor(height / 2));
  }
}
