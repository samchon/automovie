import type { IHumanConstructionCheck } from "../../common/basis/IHumanConstructionCheck";
import type { IAutoMovieHumanFaceConstruction } from "../structures/IAutoMovieHumanFaceConstruction";
import type { IAutoMovieHumanFacePeriocularMappingReport } from "../structures/IAutoMovieHumanFacePeriocularMappingReport";

/** One owned geometry stage whose original admission and publication remain separate.
 *
 * @evidence contracts/common.md#principled-implementation One completed geometry and its original condition population feed both admitted build and explicit draft construction; createHumanFaceConstructionEntries runs the same checks before its chosen result boundary.
 * @evidence contracts/common.md#clear-and-simple-design Geometry, checks, success-only publication and optional mapping observation have separate members instead of rebuilding a weaker inspection product.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Draft inspection retains named failures and measurements without success publication; optional mappings do not replace actual admission or GPU proof.
 * @evidence contracts/common.md#meaningful-documentation Members state preadmission geometry, original checks, success-only side effects and explicit mapping observation.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This record runs no checks; the stage producer and construction entries own their costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type schedules no work; each entry consumes the same stage's exact geometry/check population.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type acquires no resource; stage closures and geometry belong to the current build until its consumer releases them.
 *
 * @author Samchon
 */
export interface IHumanFaceConstructionStage {
  /** Complete geometry and original source correspondence before admission. */
  value: Omit<IAutoMovieHumanFaceConstruction, "admission">;

  /** Original physical and requested measurement conditions on this geometry. */
  checks: readonly IHumanConstructionCheck[];

  /**
   * Publish this stage's existing success-only observers after admission.
   * Explicit construction inspection leaves them uncalled.
   *
   * @evidence contracts/common.md#principled-implementation createHumanFaceConstructionEntries invokes this callback only after the complete original check population accepts the owned stage.
   * @evidence contracts/common.md#clear-and-simple-design Publication remains a separate stage-owned side effect rather than part of draft geometry or individual checks.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Refused builds and draft inspection do not publish success; callback exceptions propagate without weakening the original condition population.
   * @evidence contracts/common.md#meaningful-documentation The comment identifies success-only timing and the explicit inspection omission.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This signature implements no observer work; the stage's actual publisher owns its costs.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This signature schedules no calls; the admitted build entry owns exactly this stage's publication.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This signature acquires no resource; the stage owns captured observer state and lifetime.
   */
  publish: () => void;

  /**
   * Read this stage's optional mapping observations for explicit inspection.
   * Absence supplies no mapping report; ordinary admitted builds do not call it.
   *
   * @evidence contracts/common.md#principled-implementation The construction entry reads optional producer mapping observations from the same completed stage after its original admission verdict.
   * @evidence contracts/common.md#clear-and-simple-design Mapping inspection has one optional callback independent of model publication and acceptance conditions.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing callbacks produce no invented report, and mapping observations never replace geometry/contact admission or real GPU judgment.
   * @evidence contracts/common.md#meaningful-documentation The comment gives explicit-inspection timing, ordinary-build omission and absent-state meaning.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This signature implements no mapping traversal; the stage's producer owns report cost.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This signature coordinates no requests; the stage retains its exact geometry/mapping provenance for the inspector.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This signature acquires no handle; its producer owns captured mapping data and returned reports.
   */
  readMappings?: () => IAutoMovieHumanFacePeriocularMappingReport[];
}
