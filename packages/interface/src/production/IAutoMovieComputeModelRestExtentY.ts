

/**
 * Vertical projection of portable model rest geometry for framing.
 */
export namespace IAutoMovieComputeModelRestExtentY {
  /**
   * A model's rest-pose vertical extent in model space, in metres: the model-Y range of the supplied portable part geometry or registered collision proxy.
   *
   * This is the subject height the framing grammar needs, and the reason it is not {@link computeRestHeight}. A rig stops at the joints animation requires and the figure does not: the generated `stickman` has no foot bone and no head-top bone, so its joint span is 0.680 of the declared height, and a `full` shot solved from that number shows an actor from the shins up.
   *
   * Returns null when the model has no vertex to measure, leaving the caller's own fallback in charge rather than inventing a height, and throws when the model's skeleton is malformed, both as {@link computeModelRestExtent} does.
   *
   * @evidence contracts/development/design.md#principled-representation min and max are model-Y metres; height is max - min, not a skeleton joint span. Null is forwarded when computeModelRestExtent has no measurable extent.
   * @evidence contracts/development/design.md#minimal-and-owned-surface computeModelRestExtentY projects the canonical three-axis measurement for formationMemberExtent and other height-only framing consumers.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No default height is embedded in this result; formation and subject framing apply their own documented fallback after observing null or insufficient height.
   * @evidence contracts/development/common.md#meaningful-documentation Vertical projection of portable model rest geometry for framing. min and max are model-Y metres; height is max - min, not a skeleton joint span. Null is forwarded when computeModelRestExtent has no measurable extent.
   */
  export type IResult = { 
    /**
     * Lowest measured model-space Y in metres, which may be above or below the model origin.
     */
    min: number; 
    /**
     * Highest measured model-space Y in metres; subtract min to obtain the measured vertical span. The returned scalar pair is newly allocated.
     */
    max: number } | null;
}
