import {
  IAutoMovieBuiltConnector,
  IAutoMovieConnectorSection,
  type IAutoMovieConnectorSectionAt,
} from "@automovie/interface";

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
 * first segment's line, which validation rules out by starting stations at `0`.
 * Widths and clear heights are in metres.
 */
export function builtConnectorSection(
  connector: IAutoMovieBuiltConnector,
  at: number,
): IAutoMovieConnectorSectionAt | null {
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
}
