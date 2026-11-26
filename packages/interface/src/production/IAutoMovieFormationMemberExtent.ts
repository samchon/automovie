/**
 * Vertical member measurement used to expand formation placement bounds for
 * framing.
 */
export namespace IAutoMovieFormationMemberExtent {
  /**
   * One member's model-space vertical extent inside a compiled formation, in
   * metres above the slot it stands on.
   *
   * A formation stores where its members stand, not how tall they are: the
   * compiled bounds are the box of slot positions, so their vertical span is
   * the ground's, and a camera solved from it frames a crowd as a flat carpet.
   * The member's own model supplies the missing dimension, found by the runtime
   * group identity assigned during compilation. Both this operation and node
   * subject measurement read the same rest extent, so a promoted hero has the
   * same height as its anonymous neighbours.
   *
   * Falls back to min 0 and max 1.7 m when the group's runtime model is absent,
   * draws nothing, or measures less than 0.1 m high. These are the shared
   * DEFAULT_SUBJECT_HEIGHT and MIN_MEASURED_SUBJECT_HEIGHT policies used by
   * node subjects. The measurement covers portable rest geometry and proxies,
   * not external bytes or renderer-only deformation. The result is caller-owned
   * and no result cache is retained.
   */
  export type IResult = {
    /**
     * Lowest measured model-space Y offset in metres relative to the slot; may
     * be negative. Zero in the stand-in result.
     */
    min: number;

    /**
     * Highest measured model-space Y offset in metres relative to the slot. The
     * stand-in uses 1.7; this is not the interval's height unless min is zero.
     */
    max: number;
  };
}
