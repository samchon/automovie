import type { IAutoMovieCameraIntent } from "@automovie/interface";

/**
 * Read the latest framing intent at the edited opening only when no new intent starts through the edited ending. An absent opening intent or an internal intent boundary returns null.
 *
 * @evidence contracts/common.md#principled-implementation A copied stable start-time sort selects the last intent beginning at or before start; a separate original-array scan rejects starts in (start,end]. Duplicate opening starts retain existing stable-sort last-entry behavior.
 * @evidence contracts/common.md#clear-and-simple-design The segment observer uses this one claim to compare both sampled boundaries; authored camera-intent shape and valid start/end seconds belong to upstream admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Two framing spans are not forced into one claim, and no missing intent is inferred from measured shot size. Starts equal to end count as an internal change, while starts equal to opening are eligible.
 * @evidence contracts/common.md#meaningful-documentation Documents seconds, interval endpoints, null meaning, borrowed framing value, sorted-copy preservation and duplicate-start behavior without promising independent intent validation.
 * @evidence contracts/performance.md#efficient-algorithms For I intents, copying/sorting costs O(I log I), filtering and boundary search cost O(I), and temporary storage is O(I). The original input order remains unchanged.
 * @evidence contracts/performance.md#reuse-equivalent-work One sorted copy supplies the opening claim for this placement; no sorted result is shared across mutable intent arrays or different placement intervals.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Copied/filtered arrays expire on return; only a framing union value or null escapes and no camera, resource handle, task or cross-call state is owned.
 */
export const filmGrammarDeclaredFraming: (intents: readonly IAutoMovieCameraIntent[], start: number, end: number) => IAutoMovieCameraIntent["framing"] | null = (
  intents: readonly IAutoMovieCameraIntent[],
  start: number,
  end: number,
): IAutoMovieCameraIntent["framing"] | null => {
  const covering: IAutoMovieCameraIntent[] = [...intents]
    .sort((left: IAutoMovieCameraIntent, right: IAutoMovieCameraIntent) : number => left.start - right.start)
    .filter((intent: IAutoMovieCameraIntent) : boolean => intent.start <= start);
  return covering.length === 0 ||
    intents.some((intent: IAutoMovieCameraIntent) : boolean => intent.start > start && intent.start <= end)
    ? null
    : covering[covering.length - 1]!.framing;
};
