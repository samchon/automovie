/**
 * Compare two strings by UTF-16 code unit.
 *
 * `Array.prototype.sort` without a comparator, and every locale-aware
 * comparison, order differently on different hosts. Evidence that reorders
 * itself by operating-system language is not evidence.
 *
 * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-canonical-fingerprint Orders render identity inputs by code unit so locale cannot alter their canonical fingerprint.
 * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity Provides the platform-independent identifier ordering used before render evidence is digested.
 */
export const compareAutoMovieRenderIds = (
  left: string,
  right: string,
): number => (left < right ? -1 : left > right ? 1 : 0);
