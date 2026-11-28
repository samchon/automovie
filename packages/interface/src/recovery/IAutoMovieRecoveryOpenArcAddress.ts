/** Address of one saved open curve within aligned section reports. */
export type IAutoMovieRecoveryOpenArcAddress = {
  /** Index of the saved station and its aligned observation report. */
  section: number;

  /** Index inside the addressed report's open fit array. */
  arc: number;
};
