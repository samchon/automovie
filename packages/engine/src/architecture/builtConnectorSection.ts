import {
  IAutoMovieBuiltConnector,
  IAutoMovieConnectorSection,
} from "@automovie/interface";

import { IAutoMovieConnectorSectionAt } from "./IAutoMovieConnectorSectionAt";

/**
 * The usable section of one connector record, or null when it states none.
 *
 * This is the record-addressed form {@link builtConnectorSectionAt} answers
 * through. A caller already holding the record reads it here rather than
 * resolving an id a second time, because a work carrying two connectors under
 * one id would otherwise be sectioned against whichever one was declared first,
 * a contradiction validation refuses by name and one this function has no
 * business re-deciding. The route parameter is not range-checked here; the
 * id-addressed form owns that guard.
 *
 * A connector without `sections` answers its constant `width` and
 * `clearHeight`, or null when either is absent. A varying section is read as
 * linear between the two stations bracketing the fraction. Past the last
 * station it holds that station's values, and before the first it extends the
 * first segment's line, which validation rules out by starting stations at
 * `0`. Widths and clear heights are in metres.
 *
 * @evidence contracts/common.md#principled-implementation Piecewise-linear interpolation between the last station at or before the fraction and the next one, which is the function validation's strictly increasing stations from `0` to `1` describe; a zero span reads the earlier station rather than dividing by zero.
 * @evidence contracts/common.md#clear-and-simple-design The record-addressed core that the id-addressed `builtConnectorSectionAt` and callers already holding the record share, so the interpolation rule has one owner and the range guard stays with the id form.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no connector; a connector stating no section answers null for the caller to refuse instead of a default width, and a fraction outside the stations is answered by the stated hold and extension rules rather than refused here, because the id form owns the range guard.
 * @evidence contracts/common.md#meaningful-documentation States why the record-addressed form exists, that the fraction is unchecked here, the constant and null answers, the interpolation and its behaviour beyond the end stations, and the metre units.
 * @evidence contracts/performance.md#efficient-algorithms O(S) worst-case time for S section stations, with a forward bracket scan and constant interpolation work. Each caller's repeated samples pay this scan separately; a constant section takes O(1).
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure function of one record and one fraction that coordinates no work across calls.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing; the caller owns the returned two-number section.
 */
export const builtConnectorSection: (connector: IAutoMovieBuiltConnector, at: number) => IAutoMovieConnectorSectionAt | null = (
  connector: IAutoMovieBuiltConnector,
  at: number,
): IAutoMovieConnectorSectionAt | null => {
  const sections: readonly IAutoMovieConnectorSection[] =
    connector.sections ?? [];
  if (sections.length === 0)
    return connector.width === undefined || connector.clearHeight === undefined
      ? null
      : { width: connector.width, clearHeight: connector.clearHeight };
  let index: number = 0;
  while (index + 1 < sections.length && sections[index + 1]!.at <= at)
    index += 1;
  const from: IAutoMovieConnectorSection = sections[index]!;
  const to: IAutoMovieConnectorSection = sections[index + 1] ?? from;
  const span: number = to.at - from.at;
  const ratio: number = span <= 0 ? 0 : (at - from.at) / span;
  return {
    width: from.width + (to.width - from.width) * ratio,
    clearHeight: from.clearHeight + (to.clearHeight - from.clearHeight) * ratio,
  };
};
