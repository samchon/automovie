/**
 * Untrusted track projection shared by clip artifact admission and sampling.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Untrusted track projection shared by clip artifact admission and sampling. Nested contracts define the relevant units, ownership and failure states.
 * @evidence contracts/development/design.md#principled-representation Unknown clock/value/interpolation/channel fields permit staged admission of second-based keyframes.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The sampler and artifact gate share fault generation while choosing throw-first or append-all behavior.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Container and channel-reference admission remain separate from numeric stride/clock inspection.
 */
export namespace IAutoMovieClipTrackShapeFaults {
  /**
   * Borrowed raw fields inspected by clipTrackShapeFaults. Interpolation is checked first; if times or values is not an Array the helper returns without array/stride findings, leaving container admission to its caller. Otherwise indexed walks report holes/nonfinite values, invalid times, nonincreasing clocks and malformed strides.
   *
   * The helper returns a fresh ordered fault array without modifying tracks; empty-array faults retain the original array. sampleClip throws its first fault while artifact validation appends all faults. Positive finite duration bounds key times; a zero or invalid duration does not impose that upper bound here.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines inspection order, missing-container limits, result ownership, duration semantics and consumer failure behavior.
   * @evidence contracts/development/design.md#principled-representation unknown fields represent a narrowed but unadmitted record; second-based key times and channel-specific value widths remain runtime checks.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Gate and sampler share clock/interpolation/stride rules through one projection rather than asserting an IAutoMovieTrack before admission.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No padding, width guessing or normalization repairs malformed tracks; channel addressability and duration/container admission remain with their owners.
   */
  export type ITrack = {
    /** Expected nonempty Array of finite, nonnegative, strictly increasing clip-local seconds; holes receive temporal faults. */
    times?: unknown;

    /** Expected nonempty flat finite scalar Array; one fixed-width value per key, or in-tangent/value/out-tangent triplets for cubicspline. Units follow the channel. */
    values?: unknown;

    /** Interpolation token, admitted against the engine's supported track interpolation set even when arrays are absent. */
    interpolation?: unknown;

    /** Channel descriptor used only for canonical value width; weights width remains model-dependent and target references are not validated here. */
    channel?: unknown;
  };
}
