import { IAutoMovieForgeEntry } from "./IAutoMovieForgeEntry";

/**
 * Coding-agent-authored stand-in model inventory for a script cast.
 *
 * `forgeCast` accepts it as a map from cast node to model, or returns every
 * casting and model violation together.
 *
 * @evidence contracts/common.md#principled-implementation `forgeCast` indexes the cast once, checks each entry, then walks the cast again to report every member with a `null` `modelRef` that no entry forged, so the plan must be an exact cover of the stand-in members.
 * @evidence contracts/common.md#clear-and-simple-design One entry list is the whole plan; the cast and its `modelRef` choices stay on the script, so the plan states only the models it supplies.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A missing stand-in is reported rather than filled with a default rig, and a second entry for one node is refused rather than letting the later one win.
 * @evidence contracts/common.md#meaningful-documentation States which consumer reads the plan, what it returns, and the exact-cover rule over cast members with and without a `modelRef`.
 * @author Samchon
 */
export interface IAutoMovieForgePlan {
  /**
   * Exactly one generated stand-in for every cast member whose `modelRef` is
   * `null`, and none for a member whose `modelRef` names an imported asset.
   */
  entries: IAutoMovieForgeEntry[];
}
