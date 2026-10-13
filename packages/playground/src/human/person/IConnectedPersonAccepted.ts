/**
 * The accepted person the status line names: the committed document's display
 * name and its model's material region count.
 *
 * @author Samchon
 */
export interface IConnectedPersonAccepted {
  /** Display name of the committed document. */
  name: string;

  /** Material regions of the committed model. */
  parts: number;
}
