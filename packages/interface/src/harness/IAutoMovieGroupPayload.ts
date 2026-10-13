/**
 * The payload of a group node in the screenplay refinement tree: why its
 * children belong together, such as a montage or an exchange.
 *
 * `renderScreenplay` prints the rationale as a bracketed `[<rationale>]` line
 * before the group's children, and nothing else reads it. `validateScriptTree`
 * checks the group's place in the tree but not this text, so a blank rationale
 * is accepted and printed as `[]`.
 *
 * @evidence contracts/common.md#principled-implementation Free prose, because a group's reason for existing is editorial meaning that only a person or model reads; the tree structure, not this payload, is what the validator checks.
 * @evidence contracts/common.md#clear-and-simple-design One field is the whole payload, following the refinement tree's rule that each node kind carries its own shape rather than shared reasoning slots.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The text is printed verbatim and never parsed to change structure or motion, and the documentation states that a blank rationale is not refused.
 * @evidence contracts/common.md#meaningful-documentation States the node it belongs to, its one consumer and output form, and that its content is unvalidated; the member says it is prose.
 * @author Samchon
 */
export interface IAutoMovieGroupPayload {
  /** The grouping rationale, in prose. */
  rationale: string;
}
