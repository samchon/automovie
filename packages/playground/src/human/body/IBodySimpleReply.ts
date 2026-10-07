/**
 * The simple body runtime's result or refusal for one correlated operation.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Associates a numerical result or refusal with the requested body operation.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor Preserves the existing simple worker's optional result and error protocol.
 * @author Samchon
 */
export interface IBodySimpleReply {
  /** Original operation's correlation identity. */
  id: number;

  /** Numerical result; the operation-specific caller owns its type. */
  result?: unknown;

  /** Reported numerical refusal; omission leaves the result alternative. */
  error?: string;
}
