import type { IAutoMovieContourLoft64 } from "./IAutoMovieContourLoft64";
import type { IAutoMoviePreparedContourEvent64 } from "./IAutoMoviePreparedContourEvent64";
import type { IAutoMoviePrepareContourDocument64Slice } from "./IAutoMoviePrepareContourDocument64Slice";
/**
 * Prepared saved-section document for one contour loft. prepareAutoMovieContourDocument64 rejects nonpositive chord tolerance or nonfinite/nonincreasing section coordinates before event admission. It creates slice/event records, borrows curve declarations and clones terminal point tuples. Addressable unsupported events remain local diagnostics.
 *
 * @evidence contracts/development/design.md#principled-representation Saved cuts, declared events and prepared incidence remain separate because empty supported terminal cuts may be removed from the working section list.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One document supplies loft planning and sampling; original generating curves retain their canonical owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Missing topology is not inferred from coordinate proximity and unsupported event records remain explicit.
 * @evidence contracts/development/common.md#meaningful-documentation States admission, retained source references, terminal copies and local unsupported behavior.
 */
export interface IAutoMoviePrepareContourDocument64Document {
  /** Events returned by admitAutoMovieContourEvents64, in admitted order; these retain authored topology separately from mapped working incidence. */
  declaredEvents: IAutoMovieContourLoft64.IEvent[];
  /** Increasing retained physical cuts. An empty cut is removed only when an admitted supported event lies at that exact coordinate; other empty cuts remain. */
  slices: IAutoMoviePrepareContourDocument64Slice[];
  /** Mapped critical events aligned with declaredEvents, carrying millimetre brackets, local loop incidence, copied terminal points and optional local unsupported reasons. */
  events: IAutoMoviePreparedContourEvent64[];
}
