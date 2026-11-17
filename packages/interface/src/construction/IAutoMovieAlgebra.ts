import type { IAutoMovieConicFieldJet } from "./IAutoMovieConicFieldJet";

/**
 * Scalar operation contract shared with the numeric source.
 *
 * @evidence contracts/development/design.md#principled-representation The alias preserves ConicFieldJet.IAlgebra's scalar operations for numbers or two-coordinate source jets; T selects that arithmetic representation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface ConicFieldJet owns the operation contract shared by ConicArcField and ConicHermiteField; the alias adds no competing members.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The generic represents the two exercised scalar algebras, not arbitrary geometry or an escape from required derivatives.
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the canonical algebra and numeric/source-jet uses.
 */
export type IAutoMovieAlgebra<T> = IAutoMovieConicFieldJet.IAlgebra<T>;
