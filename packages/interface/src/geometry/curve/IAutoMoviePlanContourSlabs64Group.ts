import type { IAutoMoviePreparedContourEvent64 } from "./IAutoMoviePreparedContourEvent64";

/**
 * One connected lower/upper ring group in a planned saved-section interval.
 * Plans own the index arrays but borrow prepared critical-event records. Later
 * boundary preparation may add an unsupported reason to this same object.
 */
export interface IAutoMoviePlanContourSlabs64Group {
  /**
   * Local ring ordinals in rings[k-1], in retained group order; may be empty
   * for a minimum or an unresolved event.
   */
  a: number[];

  /**
   * Local ring ordinals in rings[k]; may be empty for a maximum or an
   * unresolved event.
   */
  b: number[];

  /**
   * Prepared events assigned to this group, borrowed from the document. Empty
   * identifies an ordinary continuation candidate, not proof that it is
   * supported.
   */
  critical: IAutoMoviePreparedContourEvent64[];

  /**
   * Local reason to skip surface generation. Absent means this planning stage
   * found no reason; later sampling/boundary stages may still reject the
   * group.
   */
  unsupported?: string;
}
