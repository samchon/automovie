/**
 * A disposable preview worker's refusal without artifact bytes.
 *
 * @author Samchon
 */
export interface IHumanPreviewFailure {
  /** Refusal discriminator. */
  success: false;

  /** Numerical or transport cause reported by the worker. */
  error: string;
}
