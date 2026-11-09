import { IAutoMovieFormationSubjectReviewDescription } from "./IAutoMovieFormationSubjectReviewDescription";
import { IAutoMovieSubjectDescription } from "./IAutoMovieSubjectDescription";

/**
 * Compiled description accepted by the subject-review unit.
 *
 * @evidence contracts/development/design.md#principled-representation Subject review accepts either ordinary compiled geometry ownership or a compact formation description, preserving the distinct population representation instead of expanding a formation into fabricated per-slot scene subjects.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The union reuses the existing geometry and formation description types, so the review unit shares its receipt structure without duplicating either description's members.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Formation review remains grounded in its compiled bounds and representative population facts rather than pretending the entire mass is one ordinary model instance.
 * @evidence contracts/development/common.md#meaningful-documentation States the two compiled description families accepted by subject review and delegates their detailed ownership and units to their respective records.
 */
export type AutoMovieSubjectReviewDescription =
  | IAutoMovieSubjectDescription
  | IAutoMovieFormationSubjectReviewDescription;
