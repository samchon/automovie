import type { IAutoMovieHumanConstructionClearanceReading } from "./IAutoMovieHumanConstructionClearanceReading";
import type { IAutoMovieHumanConstructionFailure } from "./IAutoMovieHumanConstructionFailure";
import type { IAutoMovieHumanConstructionPartReading } from "./IAutoMovieHumanConstructionPartReading";

/**
 * Existing admission results attached to an actual coarse construction.
 * Rejected geometry remains available for explicit construction inspection;
 * it is not a committed or physiologically accepted authoring result.
 * Measuring owners also attach every relation and part they read, refused or
 * not. Acceptance records all original assertions and extraction failures;
 * the optional numerical readings supplement those outcomes.
 *
 * @evidence contracts/common.md#principled-implementation accepted records all original check outcomes while failures and optional complete readings preserve the constructed result's actual refusal causes.
 * @evidence contracts/common.md#clear-and-simple-design Admission separates acceptance, named failures, measured relations and per-part census without rebuilding rejected geometry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A rejected construction remains inspectable and optional readings cannot be interpreted as a complete anatomical or physiological admission.
 * @evidence contracts/common.md#meaningful-documentation Members distinguish assertions and extraction failures, passed and refused relations, and omission when no readings or census rows were collected.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Construction admission result shape is erased by TypeScript; its runtime consumer owns the actual geometry or measurement traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Construction admission result shape specifies caller data and performs no runtime recomputation or cache lookup.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Construction admission result shape acquires no runtime handle or retained cache; concrete array and map ownership belongs to its producing and consuming functions.
 *
 *
 * @author Samchon
 */
export interface IAutoMovieHumanConstructionAdmission {
  /** True only when every original assertion and supplied reading/census callback succeeded. */
  accepted: boolean;

  /** Every reported refusal collected without weakening its condition. */
  failures: IAutoMovieHumanConstructionFailure[];

  /** Collected spatial relations, including those that passed; omitted when no rows were collected. */
  clearances?: IAutoMovieHumanConstructionClearanceReading[];

  /** Collected constructed-part census; omitted when no rows were collected. */
  parts?: IAutoMovieHumanConstructionPartReading[];
}
