/**
 * One partition sound passes through on its way out of the room.
 *
 * Contributes `area * 10^(-transmissionLoss / 10)` to the area-weighted
 * composite transmittance in `analyzeAcoustics`. A negative loss is
 * refused, because a partition cannot transmit more energy than reaches it, and
 * a loss high enough to underflow every partition's transmittance to zero turns
 * the composite loss into a gap.
 */
export interface IAutoMovieAcousticPartition {
  /** Stable partition identity, unique among the request's partitions. */
  id: string;

  /** Area in m^2; finite and strictly positive. */
  area: number;

  /** Broadband sound reduction index in dB; finite, at or above zero. */
  transmissionLoss: number;
}
