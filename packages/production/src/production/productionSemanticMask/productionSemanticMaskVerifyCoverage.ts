import { IAutoMovieProductionSemanticMaskCoverage } from "./IAutoMovieProductionSemanticMaskCoverage";
import { productionSemanticMaskExactKeys } from "./productionSemanticMaskExactKeys";
import { productionSemanticMaskNonBlank } from "./productionSemanticMaskNonBlank";

/**
 * Check a typed coverage record's keys, non-negative safe integer count and visited unresolved identifiers for non-blank strict order. Array density is not checked: sparse holes can escape the some callback. Nonzero gaps remain observations for the classifier to judge.
 *
 * @evidence contracts/common.md#principled-implementation Exact-key and safe-integer checks precede some's visited-element trim and adjacent code-unit comparison. A dense string array is needed to establish order/uniqueness for every position, and this verifier does not independently establish that premise.
 * @evidence contracts/common.md#clear-and-simple-design Coverage schema validation stays separate from zero-gap final delivery policy so incomplete preview observations remain inspectable.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Identifiers are not normalized into acceptance, but some skips sparse holes, leaving a density-admission gap for direct host arrays. Parsed JSON arrays and dense capture arrays must not be treated as proof that every typed caller supplies a dense array.
 * @evidence contracts/common.md#meaningful-documentation Documents typed input, the unchecked dense-array premise, count/order checks and the difference between these checks and complete runtime coverage.
 * @evidence contracts/performance.md#efficient-algorithms Own-key sorting adds K log K comparisons; unresolved array scanning costs O(U) visits plus string trim/order character work. Actual keys, U and identifier lengths are uncapped here; validation creates only key/trim temporaries and no replacement coverage array.
 * @evidence contracts/performance.md#reuse-equivalent-work One adjacent-id comparison validates order and uniqueness together; no verdict is cached because a borrowed coverage array can change.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Coverage remains borrowed and unchanged. Key/trim temporaries are invocation-local, with no handle, asynchronous task or persistent population owned by this verifier.
 */
export const productionSemanticMaskVerifyCoverage: (coverage: IAutoMovieProductionSemanticMaskCoverage) => void = (coverage: IAutoMovieProductionSemanticMaskCoverage): void => {
    productionSemanticMaskExactKeys(coverage, ["unresolved", "unaddressed"], "coverage");
    if (Number.isSafeInteger(coverage.unaddressed) === false ||
        coverage.unaddressed < 0)
        throw new Error("invalid semantic coverage unaddressed count; expected a non-negative safe integer");
    if (coverage.unresolved.some((id: string, index: number): boolean => productionSemanticMaskNonBlank(id) === false ||
        (index !== 0 && coverage.unresolved[index - 1]! >= id)))
        throw new Error("invalid semantic coverage unresolved ids; expected non-blank sorted unique ids");
};
