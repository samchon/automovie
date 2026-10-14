import { AutoMovieSubjectReviewDescription, IAutoMovieSubjectBox } from "@automovie/interface";
import { subjectInspectionIInspectionFrame } from "./subjectInspectionIInspectionFrame";

/**
 * Choose measured content bounds before declared bounds, except unsupported formations.
 *
 * @evidence contracts/common.md#principled-implementation Formation descriptions explicitly refuse; other subjects select content bounds or their declared fallback with the recorded coordinate space.
 * @evidence contracts/common.md#clear-and-simple-design Frame selection stays separate from subject resolution and camera rule arithmetic.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Fallback declared bounds are not a new measured envelope; missing bounds stay unsupported rather than fabricated.
 * @evidence contracts/common.md#meaningful-documentation Returned bounds are borrowed from the description and basis is model or world.
 * @evidence contracts/performance.md#efficient-algorithms Fixed discriminant/nullable field checks perform no mesh measurement.
 * @evidence contracts/performance.md#reuse-equivalent-work Existing compiled description bounds are reused without restaging or recomputing geometry.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the wrapper is new; referenced bounds live with the caller's resolved description.
 */
export function subjectInspectionInspectionFrame(
  description: AutoMovieSubjectReviewDescription
): subjectInspectionIInspectionFrame | null {
  if (description.kind === "formation") return null;
  const bounds: IAutoMovieSubjectBox | null = description.bounds.content ?? description.bounds.declared;
  return bounds === null
    ? null
    : { bounds, coordinateSpace: description.bounds.coordinateSpace };
}
