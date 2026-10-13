import { IAutoMovieVisualChange } from "./IAutoMovieVisualChange";
import { IAutoMovieVisualChangeCounts } from "./IAutoMovieVisualChangeCounts";

/**
 * Deterministic visual progress report between two revision snapshots.
 *
 * @author Samchon
 */
export interface IAutoMovieVisualChangeReport {
  /** Report schema version. */
  version: 1;

  /** Shared catalog identity. */
  catalog: string;

  /** Earlier revision identity. */
  fromRevision: string;

  /** Later revision identity. */
  toRevision: string;

  /** Exact totals for the four states. */
  counts: IAutoMovieVisualChangeCounts;

  /** Complete code-unit-sorted visual comparison. */
  views: IAutoMovieVisualChange[];
}
