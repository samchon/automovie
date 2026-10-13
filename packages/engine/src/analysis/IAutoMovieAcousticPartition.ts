/** One partition sound passes through on its way out of the room. */
export interface IAutoMovieAcousticPartition {
  /** Stable partition identity within the request. */
  id: string;
  /** Area in m^2; strictly positive. */
  area: number;
  /** Sound reduction index in dB; finite. */
  transmissionLoss: number;
}
