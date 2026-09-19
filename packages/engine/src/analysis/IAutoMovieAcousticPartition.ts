/**
 * One partition sound passes through on its way out of the room.
 *
 * @evidence requirements/interior/acoustics-and-sound-boundaries.md#interior-acoustic-analysis-boundary `IAutoMovieAcousticPartition` captures one area-weighted path through the room boundary for composite isolation reporting.
 * @evidence specifications/interior-space/lighting-acoustics-and-environment.md#interior-space-acoustic-boundary-scenario The partition record provides the area and reduction index needed to combine transmission coefficients across the scenario boundary.
 */
export interface IAutoMovieAcousticPartition {
  /**
   * Stable partition identity within the request.
   *
   * @evidence requirements/interior/acoustics-and-sound-boundaries.md#interior-acoustic-analysis-boundary The partition `id` lets an isolation result identify the authored boundary element it evaluates.
   * @evidence specifications/interior-space/lighting-acoustics-and-environment.md#interior-space-acoustic-boundary-scenario This stable key distinguishes each transmission path before their coefficients are combined.
   */
  id: string;
  /**
   * Area in m^2; strictly positive.
   *
   * @evidence requirements/interior/acoustics-and-sound-boundaries.md#interior-acoustic-analysis-boundary Partition `area` declares the extent over which sound transmission is aggregated.
   * @evidence specifications/interior-space/lighting-acoustics-and-environment.md#interior-space-acoustic-boundary-scenario The area weights this partition's linear transmission coefficient in the composite reduction index.
   */
  area: number;
  /**
   * Sound reduction index in dB; finite.
   *
   * @evidence requirements/interior/acoustics-and-sound-boundaries.md#interior-acoustic-analysis-boundary `transmissionLoss` declares the broadband sound reduction assigned to this partition.
   * @evidence specifications/interior-space/lighting-acoustics-and-environment.md#interior-space-acoustic-boundary-scenario The decibel input is converted to a linear transmission coefficient before area-weighted composition.
   */
  transmissionLoss: number;
}
