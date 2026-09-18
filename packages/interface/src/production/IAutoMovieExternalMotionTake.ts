/**
 * One inspected animation take addressable inside an external motion asset.
 *
 * @evidence requirements/motion/external-motion-inputs.md#motion-external-source-basis Exposes exact takes so the user or authoring agent can choose one without filename inference.
 * @evidence specifications/interchange-and-adoption/media-inspection-boundaries.md#interchange-motion-inspection Carries inspected media facts without selecting a take.
 *
 * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-external-adoption-receipt Types `IAutoMovieExternalMotionTake` for the performance motion external adoption receipt system contract.
 * @author Samchon
 */
export interface IAutoMovieExternalMotionTake {
  /**
   * Stable take id within this asset record.
   *
   * @evidence requirements/motion/external-motion-inputs.md#motion-external-source-basis Makes each inspected source member independently selectable.
   * @evidence specifications/interchange-and-adoption/media-inspection-boundaries.md#interchange-motion-inspection Preserves source-order member identity without selecting it.
   *
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-external-adoption-receipt Types `id` for the performance motion external adoption receipt system contract.
   */
  id: string;
  /**
   * Zero-based glTF animation index.
   *
   * @evidence requirements/motion/external-motion-inputs.md#motion-external-source-basis Addresses the exact source animation rather than guessing by name.
   * @evidence specifications/interchange-and-adoption/media-inspection-boundaries.md#interchange-motion-inspection Reports the inspected container member address.
   *
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-external-adoption-receipt Types `animationIndex` for the performance motion external adoption receipt system contract.
   */
  animationIndex: number;
  /**
   * Source-authored animation name, or null when unnamed.
   *
   * @evidence requirements/motion/external-motion-inputs.md#motion-external-source-basis Retains source metadata without requiring it for identity.
   * @evidence specifications/interchange-and-adoption/media-inspection-boundaries.md#interchange-motion-inspection Distinguishes an unnamed member from an invented label.
   *
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-external-adoption-receipt Types `sourceName` for the performance motion external adoption receipt system contract.
   */
  sourceName: string | null;
  /**
   * Inspected finite duration in seconds.
   *
   * @evidence requirements/motion/external-motion-inputs.md#motion-external-source-basis Exposes the take's source time extent before adoption.
   * @evidence specifications/interchange-and-adoption/media-inspection-boundaries.md#interchange-motion-inspection Records inspected timing without conforming it.
   *
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-external-adoption-receipt Types `durationSeconds` for the performance motion external adoption receipt system contract.
   */
  durationSeconds: number;
}
