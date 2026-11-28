import type { IAutoMoviePreparedContourEvent64 } from "./IAutoMoviePreparedContourEvent64";

/**
 * One connected incidence group over adjacent saved cuts. The group owns its
 * local ring index arrays and borrows prepared critical events. Later boundary
 * preparation can attach its refusal to the same object.
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
   * Prepared event objects assigned from the document. Empty identifies a
   * candidate for ordinary continuation; subsequent stages qualify it.
   */
  critical: IAutoMoviePreparedContourEvent64[];

  /**
   * Local reason to skip surface generation. Absent means this planning stage
   * found no reason; later sampling/boundary stages may still reject the
   * group.
   */
  unsupported?: string;
}
