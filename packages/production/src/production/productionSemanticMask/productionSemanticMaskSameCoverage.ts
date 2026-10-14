import { IAutoMovieProductionSemanticMaskCoverage } from "./IAutoMovieProductionSemanticMaskCoverage";

/**
 * Compare coverage counts, unresolved lengths and each visited left identifier. Dense arrays are required for complete ordered equality; every skips sparse holes and this predicate performs no schema or density validation.
 *
 * @evidence contracts/common.md#principled-implementation Count and array-length equality precede every's visited-element equality. This matches ordered coverage identity for dense arrays; a hole on the left is not compared.
 * @evidence contracts/common.md#clear-and-simple-design A small predicate keeps recreated receipt comparison separate from coverage admission and status policy.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No normalization erases a visited mismatch, but the unchecked density premise permits left-side holes to escape comparison. The current coverage verifier also skips holes, so its success alone does not establish density.
 * @evidence contracts/common.md#meaningful-documentation Documents borrowed arrays, the dense-array requirement and sparse-hole limitation; false reports a compared identity difference without classifying malformed schema.
 * @evidence contracts/performance.md#efficient-algorithms Short-circuits scalar/length mismatches and otherwise visits U identifiers with string equality cost. It allocates no copied coverage list and has no U or text-length quota.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work No effectful request or repeated phase is coordinated; the two current receipt records are compared directly without cached work.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Inputs are borrowed and no handle, buffer copy, task or state is retained after the boolean result.
 */
export const productionSemanticMaskSameCoverage: (left: IAutoMovieProductionSemanticMaskCoverage, right: IAutoMovieProductionSemanticMaskCoverage) => boolean = (left: IAutoMovieProductionSemanticMaskCoverage, right: IAutoMovieProductionSemanticMaskCoverage): boolean => left.unaddressed === right.unaddressed &&
    left.unresolved.length === right.unresolved.length &&
    left.unresolved.every((id: string, index: number): boolean => id === right.unresolved[index]);
