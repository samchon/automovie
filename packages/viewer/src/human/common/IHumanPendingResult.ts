/**
 * The settlement callbacks owned by one pending numerical request.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor-state Keeps each outstanding request's settlement distinct from later edits.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor Names the correlated promise settlement carried by the request owner.
 * @author Samchon
 */
export interface IHumanPendingResult<Output> {
  /** Publish this request's successful value. */
  resolve: (value: Output) => void;

  /** Refuse this request with its numerical or transport failure. */
  reject: (error: Error) => void;
}
