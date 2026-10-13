import { IAutoMovieForgeEntry } from "./IAutoMovieForgeEntry";

/**
 * Coding-agent-authored stand-in model inventory for a script cast.
 *
 * @evidence contracts/common.md#principled-implementation `forgeCast` checks coverage both ways: each entry must target a cast member whose `modelRef` is null, and each such member must appear, so the entries map one to one onto that subset of the cast.
 * @evidence contracts/common.md#clear-and-simple-design A single-field wrapper so the forge stage submits one object; `forgeCast` returns the accepted models as a record keyed by cast node.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A member with an imported `modelRef` is refused rather than overridden, and a repeated node is refused rather than resolved by last-wins.
 * @evidence contracts/common.md#meaningful-documentation States that exactly one entry is expected per cast member lacking a model and none for members with an imported asset.
 * @author Samchon
 */
export interface IAutoMovieForgePlan {
  /**
   * Exactly one generated stand-in for every cast member without a model, and
   * none for a member whose `modelRef` names an imported asset.
   */
  entries: IAutoMovieForgeEntry[];
}
