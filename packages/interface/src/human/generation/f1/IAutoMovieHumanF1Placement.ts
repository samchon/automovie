import type { IAutoMovieHumanSegmentFrame } from "../frame/IAutoMovieHumanSegmentFrame";

/** Type contracts exchanged by AutoMovieHumanF1Placement; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanF1Placement {
  /** Every segment's frame in the figure's frame, by name.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Every segment's frame in the figure's frame, by name.
   * @evidence contracts/development/design.md#principled-representation Every segment's frame in the figure's frame, by name. ReadonlyMap<string, IAutoMovieHumanSegmentFrame.IFrame> retains the referenced owner's constraints and mutability.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanF1Placement.frames. Read by AutoMovieHumanF1Placement.frame, AutoMovieHumanF1Placement.point, AutoMovieHumanF1Placement.points. Also types AutoMovieHumanF1.frames, AutoMovieHumanF1Placement.REFERENCE.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanF1.frames, AutoMovieHumanF1Placement.REFERENCE, AutoMovieHumanF1Placement.frames, AutoMovieHumanF1Placement.frame for every segment's frame in the figure's frame, by name.
   */
  export type IFrames = ReadonlyMap<string, IAutoMovieHumanSegmentFrame.IFrame>;

  /** A pose: a joint's rotation `A_parent^T A_child` by its segment's name, or undefined to keep its reference rotation.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A pose: a joint's rotation `A_parent^T A_child` by its segment's name, or undefined to keep its reference rotation.
   * @evidence contracts/development/design.md#principled-representation A pose: a joint's rotation `A_parent^T A_child` by its segment's name, or undefined to keep its reference rotation. The callable takes name and returns IAutoMovieHumanSegmentFrame.M3 | undefined.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanF1.assemble, AutoMovieHumanF1.construction, AutoMovieHumanF1Placement.frames. Also types AutoMovieHumanF1Placement.NEUTRAL.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanF1.assemble, AutoMovieHumanF1.construction, AutoMovieHumanF1Placement.NEUTRAL, AutoMovieHumanF1Placement.frames for a pose: a joint's rotation `A_parent^T A_child` by its segment's name, or undefined to keep its reference rotation.
   */
  export type IPose = (
    name: string,
  ) => IAutoMovieHumanSegmentFrame.M3 | undefined;
}
