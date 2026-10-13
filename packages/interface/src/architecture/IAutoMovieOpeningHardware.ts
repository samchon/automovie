/**
 * One fixed, non-travelling member an opening carries.
 *
 * Hardware never moves, so it is not part of the work-wide table of driven
 * elements, and its element is not required to sit under the opening's fill.
 *
 * @evidence contracts/common.md#principled-implementation Records a fixed member by id, open kind, and optional element; `validateBuiltEnvironment` requires an id unique within the operation, a non-blank kind, and a resolving element whenever one is named.
 * @evidence contracts/common.md#clear-and-simple-design Three fields and no motion, because a hinge or frame does not travel; moving parts belong to panels instead.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No hardware kind is interpreted; a null element is the contract's way to declare hardware that no element draws, not a fallback for a missing one.
 * @evidence contracts/common.md#meaningful-documentation States the identity scope, kind examples, the null-element meaning, and that the element is neither driven nor tied to the fill.
 * @author Samchon
 */
export interface IAutoMovieOpeningHardware {
  /** Stable hardware identity within the opening. */
  id: string;

  /** Open semantic label such as `frame`, `hinge`, `handle`, or `track`. */
  kind: string;

  /** Visible element realizing it, or null when it is only declared. */
  element: string | null;
}
