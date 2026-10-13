/**
 *
 * One partition sound passes through on its way out of the room.
 *
 * Contributes `area * 10^(-transmissionLoss / 10)` to the area-weighted
 * composite transmittance in `analyzeAutoMovieAcoustics`. Any finite loss is
 * accepted, a negative one included, and a loss high enough to underflow every
 * partition's transmittance to zero turns the composite loss into a gap.
 *
 * @evidence contracts/common.md#principled-implementation Area and a broadband sound reduction index are the two inputs of the area-weighted transmission coefficient `tau = 10^(-R/10)` that the composite loss sums.
 * @evidence contracts/common.md#clear-and-simple-design Three fields with no frequency bands, matching the broadband solver, and no position, because composite loss does not depend on where a panel sits.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Validation refuses a blank or repeated id, a non-positive area and a non-finite loss; a negative loss passes and yields a transmission coefficient above one, which is physically meaningless and not refused.
 * @evidence contracts/common.md#meaningful-documentation States the transmittance contribution, the units, that negative losses are accepted, and the underflow-to-gap case.
 * @evidenceExclude contracts/performance.md#cost-and-resources An input record read once for the transmittance sum and once for the settings text. Read by one acoustic study and digested into its settings; no result is cached against a partition. An id and two numbers owned by the request for the duration of one study.
 * @author Samchon
 */
export interface IAutoMovieAcousticPartition {
  /** Stable partition identity, unique among the request's partitions. */
  id: string;

  /** Area in m^2; finite and strictly positive. */
  area: number;

  /** Broadband sound reduction index in dB; any finite value. */
  transmissionLoss: number;
}
