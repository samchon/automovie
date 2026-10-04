import type {
  IAutoMovieMeshQueryBudget,
  IAutoMovieMeshSeparationAttachment,
} from "@automovie/engine";

import type { IHumanFaceHairSeparationReaders } from "./IHumanFaceHairSeparationReaders";

/**
 * The per-curve context `fitHumanFaceHairRibbonRows` certifies one ribbon in.
 *
 * The readers and budget are shared with the rest of the curve's lock; the
 * budget is spent in place. `attachment` is the curve's canonical root seat,
 * required whenever the first row is the root.
 *
 * @evidence contracts/common.md#principled-implementation Supplies exactly the requested gap, both coordinate proofs, the shared work bound and the root registration the fitter needs.
 * @evidence contracts/common.md#clear-and-simple-design Named members replace an anonymous parameter object; the readers keep their own named pair.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Carries no subject, tolerance or iteration limit.
 * @evidence contracts/common.md#meaningful-documentation States sharing, mutation and when the attachment is required.
 * @evidence contracts/modeling.md#spatial-conventions The clearance is head-local metres, the frame of every row and reader.
 * @evidenceExclude contracts/modeling.md#parameter-channels The clearance is the existing admitted layer value; no channel is defined.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The fitter emits the rows.
 * @evidence contracts/modeling.md#shared-boundaries The attachment registers the root on the same host skin the readers measure.
 * @evidenceExclude contracts/modeling.md#rendered-observation The hair builder owns observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Numerical geometry only.
 * @evidenceExclude contracts/anatomy.md#permitted-range Defines no clinical range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Derived context, not a personal control.
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
