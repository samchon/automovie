/**
 * Vertical offsets used to turn a world point into a degenerate subject box.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Vertical offsets used to turn a world point into a degenerate subject box. min/max are Y offsets in metres relative to the supplied world point; the consumer adds them to point.y while X and Z remain equal on both corners.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Finite ordered offsets are a caller premise; no validation, clamping or invented width occurs, and an inverted pair remains inverted.
 * @evidence contracts/development/design.md#principled-representation min/max are Y offsets in metres relative to the supplied world point; the consumer adds them to point.y while X and Z remain equal on both corners.
 * @evidence contracts/development/design.md#minimal-and-owned-surface pointSubjectBox consumes this pair for unmeasured stand-ins and measured zero-width segments routed by nodeSubjectBox.
 */
export namespace IAutoMoviePointSubjectBox {
  /**
   * The box one staged point occupies, given the vertical extent of what stands there.
   *
   * `extent` is in metres relative to the point and carries its own floor, so a subject whose span begins above its node origin is boxed where it is rather than at the placement it hangs from. The box is horizontally degenerate, because a placement is a point and a height is not a width: this is the shape of a subject nothing could be measured for, a node with no compiled model whose span is its rig's or the stand-in's. {@link nodeSubjectBox} boxes a subject with horizontal geometry from its measured extent; its zero-width shape test also routes measured vertical segments here without distinguishing them from unmeasured stand-ins.
   *
   * @evidence contracts/development/design.md#principled-representation min/max are Y offsets in metres relative to the supplied world point; the consumer adds them to point.y while X and Z remain equal on both corners.
   * @evidence contracts/development/design.md#minimal-and-owned-surface pointSubjectBox consumes this pair for unmeasured stand-ins and measured zero-width segments routed by nodeSubjectBox.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Finite ordered offsets are a caller premise; no validation, clamping or invented width occurs, and an inverted pair remains inverted.
   * @evidence contracts/development/common.md#meaningful-documentation Vertical offsets used to turn a world point into a degenerate subject box. min/max are Y offsets in metres relative to the supplied world point; the consumer adds them to point.y while X and Z remain equal on both corners.
   */
  export type IExtent = {
    /**
     * Lower Y offset in metres relative to the point, preserving a floor that does not coincide with the model origin.
     */
    min: number;
    /**
     * Upper Y offset in metres relative to the point. The caller supplies max >= min; equality describes a point-height extent.
     */
    max: number;
  };
}
