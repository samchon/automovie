import type { IHumanSourceHeadGuide } from "../../structures/IHumanSourceHeadGuide.ts";

/** Native source-semantic witnesses derived from a pinned licensed head.
 * No source witness acquires clinical anatomical landmark meaning here.
 * @author Samchon
 */
export interface IHumanHeadSourceGuide extends IHumanSourceHeadGuide {
  /** Historical native correspondence generation, retained unchanged. */
  basis: string;

  /** Complete ancestral native point population. */
  originalNativeCount: number;

  /** Native IDs belonging to the source head, used for its chart extents. */
  headNativeIds: number[];

  /** Authored most-anterior support present on the nasal exterior guide. */
  nasalTipNativeSupport?: number;
}
