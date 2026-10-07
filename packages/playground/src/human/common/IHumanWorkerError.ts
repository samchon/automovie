/**
 * A normalized native worker failure delivered to the request owner.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor-state Supplies a readable cause while the editor retains its committed result.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor Carries the native transport failure after message normalization.
 * @author Samchon
 */
export interface IHumanWorkerError {
  /** Available native failure reason, or the transport's domain fallback. */
  message: string;
}
