import { IAutoMovieScreenplayIndex } from "@automovie/interface";
import typia, { IValidation } from "typia";

/**
 * Admit the exact IAutoMovieScreenplayIndex structural shape for the optional screenplay-index loader.
 *
 * @evidence contracts/common.md#principled-implementation Uses compile-time typia validateEquals generation for IAutoMovieScreenplayIndex, reporting structural mismatches and undeclared keys without maintaining a second handwritten shape validator; stable scene/beat linkage, authored lock history and production coverage remain separate semantic checks.
 * @evidence contracts/common.md#clear-and-simple-design Owns one schema boundary used by the optional screenplay-index loader; the enclosing reader or mutation operation attributes a failing validation to its file or requested edit.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No malformed record is repaired, coerced or accepted for a particular project; generated structural admission does not certify stable scene/beat linkage, authored lock history and production coverage.
 * @evidence contracts/common.md#meaningful-documentation Names the exact admitted schema and its actual consumers, distinguishing an IValidation result from throwing file-attributed admission and from downstream semantic validity.
 * @evidence contracts/performance.md#efficient-algorithms Generated checks visit the input structure required by this schema and its exact-key checks, with nested array/object populations and reported mismatch count driving time and error space; no project filesystem or media payload is read here.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work One unknown mutable value is checked per call, so an earlier validation result cannot prove a later value unchanged and no cross-call validation cache is maintained.
 * @evidence contracts/performance.md#bound-retention-and-release-resources On success IValidation exposes the original admitted value rather than cloning it; on failure mismatch records transfer to the caller, with no descriptor, lock or task acquired.
 */
export function productionProjectValidateScreenplayIndex(input: unknown): IValidation<IAutoMovieScreenplayIndex> {
    return typia.validateEquals<IAutoMovieScreenplayIndex>(input);
}
