/**
 * The act payload: one dramatic movement's purpose, in a sentence or two.
 *
 * It is authoring text only. Project validation requires `purpose` to be
 * non-empty, and `renderScreenplay` prints it as an `ACT, <purpose>` heading;
 * no compiler stage derives timing, staging, or shots from it.
 *
 * @evidence contracts/common.md#principled-implementation The act level of the script tree records intent as prose, because an act's purpose is read by people and the model, while every computed fact comes from the beats it contains.
 * @evidence contracts/common.md#clear-and-simple-design One text field is the whole payload; ordering and containment belong to the enclosing script node's `parent` link, not to this record.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No compiler stage parses the purpose for keywords or timing, so its wording cannot change a render; only emptiness is refused.
 * @evidence contracts/common.md#meaningful-documentation States that the text is authoring-only, the non-empty rule, the one exporter that prints it and its heading form, and that no compiler stage reads it.
 * @author Samchon
 */
export interface IAutoMovieActPayload {
  /**
   * What this act accomplishes dramatically ("the hunt turns on the hunter").
   */
  purpose: string;
}
