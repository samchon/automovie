import type { IAutoMovieRecoveryEventChart } from "../../index";

/**
 * Two closed paths joined by one shared periodic seam arc.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Left and right reference the same seam occurrence authority.
 * @evidence contracts/development/design.md#principled-representation Two closed paths joined by one shared periodic seam arc.
 * @evidence contracts/development/design.md#minimal-and-owned-surface prepareAutoMovieRecoveryAnnularChart share IAutoMovieRecoveryAnnularChart's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
 */

export interface IAutoMovieRecoveryAnnularChart extends IAutoMovieRecoveryEventChart {
  /** Left and right reference the same seam occurrence authority. */
  periodic: true;
}
