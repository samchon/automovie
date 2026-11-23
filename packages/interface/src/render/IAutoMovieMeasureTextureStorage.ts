/** Uncompressed two-dimensional texel-storage measurement inputs. */
export namespace IAutoMovieMeasureTextureStorage {
  /**
   * Count uncompressed two-dimensional texel storage in bytes. Each mip level
   * halves integer dimensions and retains at least one texel on either axis;
   * this is the actual chain, including non-square and non-power-of-two images.
   * The host supplies bytes per texel from its decoded upload representation.
   * Unknown formats, invalid dimensions and unsafe integer totals have no
   * bound. Driver allocation overhead is outside this texel-storage quantity.
   */
  export type IProps = {
    /**
     * Base-level width in pixels; must be a positive safe integer or result is
     * null.
     */
    width: number;
    /**
     * Base-level height in pixels; must be a positive safe integer or result is
     * null.
     */
    height: number;
    /**
     * Upload bytes per texel, a positive safe integer; null denotes unknown
     * format size.
     */
    bytesPerTexel: number | null;
    /**
     * Include floor-halved levels down to 1 by 1; false counts only the base
     * level.
     */
    mipmapped: boolean;
  };
}
