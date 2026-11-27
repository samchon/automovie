/**
 * The act payload: one dramatic movement's purpose, in a sentence or two.
 *
 * It is authoring text only. Project validation requires `purpose` to be
 * non-empty, and `AutoMovieRenderScreenplay.render` prints it as an
 * `ACT, <purpose>` heading; no compiler stage derives timing, staging, or shots
 * from it.
 */
export interface IAutoMovieActPayload {
  /** What this act accomplishes dramatically ("the hunt turns on the hunter"). */
  purpose: string;
}
