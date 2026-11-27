/*
 * Compare two strings by UTF-16 code unit.
 *
 * Relational comparison uses the same code-unit order as the native default
 * string sort, without locale collation. This named comparator also applies
 * that order to ids extracted from records on every host.
 */
export function compareAutoMovieRenderIds(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}
