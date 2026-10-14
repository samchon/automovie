import type { IHumanBodyConstructionProgress } from "../structures/IHumanBodyConstructionProgress";
import type { IHumanBodyUnderwearEnvelope } from "./IHumanBodyUnderwearEnvelope";

/**
 * Original connected material and the actual normal operation it must restore.
 *
 * @evidence contracts/common.md#principled-implementation Original material points/normals/indices, source-cut mapping and one qualified-ball field define the same connected normal-lift operation to restore.
 * @evidence contracts/common.md#clear-and-simple-design The fit receives fixed material/envelope dependencies and an optional invocation-local observer rather than public document controls.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Source ordinals are cut-material identities rather than native-skin IDs; fitting drops no material face and signed zero lift retains identity.
 * @evidence contracts/common.md#meaningful-documentation Members give posed meter units, qualified-field ownership and synchronous observer omission/exception effects.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Fit-input typing selects no restoration algorithm or native QP strategy.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A shared compiled envelope declares an existing dependency while the fitting owner decides per-candidate reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Borrowed fit inputs acquire no native programs, observer subscription or retained optimization task.
 * @author Samchon
 */
export interface IHumanBodyUnderwearSurfaceFitInput {
  /** Complete original cut positions in posed skin metres. */
  points: readonly number[];

  /**
   * This legacy crease-fit invocation's synchronous scalar observer, independent of the basic skin-material garment. Omission creates no progress readings; callback exceptions abort this same fit. It is not an authored document field.
   *
   * @evidence contracts/common.md#principled-implementation The fitter invokes this optional callback synchronously with actual phase counters and scalar candidate readings from the same restoration invocation.
   * @evidence contracts/common.md#clear-and-simple-design Stage and scalar details expose progress without passing candidate coordinate buffers or adding authored document controls.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Omission skips notification work and thrown observer errors propagate; progress events cannot certify geometric success or clinical cloth validity.
   * @evidence contracts/common.md#meaningful-documentation The callback returns void, is invocation-local, and reports the named legacy fitting phases rather than a separate persistent subscription.
   * @evidence contracts/performance.md#efficient-algorithms Notification record size is bounded by the declared scalar fields; total callback work follows emitted phases plus arbitrary caller-supplied observer cost.
   * @evidence contracts/performance.md#reuse-equivalent-work Events reuse readings already produced by fitting rather than requesting another body or garment evaluation; the observer's own reuse policy is caller-owned.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Fitting retains the callback only for its synchronous invocation and owns no subscription or background task; callers decide whether to retain received records.
   */
  observeFitting?: (
    stage: Extract<
      IHumanBodyConstructionProgress["stage"],
      | "garment-component-read"
      | "garment-envelope-evaluated"
      | "garment-initial-evaluated"
      | "garment-affine-program-assembled"
      | "garment-native-round-completed"
      | "garment-candidate-normals-evaluated"
      | "garment-candidate-vertices-evaluated"
      | "garment-candidate-faces-evaluated"
      | "garment-candidate-evaluated"
      | "garment-proposal-evaluated"
    >,
    details: Pick<
      IHumanBodyConstructionProgress,
      | "completed"
      | "total"
      | "garmentSurface"
      | "garmentComponent"
      | "garmentPhase"
      | "garmentRound"
      | "garmentWorkUsed"
      | "garmentWorkBound"
      | "garmentVariables"
      | "garmentRows"
      | "garmentEntries"
      | "garmentMinimumNonzeroCoefficient"
      | "garmentMaximumCoefficient"
      | "garmentFieldResidualMetres"
      | "garmentGeometryFailures"
      | "garmentFittingRound"
      | "garmentProposal"
    >,
  ) => void;

  /** Actual supplied outward directions at the original material samples. */
  normals: readonly number[];

  /** Original cut triangle incidence; fitting removes no material face. */
  indices: readonly number[];

  /** Existing component member ordinals in the original cut; never native skin IDs. */
  sourceVertices: readonly number[];

  /** One original qualified exterior-ball field shared by fit and evaluation. */
  envelope: IHumanBodyUnderwearEnvelope;

  /** Existing garment ball radius, metres. */
  rho: number;

  /** Existing signed normal lift, metres; zero is the identity. */
  offsetMetres: number;
}
