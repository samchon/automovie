/**
 * One named studio light's requested direction in the display frame.
 * The viewport owns validation and restores other lights before publication.
 *
 * @author Samchon
 * @evidence contracts/common.md#principled-implementation Names one existing studio light and a Y-up/Z-forward vector from origin toward its display position; the viewport requires a finite nonzero representable norm and preserves original light distance, so magnitude is not a physical power or placement request.
 * @evidence contracts/common.md#clear-and-simple-design Carries only the caller's display direction request; viewport registry/validation/restoration owns native light mutation and numerical documents carry none of it.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Name resolves an actual studio role rather than an anatomical fixture; no clipping, geometry or solver fields compensate for lighting ambiguity.
 * @evidence contracts/common.md#meaningful-documentation States existing-name selection, dimensionless direction/frame and display-only validation responsibility, including current representable-norm limitation.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This request shape runs no vector normalization or studio-light traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work It represents one request without a retained direction cache or event coordinator.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources String and three scalars own no light, geometry, numerical worker or task.
 */
export interface IConnectedBodyInspectionLightDirection {
  /** Existing named studio light. */
  name: string;

  /** Dimensionless direction from the origin, Y up and Z forward. */
  direction: readonly [number, number, number];
}
