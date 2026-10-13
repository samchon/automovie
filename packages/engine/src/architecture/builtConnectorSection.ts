import { IAutoMovieBuiltConnector } from "@automovie/interface";

import { IAutoMovieConnectorSectionAt } from "./IAutoMovieConnectorSectionAt";

/**
 * The usable section of one connector record, or null when it states none.
 *
 * This is the record-addressed form {@link builtConnectorSectionAt} answers
 * through. A caller already holding the record reads it here rather than
 * resolving an id a second time, because a work carrying two connectors under
 * one id would otherwise be sectioned against whichever one was declared first
 * — a contradiction validation refuses by name, and one this function has no
 * business re-deciding. The route parameter is not range-checked here; the
 * id-addressed form owns that guard.
 *
 * A varying section is read as linear between the two stations bracketing the
 * fraction; widths and clear heights are in metres.
 *
 * @evidence contracts/common.md#principled-implementation Returns the constant pair directly, or walks the stations ordered by `at` to the last one at or before the fraction and interpolates width and clear height linearly to the next; the contract's stations at `0` and `1` mean no extrapolation happens for an in-range fraction.
 * @evidence contracts/common.md#clear-and-simple-design The record-addressed half of a pair, separate from `builtConnectorSectionAt`, so a record holder such as `propBlockedPassages` never resolves an id that could name two connectors.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A connector stating neither spelling returns null instead of an invented section, and the `[0, 1]` range check is left to the id-addressed form that owns it rather than duplicated.
 * @evidence contracts/common.md#meaningful-documentation States its relation to the id-addressed form, why it takes the record, that the fraction is not range-checked here, the linear reading between stations, the metre unit, and that null means no section is stated.
 * @evidence contracts/performance.md#cost-and-resources A linear walk over the station list to find the bracketing pair, `O(S)` in stations, chosen over a binary search for a hand-authored list; it caches nothing and allocates only the returned pair.
 */
export const builtConnectorSection = (
  connector: IAutoMovieBuiltConnector,
  at: number,
): IAutoMovieConnectorSectionAt | null => {
  const sections = connector.sections ?? [];
  if (sections.length === 0)
    return connector.width === undefined || connector.clearHeight === undefined
      ? null
      : { width: connector.width, clearHeight: connector.clearHeight };
  let index = 0;
  while (index + 1 < sections.length && sections[index + 1]!.at <= at)
    index += 1;
  const from = sections[index]!;
  const to = sections[index + 1] ?? from;
  const span = to.at - from.at;
  const ratio = span <= 0 ? 0 : (at - from.at) / span;
  return {
    width: from.width + (to.width - from.width) * ratio,
    clearHeight: from.clearHeight + (to.clearHeight - from.clearHeight) * ratio,
  };
};
