

/**
 * File-attributed refusal for an invalid manifest or slice after its owning gate runs. Supplied detail may list only the first five findings; the stable Error stores that text without the complete sink or automatic repair.
 *
 * @evidence contracts/common.md#principled-implementation Native Error names the semantically invalid file and the supplied validation detail.
 * @evidence contracts/common.md#clear-and-simple-design Manifest admission and slice validation share this file-context boundary after their own shape/semantic checks.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Only supplied explanation text survives; truncated first-five detail is not the complete finding population and no record is repaired.
 * @evidence contracts/common.md#meaningful-documentation States the invalid file, supplied semantic explanation, truncated slice-detail scope and stable Error name.
 * @evidence contracts/performance.md#efficient-algorithms Message formatting and native stack allocation depend on explanation text and host stack behavior.
 * @evidence contracts/performance.md#reuse-equivalent-work Each current refusal creates its own message/stack rather than sharing an earlier Error.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Catching callers retain the Error; construction opens no descriptor, token or task.
 */
export class AutoMovieProjectShapeError extends Error {
    public constructor(file: string, detail: string) {
        super(`AutoMovie project file "${file}" is semantically invalid. ` +
            `Fix or remove this file, then call openProject again. ` +
            `Validation detail: ${detail}`);
        this.name = "AutoMovieProjectShapeError";
    }
}
