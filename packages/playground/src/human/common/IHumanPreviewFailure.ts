/**
 * A disposable preview worker's refusal without artifact bytes.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor-state Reports the refusal while leaving the caller's committed preview untouched.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor Distinguishes refusal from the artifact decoding alternative.
 * @author Samchon
 */
export interface IHumanPreviewFailure {
  /** Refusal discriminator. */
  success: false;

  /** Numerical or transport cause reported by the worker. */
  error: string;
}
