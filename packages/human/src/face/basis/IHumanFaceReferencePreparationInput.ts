import type { IAutoMovieHumanFaceBasis } from "../structures/IAutoMovieHumanFaceBasis";
import type { IHumanFaceNativePose } from "./IHumanFaceNativePose";
import type { IHumanFacePoseGeometry } from "./IHumanFacePoseGeometry";
import type { humanFaceBasisWeights } from "./humanFaceBasisWeights";

/** Inputs to the shared source reference stage, independent of generated assemblies.
 *
 * @evidence contracts/common.md#principled-implementation Actual admitted source, current channel state and numerical geometry feed the same reference stage as assembly; an existing native stage preserves exact source/refinement provenance.
 * @evidence contracts/common.md#clear-and-simple-design Native reuse and completed-owner observation are optional inputs rather than a second source preparation recipe.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No input geometry field is substituted; supplied native shape arrays are caller-owned and seating may update them before later failure, while final relieved-reference commit has its own stronger boundary.
 * @evidence contracts/common.md#meaningful-documentation Members explain canonical source/state, exact geometry, native reuse and progress exceptions; the producer documents staged mutation ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This input evaluates nothing; prepareHumanFaceReference and native/optical owners carry the costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type schedules no work; its producer reuses a supplied native stage instead of evaluating it twice.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type acquires no handle; the caller/producer own referenced source, stage and observer lifetime.
 *
 * @author Samchon
 */
export interface IHumanFaceReferencePreparationInput {
  /** Actual admitted source basis and its canonical incidence. */
  basis: IAutoMovieHumanFaceBasis;

  /** Current admitted weights; the native owner separates persistent shape. */
  state: ReturnType<typeof humanFaceBasisWeights>;

  /** Actual numerical geometry inputs; no field is replaced for source preparation. */
  geometry?: IHumanFacePoseGeometry;

  /** Existing owned native stage, reused by normal assembly rather than evaluated twice. */
  native?: IHumanFaceNativePose;

  /**
   * Observe actual completed reference owners; exceptions abort preparation.
   * Reports do not certify geometry or roll back earlier stage-owned seating.
   *
   * @evidence contracts/common.md#principled-implementation prepareHumanFaceReference reports only after the named native, lid-seat, relief or replay owner completes.
   * @evidence contracts/common.md#clear-and-simple-design One optional observer exposes existing stage completion without changing geometry or admission conditions.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Observer exceptions propagate; no completion quota or report substitutes for actual source/contact/GPU judgment.
   * @evidence contracts/common.md#meaningful-documentation The comment states completion timing, propagated failure and lack of earlier-seating rollback.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This signature implements no observer work; its supplied callback owns that cost.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This signature schedules no reports; the preparation owner decides actual completed stages.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The signature acquires no resource; its caller owns observer captures and release.
   */
  progress?: (owner: string) => void;
}
