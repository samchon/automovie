/** Shot-local window and its affine image on the production story clock. */
export namespace IAutoMovieStoryInterval {
  /**
   * Borrowed shot-local window in seconds. It may describe the full shot or an
   * event window; the mapping preserves its declared endpoints without deciding
   * whether a consuming criterion includes either boundary.
   */
  export type IWindow = {
    /**
     * Declared beginning in shot-local seconds; the mapper does not clamp it to
     * zero or validate finiteness.
     */
    readonly from: number;
    /**
     * Declared ending in shot-local seconds. The caller decides ordering and
     * endpoint inclusion; equal endpoints can represent one instant.
     */
    readonly to: number;
  };

  /**
   * New caller-owned story-clock endpoint pair in seconds. Positive finite rate
   * preserves order when mapped arithmetic remains finite; invalid values are
   * not refused or reordered by storyInterval.
   */
  export type IResult = {
    /**
     * Story seconds mapped from window.from, which can be negative relative to
     * the production story origin.
     */
    from: number;
    /**
     * Story seconds mapped from window.to. It is not forced above from, and
     * overflow/nonfinite inputs can leave a nonfinite result.
     */
    to: number;
  };
}
