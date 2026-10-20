/**
 * One absorbing surface of a room.
 *
 * Contributes `area * absorption` to the Sabine absorption area. When every
 * surface absorbs nothing, or every surface absorbs completely, the room has no
 * finite diffuse field, and the reverberation time and room constant are
 * reported as gaps.
 *
 * @evidence contracts/common.md#principled-implementation Sabine absorption area is the sum of `area * alpha` over surfaces, and both extremes of the mean coefficient leave no finite diffuse field, which is why they become gaps rather than numbers.
 * @evidence contracts/common.md#clear-and-simple-design An id, an area and one broadband coefficient, matching the broadband Sabine model; no octave-band absorption is carried because the solver does not read it.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The anechoic extreme is reported as a gap even though Sabine's formula would return a finite decay there, instead of publishing a value the model does not justify.
 * @evidence contracts/common.md#meaningful-documentation States the contribution to the absorption area, both gap conditions, the m^2 unit, the closed `[0, 1]` coefficient range, and id uniqueness.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Input record; summing the absorption area is one reduction over surfaces inside `analyzeAutoMovieAcoustics`, answered there.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Read once for one study's absorption sums; no derived value is kept for another study.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources An id and two numbers held by the request for the duration of the call.
 */
export interface IAutoMovieAcousticSurface {
  /** Stable surface identity, unique among the request's surfaces. */
  id: string;

  /** Area in m^2; finite and strictly positive. */
  area: number;

  /** Broadband Sabine absorption coefficient within `[0, 1]`, both ends included. */
  absorption: number;
}
