import type { IHumanBodyUnderwearLiftConstraint } from "./IHumanBodyUnderwearLiftConstraint";
import type { IHumanBodyUnderwearLiftDerivativeFailure } from "./IHumanBodyUnderwearLiftDerivativeFailure";

/**
 * Sparse actual-lift proposals and explicit derivative-domain failures.
 *
 * @evidence contracts/common.md#principled-implementation Rows and unavailable derivative records remain distinct, so a partial local proposal cannot silently claim complete differentiability or final geometric acceptance.
 * @evidence contracts/common.md#clear-and-simple-design One result transfers sparse proposals and their unresolved domains to the existing fitting owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not promote an empty failure list or a solver row into an embedding, convergence or acceptance certificate.
 * @evidence contracts/common.md#meaningful-documentation Documents the proposal scope and the fitting owner's responsibility for unavailable rows.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Numerical garment data defines no independent part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Carries existing material values without adding an authoring trait.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Computes no new render primitive.
 * @evidence contracts/modeling.md#spatial-conventions Contains dimensionless constraint rows with inverse-metre gradients; located failure indices introduce no coordinate conversion.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Retains caller-owned incidence and defines no new geometric join.
 * @evidenceExclude contracts/modeling.md#rendered-observation The actual garment emitter owns rendered verification; local derivatives establish no appearance.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Introduces no anatomical quantity or measured range.
 * @evidenceExclude contracts/anatomy.md#permitted-range The anatomical and field owners retain admission; this operation measures only local orientation.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Internal candidate coordinates are not a public sculpting channel.
 * @author Samchon
 */
export interface IHumanBodyUnderwearLiftLinearization {
  /** Local signed orientation rows; these do not certify global embedding. */
  rows: IHumanBodyUnderwearLiftConstraint[];

  /** Unavailable rows or normals, retained for the fitting owner to report. */
  unavailable: IHumanBodyUnderwearLiftDerivativeFailure[];
}
