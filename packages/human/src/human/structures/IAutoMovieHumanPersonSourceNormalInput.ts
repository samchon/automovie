import type { IAutoMovieHumanPersonPerformedSkin } from "./IAutoMovieHumanPersonPerformedSkin";
import type { IAutoMovieHumanPersonSourceNormalReference } from "./IAutoMovieHumanPersonSourceNormalReference";

/**
 * The current performed skin a source normal field is evaluated for, with the final reference skin that normal transport requires. The current-only path ignores the reference.
 *
 * @evidence contracts/common.md#principled-implementation Current performed skin extends the existing shared-frame record with an optional final reference; fixed transport requires that reference while current-only shading ignores it.
 * @evidence contracts/common.md#clear-and-simple-design Inheritance reuses the performed geometry contract and adds only the normal transport dependency.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The optional field preserves the current-only supported path without inventing reference geometry when transport requires it.
 * @evidence contracts/common.md#meaningful-documentation Documentation states when reference is required and when the current-only path does not consume it.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The current skin with optional transport-reference input are a type-level representation; their runtime producer owns traversal and allocation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work No request coordinator is implemented by the current skin with optional transport-reference input; equivalence and invalidation belong to consuming operations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Declaring current skin with optional transport-reference input acquires no handles or running tasks; the object owner controls ordinary data lifetime.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonSourceNormalInput extends IAutoMovieHumanPersonPerformedSkin {
  /** The final reference skin, required by normal transport. */
  reference?: IAutoMovieHumanPersonSourceNormalReference;
}
