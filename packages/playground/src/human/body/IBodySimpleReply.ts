/**
 * The simple body runtime's result or refusal for one correlated operation.
 *
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
