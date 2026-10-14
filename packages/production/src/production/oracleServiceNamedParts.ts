import { IAutoMovieModel, type IAutoMovieModelPart } from "@automovie/interface";
import { compareCodeUnits } from "./contentIdentity";

/**
 * List sorted recipe part ids in a bounded refusal message.
 *
 * @evidence contracts/common.md#principled-implementation Code-unit sorting preserves stable part-name presentation and the first twenty names bound the displayed list.
 * @evidence contracts/common.md#clear-and-simple-design The full inventory remains in the model; only its diagnostic presentation is shortened.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Twenty is a message-length convention, not a geometry or catalogue limit, and imported-model refusal is handled by the caller.
 * @evidence contracts/common.md#meaningful-documentation Large lists append their omitted count rather than silently claiming the displayed prefix is complete.
 * @evidence contracts/performance.md#efficient-algorithms All P ids are collected/sorted in O(P log P) comparisons plus their text/output cost.
 * @evidence contracts/performance.md#reuse-equivalent-work One sorted id list supplies both the displayed prefix and omitted count, without cross-model caching.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary ids and returned diagnostic text are owned locally/caller respectively; the model is not retained.
 */
export function oracleServiceNamedParts(
  model: IAutoMovieModel
): string {
  const ids: string[] = model.parts.map((part: IAutoMovieModelPart) : string => part.id).sort(compareCodeUnits);
  return ids.length <= 20
    ? ids.join(", ")
    : `${ids.slice(0, 20).join(", ")}, and ${ids.length - 20} more`;
}
