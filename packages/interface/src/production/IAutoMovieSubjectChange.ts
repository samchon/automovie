import { AutoMovieSubjectKind } from "./AutoMovieSubjectKind";
import { IAutoMovieSubjectDescription } from "./IAutoMovieSubjectDescription";
import { IAutoMovieSubjectDiffFanout } from "./IAutoMovieSubjectDiffFanout";

/**
 * One stable subject entry in a structural diff category with aggregate affected usage.
 *
 * @evidence contracts/common.md#principled-implementation Stable subject identity pairs before and after descriptions; addition has only after, removal only before, and common placement or shape changes retain both alongside independently derived fanout counts.
 * @evidence contracts/common.md#clear-and-simple-design One change record serves all structural categories while the containing diff defines the category, avoiding a dense per-instance change array for prototype consequences.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A common subject can appear in both moved and reshaped categories when both responsibilities changed; null is reserved for absence rather than failed measurement disguised as deletion.
 * @evidence contracts/common.md#meaningful-documentation Defines stable id and kind, addition/removal null semantics and aggregate placement/selection consequences.
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
