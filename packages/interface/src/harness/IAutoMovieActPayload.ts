/**
 * The act payload: one dramatic movement's purpose, in a sentence or two.
 *
 * It is authoring text only. Project validation requires it to be non-empty,
 * and the screenplay export prints it as an `ACT` heading; no compiler stage
 * derives timing, staging, or shots from it.
 *
 * @evidence contracts/common.md#principled-implementation Free prose rather than structured fields, because an act's purpose is read by the model and the human reviewer while no engine stage computes from it.
 * @evidence contracts/common.md#clear-and-simple-design One field on the act node's payload, the only thing an act carries beyond the tree structure that `IAutoMovieScriptNodeBase` already provides.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No act is special-cased; validation checks only that `purpose` is non-empty text, and the screenplay renderer prints it verbatim.
 * @evidence contracts/common.md#meaningful-documentation States what the purpose describes, that it must be non-empty, where it is printed, and that no compiler stage reads it.
 * @author Samchon
 */
export interface IAutoMovieActPayload {
  /**
   * What this act accomplishes dramatically ("the hunt turns on the hunter").
   */
  purpose: string;
}
