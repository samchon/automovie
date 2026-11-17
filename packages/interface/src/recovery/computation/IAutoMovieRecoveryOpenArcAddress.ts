/**
 * Address of one saved open arc in the section-report sequence.
 * section and arc are dimensionless ordinals; continuation preparation validates adjacency and each arc against the corresponding saved report.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Address of one saved open arc in the section-report sequence. section and arc are dimensionless ordinals; continuation preparation validates adjacency and each arc against the corresponding saved report.
 * @evidence contracts/development/design.md#principled-representation section and arc are dimensionless ordinals; continuation preparation validates adjacency and each arc against the corresponding saved report.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Local reconstruction and ordinary open-run preparation use the identical section/arc key semantics.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The address does not carry geometry or orientation and does not infer correspondence from neighboring array positions.
 */
export type IAutoMovieRecoveryOpenArcAddress = {
  /** Saved-section ordinal in the input observation sequence. */
  section: number;

  /** Open-arc ordinal in the addressed saved section's report. */
  arc: number;
};
