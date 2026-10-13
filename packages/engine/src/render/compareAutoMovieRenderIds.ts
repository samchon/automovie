/**
 * Compare two strings by UTF-16 code unit.
 *
 * `Array.prototype.sort` without a comparator, and every locale-aware
 * comparison, order differently on different hosts. Evidence that reorders
 * itself by operating-system language is not evidence.
 */
export const compareAutoMovieRenderIds = (
  left: string,
  right: string,
): number => (left < right ? -1 : left > right ? 1 : 0);
