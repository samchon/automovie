/**
 * One partition sound passes through on its way out of the room.
 *
 * Contributes `area * 10^(-transmissionLoss / 10)` to the area-weighted
 * composite transmittance in `analyzeAutoMovieAcoustics`. A negative loss is
 * refused, because a partition cannot transmit more energy than reaches it, and
 * a loss high enough to underflow every partition's transmittance to zero turns
 * the composite loss into a gap.
 *
 * @evidence contracts/development/design.md#principled-representation Composite transmission uses the area-weighted mean of the energy transmittance `10^(-R/10)` and converts back with `-10 log10`, the standard composite sound reduction index; it relies on broadband single-number indices, the only kind the request accepts.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Three fields, an id, an area and one broadband index, which is all the composite law reads; frequency bands are not modelled, so no band array is carried.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A loss that underflows every transmittance to zero is reported as a gap rather than replaced by a large finite number, and a negative loss, a transmittance above one, is refused instead of clamped.
 * @evidence contracts/development/common.md#meaningful-documentation States the contribution formula, that a negative loss is refused and why, the underflow gap, the m^2 and dB units, and the uniqueness of the id.
 */
export interface IAutoMovieAcousticPartition {
  /** Stable partition identity, unique among the request's partitions. */
  id: string;

  /** Area in m^2; finite and strictly positive. */
  area: number;

  /** Broadband sound reduction index in dB; finite, at or above zero. */
  transmissionLoss: number;
}
