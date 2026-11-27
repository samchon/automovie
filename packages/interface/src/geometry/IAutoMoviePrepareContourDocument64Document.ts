import type { IAutoMovieContourLoft64 } from "./IAutoMovieContourLoft64";
import type { IAutoMoviePrepareContourDocument64Slice } from "./IAutoMoviePrepareContourDocument64Slice";
import type { IAutoMoviePreparedContourEvent64 } from "./IAutoMoviePreparedContourEvent64";

/**
 * Prepared saved-section document for one contour loft.
 * prepareContourDocument64 rejects nonpositive chord tolerance or
 * nonfinite/nonincreasing section coordinates before event admission. It
 * creates slice/event records, borrows curve declarations and clones terminal
 * point tuples. Addressable unsupported events remain local diagnostics.
 */
export interface IAutoMoviePrepareContourDocument64Document {
  /**
   * Events returned by admitContourEvents64, in admitted order; these
   * retain authored topology separately from mapped working incidence.
   */
  declaredEvents: IAutoMovieContourLoft64.IEvent[];
  /**
   * Increasing retained physical cuts. An empty cut is removed only when an
   * admitted supported event lies at that exact coordinate; other empty cuts
   * remain.
   */
  slices: IAutoMoviePrepareContourDocument64Slice[];
  /**
   * Mapped critical events aligned with declaredEvents, carrying millimetre
   * brackets, local loop incidence, copied terminal points and optional local
   * unsupported reasons.
   */
  events: IAutoMoviePreparedContourEvent64[];
}
