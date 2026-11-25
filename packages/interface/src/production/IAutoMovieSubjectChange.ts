import type { AutoMovieSubjectKind } from "./AutoMovieSubjectKind";
import type { IAutoMovieSubjectDescription } from "./IAutoMovieSubjectDescription";
import type { IAutoMovieSubjectDiffFanout } from "./IAutoMovieSubjectDiffFanout";

/**
 * One stable subject entry in a structural diff category with aggregate
 * affected usage.
 */
export interface IAutoMovieSubjectChange {
  /** Stable subject id shared with the non-null description. */
  id: string;

  /** Structural kind of the changed subject. */
  kind: AutoMovieSubjectKind;

  /** Subject before the change, or null for an addition. */
  before: IAutoMovieSubjectDescription | null;

  /** Subject after the change, or null for a removal. */
  after: IAutoMovieSubjectDescription | null;

  /** Aggregate placements and selections affected by this record. */
  fanout: IAutoMovieSubjectDiffFanout;
}
