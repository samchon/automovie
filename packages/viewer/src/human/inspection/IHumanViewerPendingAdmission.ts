/**
 * One source-aware document verdict awaited from the resident numerical worker.
 * It carries no model and creates no numerical cache entry.
 *
 * @author Samchon
 */
export interface IHumanViewerPendingAdmission {
  /** Null is admitted; a string is the domain owner's original refusal. */
  resolve: (reason: string | null) => void;

  /** Source or worker transport could not supply a verdict. */
  reject: (error: Error) => void;
}
