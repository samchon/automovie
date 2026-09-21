/**
 * Compatibility characterization retained separately from the user decision.
 *
 * @evidence requirements/motion/external-motion-inputs.md#motion-external-compatibility-override Requires source-target findings to stay distinct from user overrides.
 * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-external-adoption-receipt Types the compatibility characterization sealed beside the selected mapping.
 * @author Samchon
 */
export interface IAutoMovieExternalMotionReceiptCharacterization {
  /**
   * Overall result of source-to-target compatibility analysis.
   *
   * @evidence requirements/motion/external-motion-inputs.md#motion-external-compatibility-override Requires target compatibility to be inspected before adoption.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-external-adoption-receipt Keeps failed compatibility distinct from an authorized risky adoption.
   */
  status: "compatible" | "override-required" | "incompatible";

  /**
   * Deterministically ordered source-to-target compatibility findings.
   *
   * @evidence requirements/motion/external-motion-inputs.md#motion-external-compatibility-override Requires control, range, scale, contact, event, and unsupported-channel findings.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-external-adoption-receipt Preserves the system findings independently of the chosen mapping and overrides.
   */
  findings: string[];
}
