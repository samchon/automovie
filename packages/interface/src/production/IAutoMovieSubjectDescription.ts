import { IAutoMovieTransform } from "../geometry/IAutoMovieTransform";
import { AutoMovieSubjectKind } from "./AutoMovieSubjectKind";
import { IAutoMovieSubjectBounds } from "./IAutoMovieSubjectBounds";
import { IAutoMovieSubjectMaterial } from "./IAutoMovieSubjectMaterial";
import { IAutoMovieSubjectMemberSummary } from "./IAutoMovieSubjectMemberSummary";

/**
 * Renderer-independent answer to "what is this compiled subject?".
 *
 * @evidence requirements/review/subject-description-and-structural-change.md#review-subject-description Exposes stable identity, composition, placement, materials, membership, and extent without rendering.
 * @evidence specifications/review-and-acceptance/subject-description-and-structural-diff.md#review-system-subject-description-record Defines the portable compiled-subject description record.
 */
export interface IAutoMovieSubjectDescription {
  /**
   * Description schema version.
   *
   * @evidence requirements/review/subject-description-and-structural-change.md#review-subject-description Makes the portable answer version explicit.
   * @evidence specifications/review-and-acceptance/subject-description-and-structural-diff.md#review-system-subject-description-record Types the first description schema.
   */
  version: 1;
  /**
   * Revision of the compiled artifact that supplied this answer.
   *
   * @evidence requirements/review/subject-description-and-structural-change.md#review-subject-description Binds every answer to current compiled truth.
   * @evidence specifications/review-and-acceptance/subject-description-and-structural-diff.md#review-system-subject-description-record Carries the artifact revision correlation key.
   */
  revision: string;
  /**
   * Namespaced stable subject id.
   *
   * @evidence requirements/review/subject-description-and-structural-change.md#review-subject-description Gives the reviewer a durable subject address.
   * @evidence specifications/review-and-acceptance/subject-description-and-structural-diff.md#review-system-subject-description-record Follows the role-specific subject id namespace.
   */
  id: string;
  /**
   * Structural role of this subject.
   *
   * @evidence requirements/review/subject-description-and-structural-change.md#review-subject-description Distinguishes elements, parts, prototypes, instances, sets, and spaces.
   * @evidence specifications/review-and-acceptance/subject-description-and-structural-diff.md#review-system-subject-description-record Types the subject-role discriminator.
   */
  kind: AutoMovieSubjectKind;
  /**
   * Open compiled semantic label such as a building-element or space kind.
   *
   * @evidence requirements/review/subject-description-and-structural-change.md#review-subject-description Reports what the compiled subject represents without a closed catalogue.
   * @evidence specifications/review-and-acceptance/subject-description-and-structural-diff.md#review-system-subject-description-record Carries the source-owned semantic kind.
   */
  semanticKind: string;
  /**
   * Human-readable compiled name, or null when unnamed.
   *
   * @evidence requirements/review/subject-description-and-structural-change.md#review-subject-description Reports the subject's authored label without inventing one.
   * @evidence specifications/review-and-acceptance/subject-description-and-structural-diff.md#review-system-subject-description-record Carries the optional compiled display name.
   */
  name: string | null;
  /**
   * Reusable prototype subject used by this placement, or null.
   *
   * @evidence requirements/review/subject-description-and-structural-change.md#review-subject-description Preserves prototype identity separately from placement identity.
   * @evidence specifications/review-and-acceptance/subject-description-and-structural-diff.md#review-system-subject-description-record Links a placement to its reusable model or part subject.
   */
  prototype: string | null;
  /**
   * Placement subject represented by this record, or null for reusable data.
   *
   * @evidence requirements/review/subject-description-and-structural-change.md#review-subject-description Keeps placement identity explicit rather than collapsing it into a prototype.
   * @evidence specifications/review-and-acceptance/subject-description-and-structural-diff.md#review-system-subject-description-record Links placed subjects to their stable placement address.
   */
  placement: string | null;
  /**
   * Immediate owning subject, or null for a root subject.
   *
   * @evidence requirements/review/subject-description-and-structural-change.md#review-subject-description Reports inspectable ownership and composition.
   * @evidence specifications/review-and-acceptance/subject-description-and-structural-diff.md#review-system-subject-description-record Carries the owner link of the subject hierarchy.
   */
  owner: string | null;
  /**
   * Compiled runtime model id supplying geometry, or null.
   *
   * @evidence requirements/review/subject-description-and-structural-change.md#review-subject-description Identifies the compiled geometry source for prototype and placement subjects.
   * @evidence specifications/review-and-acceptance/subject-description-and-structural-diff.md#review-system-subject-description-record Carries the runtime model relation.
   */
  model: string | null;
  /**
   * Owning logical-space subject, or null.
   *
   * @evidence requirements/review/subject-description-and-structural-change.md#review-subject-description Reports the spatial membership of compiled placements.
   * @evidence specifications/review-and-acceptance/subject-description-and-structural-diff.md#review-system-subject-description-record Carries the explicit logical-space relation.
   */
  space: string | null;
  /**
   * Model- or world-placement transform when the subject has one, otherwise null.
   *
   * @evidence requirements/review/subject-description-and-structural-change.md#review-subject-description Reports the transform needed to judge subject placement.
   * @evidence specifications/review-and-acceptance/subject-description-and-structural-diff.md#review-system-subject-description-record Carries the compiled placement or part transform.
   */
  transform: IAutoMovieTransform | null;
  /**
   * Declared and measured spatial extent.
   *
   * @evidence requirements/review/subject-description-and-structural-change.md#review-subject-compiled-truth Makes compiled subject geometry measurable without rendering.
   * @evidence specifications/review-and-acceptance/subject-description-and-structural-diff.md#review-system-subject-description-bounds Carries coordinate-explicit declared and content boxes.
   */
  bounds: IAutoMovieSubjectBounds;
  /**
   * Code-unit-sorted materials directly used by the subject.
   *
   * @evidence requirements/review/subject-description-and-structural-change.md#review-subject-description Makes compiled material composition reviewable.
   * @evidence specifications/review-and-acceptance/subject-description-and-structural-diff.md#review-system-subject-description-record Projects material identity and name from compiled models.
   */
  materials: IAutoMovieSubjectMaterial[];
  /**
   * Exact member count and bounded stable-id sample.
   *
   * @evidence requirements/review/subject-description-and-structural-change.md#review-subject-description Reports composition without expanding large populations.
   * @evidence specifications/review-and-acceptance/subject-description-and-structural-diff.md#review-system-subject-description-record Carries deterministic bounded membership.
   */
  members: IAutoMovieSubjectMemberSummary;
}
