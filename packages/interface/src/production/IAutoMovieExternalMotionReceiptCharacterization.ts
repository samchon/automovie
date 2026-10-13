/**
 * Compatibility characterization retained separately from the user decision.
 *
 * @author Samchon
 */
export interface IAutoMovieExternalMotionReceiptCharacterization {
  /** Overall result of source-to-target compatibility analysis. */
  status: "compatible" | "override-required" | "incompatible";

  /** Deterministically ordered source-to-target compatibility findings. */
  findings: string[];
}
