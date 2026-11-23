/** Vertical projection of portable model rest geometry for framing. */
export namespace IAutoMovieComputeModelRestExtentY {
  /**
   * A model's rest-pose vertical extent in model space, in metres: the model-Y
   * range of the supplied portable part geometry or registered collision
   * proxy.
   *
   * This is the subject height the framing grammar needs, and the reason it is
   * not {@link computeRestHeight}. A rig stops at the joints animation requires
   * and the figure does not: the generated `stickman` has no foot bone and no
   * head-top bone, so its joint span is 0.680 of the declared height, and a
   * `full` shot solved from that number shows an actor from the shins up.
   *
   * Returns null when the model has no vertex to measure, leaving the caller's
   * own fallback in charge rather than inventing a height, and throws when the
   * model's skeleton is malformed, both as {@link computeModelRestExtent} does.
   */
  export type IResult = {
    /**
     * Lowest measured model-space Y in metres, which may be above or below the
     * model origin.
     */
    min: number;
    /**
     * Highest measured model-space Y in metres; subtract min to obtain the
     * measured vertical span. The returned scalar pair is newly allocated.
     */
    max: number;
  } | null;
}
