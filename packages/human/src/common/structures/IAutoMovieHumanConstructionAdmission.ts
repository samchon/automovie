import type { IAutoMovieHumanConstructionClearanceReading } from "./IAutoMovieHumanConstructionClearanceReading";
import type { IAutoMovieHumanConstructionFailure } from "./IAutoMovieHumanConstructionFailure";
import type { IAutoMovieHumanConstructionPartReading } from "./IAutoMovieHumanConstructionPartReading";

/**
 * Existing admission results attached to an actual coarse construction.
 * Rejected geometry remains available for explicit construction inspection;
 * it is not a committed or physiologically accepted authoring result.
 * Measuring owners also attach every relation and part they read, refused or
 * not, so acceptance is a statement about reported numbers.
 *
 * @evidence contracts/common.md#principled-implementation Acceptance requires an empty population of original named failures.
 * @evidence contracts/common.md#clear-and-simple-design A boolean and complete failure population separate construction from admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Rejected construction stays rejected rather than becoming an accepted editor state.
 * @evidence contracts/common.md#meaningful-documentation States inspectability and the accepted-publication boundary.
 */
export interface IAutoMovieHumanConstructionAdmission {
  /** True only when every original admission check succeeded. */
  accepted: boolean;

  /** Every reported refusal collected without weakening its condition. */
  failures: IAutoMovieHumanConstructionFailure[];

  /** Every spatial relation a measuring owner read, including those that passed; omitted when no owner measures. */
  clearances?: IAutoMovieHumanConstructionClearanceReading[];

  /** Census of each constructed part; omitted when no owner takes one. */
  parts?: IAutoMovieHumanConstructionPartReading[];
}
