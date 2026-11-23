/** Untrusted track projection shared by clip artifact admission and sampling. */
export namespace IAutoMovieClipTrackShapeFaults {
  /**
   * Borrowed raw fields inspected by clipTrackShapeFaults. Interpolation is
   * checked first; if times or values is not an Array the helper returns
   * without array/stride findings, leaving container admission to its caller.
   * Otherwise indexed walks report holes/nonfinite values, invalid times,
   * nonincreasing clocks and malformed strides.
   *
   * The helper returns a fresh ordered fault array without modifying tracks;
   * empty-array faults retain the original array. sampleClip throws its first
   * fault while artifact validation appends all faults. Positive finite
   * duration bounds key times; a zero or invalid duration does not impose that
   * upper bound here.
   */
  export type ITrack = {
    /**
     * Expected nonempty Array of finite, nonnegative, strictly increasing
     * clip-local seconds; holes receive temporal faults.
     */
    times?: unknown;

    /**
     * Expected nonempty flat finite scalar Array; one fixed-width value per
     * key, or in-tangent/value/out-tangent triplets for cubicspline. Units
     * follow the channel.
     */
    values?: unknown;

    /**
     * Interpolation token, admitted against the engine's supported track
     * interpolation set even when arrays are absent.
     */
    interpolation?: unknown;

    /**
     * Channel descriptor used only for canonical value width; weights width
     * remains model-dependent and target references are not validated here.
     */
    channel?: unknown;
  };
}
