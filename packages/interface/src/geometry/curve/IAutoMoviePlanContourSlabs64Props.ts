import type { IAutoMovieContourLoft64 } from "./IAutoMovieContourLoft64";
import type { IAutoMoviePlanContourSlabs64Ring } from "./IAutoMoviePlanContourSlabs64Ring";
import type { IAutoMoviePreparedContourEvent64 } from "./IAutoMoviePreparedContourEvent64";

/**
 * Borrowed saved-section data for contour interval planning. The caller supplies
 * increasing cuts, aligned sampled ring lists and matching declared/prepared event
 * order from document preparation. Planning does not clone or mutate these inputs.
 *
 * @evidence contracts/development/design.md#principled-representation Millimetre cut coordinates address sections while local ring ordinals address incidence; parallel-array alignment remains a caller premise.
 * @evidence contracts/development/design.md#minimal-and-owned-surface planAutoMovieContourSlabs64 and admitAutoMovieContourIntervals64 share the same document view and optional explicit adjacency.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Present explicit intervals suppress inferred continuation even when incomplete; the optional field selects the existing legacy matching mode only when absent.
 * @evidence contracts/development/common.md#meaningful-documentation States borrowed lifetime, alignment requirements and absent versus empty interval behavior.
 */
export interface IAutoMoviePlanContourSlabs64Props {
  /** Retained saved cuts in increasing order, aligned one-to-one with rings. */
  slices: readonly {
    /** Physical saved cut coordinate in millimetres, used by exact equality for event/interval addressing. */
    y: number;
  }[];

  /** Borrowed sampled ring objects, first by cut and then by saved local loop ordinal. Unsupported rings remain in place so addresses do not shift. */
  rings: IAutoMoviePlanContourSlabs64Ring[][];

  /** Prepared event records aligned by index with declaredEvents; winding and saved brackets guide group assignment. */
  events: IAutoMoviePreparedContourEvent64[];

  /** Authored events retained after admission, aligned with events; explicit mode requires each bracket to address adjacent retained cuts. */
  declaredEvents: readonly IAutoMovieContourLoft64.IEvent[];

  /** Explicit adjacency when present, including an empty list. Missing/duplicate intervals then become unsupported work rather than inferred matches; undefined enables geometric same-winding correspondence. */
  intervals?: readonly IAutoMovieContourLoft64.IInterval[];
}
