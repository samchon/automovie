import type {
  IAutoMovieMeshQueryBudget,
  IAutoMovieMeshSeparationAttachment,
} from "@automovie/engine";

import type { IHumanFaceHairSeparationReaders } from "./IHumanFaceHairSeparationReaders";

/**
 * The per-curve context `fitHumanFaceHairRibbonRows` certifies one ribbon in.
 *
 * The readers and budget are shared with the rest of the curve's lock; the budget is spent in place. `attachment` is the curve's canonical root seat, required whenever the first row is the root.
 *
 * @evidence contracts/common.md#principled-implementation Binary64 and represented separation readers share a curve's budget and canonical root seat, distinguishing attached root rows from strictly separated stems.
 * @evidence contracts/common.md#clear-and-simple-design Extending the common separation-reader pair adds only per-curve clearance, accounting and optional root registration.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Undefined attachment means no root row exists, not permission to waive root-seat validation for an emitted attached root.
 * @evidence contracts/common.md#meaningful-documentation The comment states metre clearance, root/stem distinction, in-place query spending and attachment omission semantics.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This fit-context type selects no row narrowing or swept-cell algorithm; fitHumanFaceHairRibbonRows owns those geometry checks.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Separation readers and the lock budget are shared with preceding curve phases, while the root registration stays curve-specific.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The context borrows compiled separation readers and accounting without owning another mesh snapshot or ongoing task.
 *
 * @author Samchon
 */
export interface IHumanFaceHairRibbonFitContext extends IHumanFaceHairSeparationReaders {
  /** Requested free-row clearance in metres; stem rows require strict separation. */
  clearance: number;

  /** The curve's shared work budget, spent in place by every new query. */
  budget: IAutoMovieMeshQueryBudget;

  /** Canonical root seat of the curve, or undefined when no root row exists. */
  attachment: IAutoMovieMeshSeparationAttachment | undefined;
}
