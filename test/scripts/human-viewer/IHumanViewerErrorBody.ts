/**
 * The JSON body of a refused viewer request.
 *
 * @evidence contracts/common.md#meaningful-documentation Names the refusal reason clients relay.
 * @author Samchon
 */
export interface IHumanViewerErrorBody {
  /** Why the server refused. */
  error: string;
}
