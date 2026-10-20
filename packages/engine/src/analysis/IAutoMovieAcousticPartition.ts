/**
 * One partition sound passes through on its way out of the room.
 *
 * Contributes `area * 10^(-transmissionLoss / 10)` to the area-weighted
 * composite transmittance in `analyzeAutoMovieAcoustics`. A negative loss is
 * refused, because a partition cannot transmit more energy than reaches it, and
 * a loss high enough to underflow every partition's transmittance to zero turns
 * the composite loss into a gap.
 *
 * @evidence contracts/common.md#principled-implementation Composite transmission uses the area-weighted mean of the energy transmittance `10^(-R/10)` and converts back with `-10 log10`, the standard composite sound reduction index; it relies on broadband single-number indices, the only kind the request accepts.
 * @evidence contracts/common.md#clear-and-simple-design Three fields, an id, an area and one broadband index, which is all the composite law reads; frequency bands are not modelled, so no band array is carried.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A loss that underflows every transmittance to zero is reported as a gap rather than replaced by a large finite number, and a negative loss, a transmittance above one, is refused instead of clamped.
 * @evidence contracts/common.md#meaningful-documentation States the contribution formula, that a negative loss is refused and why, the underflow gap, the m^2 and dB units, and the uniqueness of the id.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Input record; the composite is one reduction over the partitions inside `analyzeAutoMovieAcoustics`, answered there.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Read once per acoustic study; the type carries no result that a later study could reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Two numbers and an id owned by the request; the analysis copies them into the settings digest and keeps no reference.
 */
export interface IAutoMovieAcousticPartition {
  /** Stable partition identity, unique among the request's partitions. */
  id: string;

  /** Area in m^2; finite and strictly positive. */
  area: number;

  /** Broadband sound reduction index in dB; finite, at or above zero. */
  transmissionLoss: number;
}
