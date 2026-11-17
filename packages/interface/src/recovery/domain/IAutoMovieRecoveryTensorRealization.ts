import type { IAutoMovieModel, IAutoMovieRecoveryTensorConstruction, IAutoMovieRecoveryTensorReport } from "../../index";

/**
 * Generated ordinary tensor families and their saved ownership replacements.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Generated model parts owning retained mesh arrays. Actual retained control-net lines in model metres.
 * @evidence contracts/development/design.md#principled-representation Generated ordinary tensor families and their saved ownership replacements.
 * @evidence contracts/development/design.md#minimal-and-owned-surface reconstructRecovery, realizeAutoMovieRecoveryTensorFamilies share IAutoMovieRecoveryTensorRealization's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Actual retained control-net lines in model metres.
 */

export interface IAutoMovieRecoveryTensorRealization {
 
 /** Generated model parts owning retained mesh arrays. */
  parts: IAutoMovieModel["parts"];

 
 /** Actual retained control-net lines in model metres. */
  construction: IAutoMovieRecoveryTensorConstruction[];

 
 /** Closed interval:group keys mapped to their generating family identity. */
  replacements: Map<string, string>;

 
 /** Same-order actual family completion and numerical reports. */
  reports: IAutoMovieRecoveryTensorReport[];
}
