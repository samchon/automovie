/**
 * Address of one saved open arc in the section-report sequence. section and arc
 * are dimensionless ordinals; continuation preparation validates adjacency and
 * each arc against the corresponding saved report.
 */
export type IAutoMovieRecoveryOpenArcAddress = {
  /** Saved-section ordinal in the input observation sequence. */
  section: number;

  /** Open-arc ordinal in the addressed saved section's report. */
  arc: number;
};
