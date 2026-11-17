import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";
import type { AutoMovieMatrix3Tuple } from "../../../geometry/AutoMovieMatrix3Tuple";
import type { IAutoMovieHumanSegmentFrame } from "../frame/IAutoMovieHumanSegmentFrame";

/**
 * Named segment frames and optional parent-relative joint rotations for reference placement. Runtime construction and admission remain with AutoMovieHumanF1Placement in Human.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes named segment frames and optional parent-relative joint rotations for reference placement; nested declarations retain their units, frames, optional states and callback contracts.
 * @evidence contracts/development/design.md#principled-representation Named segment frames and optional parent-relative joint rotations for reference placement. Named nested records and aliases preserve these distinctions; callers must satisfy their numeric premises because structural types do not enforce numeric validity.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns these dependency-free exchange types for AutoMovieHumanF1Placement; Human retains the producer, evaluator and validation code, while imported geometry contracts keep their original owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace groups the existing F1Placement contracts without adding runtime factories, fixture selectors or alternative representations; any fitted or conventional quantities remain identified by their nested declarations.
 */
export namespace IAutoMovieHumanF1Placement {
  /** Every segment's frame in the figure's frame, by name.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Every segment's frame in the figure's frame, by name.
   * @evidence contracts/development/design.md#principled-representation Every segment's frame in the figure's frame, by name. ReadonlyMap<string, IAutoMovieHumanSegmentFrame> retains the referenced owner's constraints and mutability.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanF1Placement.frames. Read by AutoMovieHumanF1Placement.frame, AutoMovieHumanF1Placement.point, AutoMovieHumanF1Placement.points. Also types AutoMovieHumanF1.frames, AutoMovieHumanF1Placement.REFERENCE.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanF1.frames, AutoMovieHumanF1Placement.REFERENCE, AutoMovieHumanF1Placement.frames, AutoMovieHumanF1Placement.frame for every segment's frame in the figure's frame, by name.
   */
  export type IFrames = ReadonlyMap<string, IAutoMovieHumanSegmentFrame>;

  /** A pose: a joint's rotation `A_parent^T A_child` by its segment's name, or undefined to keep its reference rotation.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A pose: a joint's rotation `A_parent^T A_child` by its segment's name, or undefined to keep its reference rotation.
   * @evidence contracts/development/design.md#principled-representation A pose: a joint's rotation `A_parent^T A_child` by its segment's name, or undefined to keep its reference rotation. The callable takes name and returns AutoMovieMatrix3Tuple | undefined.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanF1.assemble, AutoMovieHumanF1.construction, AutoMovieHumanF1Placement.frames. Also types AutoMovieHumanF1Placement.NEUTRAL.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanF1.assemble, AutoMovieHumanF1.construction, AutoMovieHumanF1Placement.NEUTRAL, AutoMovieHumanF1Placement.frames for a pose: a joint's rotation `A_parent^T A_child` by its segment's name, or undefined to keep its reference rotation.
   */
  export type IPose = (name: string) => AutoMovieMatrix3Tuple | undefined;

  /**
   * Resolve a registered datum's local coordinates for one person's segment lengths.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Resolve a registered datum's local coordinates for one person's segment lengths.
   * @evidence contracts/development/design.md#principled-representation The datum name addresses a stored segment point. It returns that point's segment coordinates in millimetres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieHumanF1Placement reads this callback before transporting each datum to its new pose.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The callback describes local placement. The frame owner supplies a fallback when the callback itself is absent.
   */
  export type ILocals = (name: string) => AutoMovieVector3Tuple;
}
