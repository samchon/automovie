/**
 * Uncompressed two-dimensional texel-storage measurement inputs.
 *
 * @evidence contracts/development/design.md#principled-representation Pixel extents and upload bytes per texel determine an integer mip-chain sum including the base level.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Four scalar facts measure storage without allocating pixels or depending on a graphics format object.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Null format size, invalid positive-safe-integer inputs or unsafe totals produce null; encoded files, driver overhead, faces and multisamples are outside this count.
 * @evidence contracts/development/common.md#meaningful-documentation Members document input admission, integer mip rounding and the distinction between upload bytes and encoded image size.
 */
export namespace IAutoMovieMeasureTextureStorage {
  /**
   * Count uncompressed two-dimensional texel storage in bytes. Each mip level
   * halves integer dimensions and retains at least one texel on either axis;
   * this is the actual chain, including non-square and non-power-of-two images.
   * The host supplies bytes per texel from its decoded upload representation.
   * Unknown formats, invalid dimensions and unsafe integer totals have no bound.
   * Driver allocation overhead is outside this texel-storage quantity.
   *
   * @evidence contracts/development/design.md#principled-representation Positive-safe-integer pixel extents and upload bytes per texel define base or floor-halved mip-chain storage in bytes.
   * @evidence contracts/development/design.md#minimal-and-owned-surface measureTextureStorage needs only width, height, format size and mip policy; it allocates no pixel or graphics resource.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Null format size, invalid scalars and unsafe totals return null rather than guessed storage; driver overhead is excluded.
   * @evidence contracts/development/common.md#meaningful-documentation Documents input refusal, one-texel minimum mip extents and unknown-format behavior.
   */
  export type IProps = {
    /** Base-level width in pixels; must be a positive safe integer or result is null. */
    width: number;
    /** Base-level height in pixels; must be a positive safe integer or result is null. */
    height: number;
    /** Upload bytes per texel, a positive safe integer; null denotes unknown format size. */
    bytesPerTexel: number | null;
    /** Include floor-halved levels down to 1 by 1; false counts only the base level. */
    mipmapped: boolean;
  };
}
