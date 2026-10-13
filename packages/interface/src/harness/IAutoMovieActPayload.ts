/**
 * The act payload: one dramatic movement's purpose, in a sentence or two.
 *
 * It is authoring text only. Project validation requires it to be non-empty,
 * and the screenplay export prints it as an `ACT` heading; no compiler stage
 * derives timing, staging, or shots from it.
 *
 * @author Samchon
 */
export interface IAutoMovieActPayload {
  /**
   * What this act accomplishes dramatically ("the hunt turns on the hunter").
   */
  purpose: string;
}
