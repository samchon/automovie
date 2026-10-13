/**
 *
 * One absorbing surface of a room.
 *
 * Contributes `area * absorption` to the Sabine absorption area. When every
 * surface absorbs nothing, or every surface absorbs completely, the room has no
 * finite diffuse field, and the reverberation time and room constant are
 * reported as gaps.
 *
 * @evidence contracts/common.md#principled-implementation Area and a broadband absorption coefficient are the summands of Sabine's `A = sum(S * alpha)` and of the area-weighted mean absorption the room constant uses.
 * @evidence contracts/common.md#clear-and-simple-design Carries no orientation or position, because the diffuse-field model depends only on the absorption total and the mean coefficient.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Coefficients of exactly 0 and 1 are accepted inputs whose all-surface extremes become gaps by the analyzer's stated diffuse-field rule, not by a tuned threshold.
 * @evidence contracts/common.md#meaningful-documentation States the absorption contribution, the inclusive coefficient range, the area unit, and the all-zero and all-one gap cases.
 * @evidenceExclude contracts/performance.md#cost-and-resources An input record summed in one linear pass for area and one for absorption. Folded into one study's absorption totals; nothing is cached per surface. An id and two numbers owned by the request for one acoustic study.
 * @author Samchon
 */
export interface IAutoMovieAcousticSurface {
  /** Stable surface identity, unique among the request's surfaces. */
  id: string;

  /** Area in m^2; finite and strictly positive. */
  area: number;

  /** Broadband Sabine absorption coefficient within `[0, 1]`, both ends included. */
  absorption: number;
}
