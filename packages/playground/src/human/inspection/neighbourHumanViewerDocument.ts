/**
 * The document one step from the current one in a list, wrapping at both
 * ends. A current document that is not in the list gives the first (or, when
 * stepping back, the last) so the previous and next buttons always move. An
 * empty list refuses.
 */
export function neighbourHumanViewerDocument(
  ids: readonly string[],
  current: string,
  step: 1 | -1,
): string {
  if (ids.length === 0) throw new Error("There is no document to step through");
  const index = ids.indexOf(current);
  if (index < 0) return step === 1 ? ids[0]! : ids[ids.length - 1]!;
  return ids[(index + step + ids.length) % ids.length]!;
}
