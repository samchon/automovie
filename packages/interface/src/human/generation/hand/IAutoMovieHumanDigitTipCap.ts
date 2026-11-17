/**
 * The radius law and arc-length search interval used to locate a digit's distal cap.
 *
 * The interface package owns these declarations; AutoMovieHumanDigitTipCap in Human supplies their runtime values.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The radius law and arc-length search interval used to locate a digit's distal cap. Member comments specify the individual units, frames and optional-value meanings.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace groups only IInput declarations; it adds no runtime state, fixture dispatch or alternate implementation. Each member retains its own concrete data or callable representation.
 * @evidence contracts/development/design.md#principled-representation IInput separate the declared inputs, results and related quantities. Their numeric domains and geometric consistency remain the Human producers' and engine operators' runtime responsibility; the namespace introduces no additional frame or clock.
 * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieHumanDigitTipCap exchanges the named IInput contracts with its Human callers. Interface owns these type declarations without importing that implementation.
 */
export namespace IAutoMovieHumanDigitTipCap {
  /** A cap's fixed inputs.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A cap's fixed inputs.
   * @evidence contracts/development/design.md#principled-representation `radius`: The section's mean radius `sqrt(width * depth)` at an arc length along the line, mm. `length`: Arc length of the digit's apex along its line, mm. `from`: Arc length of the first section to search from, mm.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanDigitTipCap.start.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `radius`, `length`, `from`; callers supply the complete record.
   */
  export interface IInput {
    /**
     * The section's mean radius `sqrt(width * depth)` at an arc length along the line, mm.
     *
     * @evidence contracts/development/common.md#meaningful-documentation The section's mean radius `sqrt(width * depth)` at an arc length along the line, mm.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No constants, branches or compensations execute in this signature. AutoMovieHumanDigitTipCap and the callback provider must satisfy the documented radius contract.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature chooses no algorithm or storage strategy; AutoMovieHumanDigitTipCap and its callback provider own the cost of each radius invocation.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This declaration performs no requests or caching. AutoMovieHumanDigitTipCap and the callback provider determine when the inputs to radius describe equivalent work.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The signature acquires no resources. AutoMovieHumanDigitTipCap and the callback provider own any captured source data and the callable's lifetime.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This is the IAutoMovieHumanDigitTipCap.IInput.radius callable contract, without an implementation body. AutoMovieHumanDigitTipCap and its supplied callbacks own the numerical method and admission of the documented arguments.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure IAutoMovieHumanDigitTipCap.IInput.radius declares only the invocation boundary; decomposition belongs to AutoMovieHumanDigitTipCap and the callback provider.
     */
    radius: (s: number) => number;

    /** Arc length of the digit's apex along its line, mm. */
    length: number;

    /** Arc length of the first section to search from, mm. */
    from: number;
  }
}
