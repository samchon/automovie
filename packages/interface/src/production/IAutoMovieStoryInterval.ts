/**
 * Shot-local window and its affine image on the production story clock.
 */
export namespace IAutoMovieStoryInterval {
  /**
   * Borrowed shot-local window in seconds. It may describe the full shot or an event window; the mapping preserves its declared endpoints without deciding whether a consuming criterion includes either boundary.
   *
   * @evidence contracts/development/design.md#principled-representation IWindow endpoints are shot-local seconds; IResult endpoints are story seconds obtained by originSeconds + endpoint * rate, with the pin's default rate of one.
   * @evidence contracts/development/design.md#minimal-and-owned-surface autoMovieStoryInterval maps both endpoints through the shared autoMovieStoryTime owner for story overlap and chronology consumers without involving edit positions.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Endpoint inclusion belongs to the criterion using the window; mapping neither rounds, clamps nor reorders. Nonfinite or inverted inputs remain visible for caller validation.
   * @evidence contracts/development/common.md#meaningful-documentation Shot-local window and its affine image on the production story clock. IWindow endpoints are shot-local seconds; IResult endpoints are story seconds obtained by originSeconds + endpoint * rate, with the pin's default rate of one.
   */
  export type IWindow = {
    /**
     * Declared beginning in shot-local seconds; the mapper does not clamp it to zero or validate finiteness.
     */
    readonly from: number;
    /**
     * Declared ending in shot-local seconds. The caller decides ordering and endpoint inclusion; equal endpoints can represent one instant.
     */
    readonly to: number;
  };

  /**
   * New caller-owned story-clock endpoint pair in seconds. Positive finite rate preserves order when mapped arithmetic remains finite; invalid values are not refused or reordered by autoMovieStoryInterval.
   *
   * @evidence contracts/development/design.md#principled-representation IWindow endpoints are shot-local seconds; IResult endpoints are story seconds obtained by originSeconds + endpoint * rate, with the pin's default rate of one.
   * @evidence contracts/development/design.md#minimal-and-owned-surface autoMovieStoryInterval maps both endpoints through the shared autoMovieStoryTime owner for story overlap and chronology consumers without involving edit positions.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Endpoint inclusion belongs to the criterion using the window; mapping neither rounds, clamps nor reorders. Nonfinite or inverted inputs remain visible for caller validation.
   * @evidence contracts/development/common.md#meaningful-documentation Shot-local window and its affine image on the production story clock. IWindow endpoints are shot-local seconds; IResult endpoints are story seconds obtained by originSeconds + endpoint * rate, with the pin's default rate of one.
   */
  export type IResult = {
    /**
     * Story seconds mapped from window.from, which can be negative relative to the production story origin.
     */
    from: number;
    /**
     * Story seconds mapped from window.to. It is not forced above from, and overflow/nonfinite inputs can leave a nonfinite result.
     */
    to: number;
  };
}
